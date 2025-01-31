/*******************************************************************************
 * This file is part of the Incubed project.
 * Sources: https://github.com/slockit/in3-server
 * 
 * Copyright (C) 2018-2019 slock.it GmbH, Blockchains LLC
 * 
 * 
 * COMMERCIAL LICENSE USAGE
 * 
 * Licensees holding a valid commercial license may use this file in accordance 
 * with the commercial license agreement provided with the Software or, alternatively, 
 * in accordance with the terms contained in a written agreement between you and 
 * slock.it GmbH/Blockchains LLC. For licensing terms and conditions or further 
 * information please contact slock.it at in3@slock.it.
 * 	
 * Alternatively, this file may be used under the AGPL license as follows:
 *    
 * AGPL LICENSE USAGE
 * 
 * This program is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public License as published by the Free Software 
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY 
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A 
 * PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 * [Permissions of this strong copyleft license are conditioned on making available 
 * complete source code of licensed works and modifications, which include larger 
 * works using a licensed work, under the same license. Copyright and license notices 
 * must be preserved. Contributors provide an express grant of patent rights.]
 * You should have received a copy of the GNU Affero General Public License along 
 * with this program. If not, see <https://www.gnu.org/licenses/>.
 *******************************************************************************/
import BaseHandler from './BaseHandler'
import * as util  from '../util/util'
import { IN3RPCHandlerConfig, AppContext } from '../types/types'
import * as fs from 'fs'
import * as scryptsy from 'scrypt.js'
import * as cryp from 'crypto'
import * as ethUtil from 'ethereumjs-util'
import { registerNodes } from '../util/registry'
import * as logger from '../util/logger'
import { PK, createPK } from './signatures'

export function checkPrivateKey(config: IN3RPCHandlerConfig) {
  if ((config as any)._pk) return
  if (!config.privateKey) return

  const key = config.privateKey
  delete config.privateKey

  if ((key as any).address && (key as any).sign) {
    (config as any)._pk = key
    return
  }

  if (key.startsWith('0x')) {
    if (key.length != 66) throw new Error('The private key needs to have a length of 32 bytes!')
    logger.error("using a raw privated key is strongly discouraged!");
    (config as any)._pk = createPK(Buffer.from(key.substr(2), 'hex'))
    return
  }
  const password = process.env.IN3KEYPASSPHRASE || config.privateKeyPassphrase
  delete config.privateKeyPassphrase

  try {
    const json = JSON.parse(fs.readFileSync(key, 'utf8'))
    if (json.version !== 3)
      throw new Error('Not a valid V3 wallet')

    let derivedKey: any

    if (json.crypto.kdf === 'scrypt') {
      const kdfparams = json.crypto.kdfparams;
      derivedKey = scryptsy(new Buffer(password), new Buffer(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen)
    } else if (json.crypto.kdf === 'pbkdf2') {
      const params = json.crypto.kdfparams;

      if (params.prf !== 'hmac-sha256')
        throw new Error('Unsupported parameters to PBKDF2')

      derivedKey = cryp.pbkdf2Sync(new Buffer(password), new Buffer(params.salt, 'hex'), params.c, params.dklen, 'sha256')
    } else
      throw new Error('Unsupported key derivation scheme')

    const ciphertext = new Buffer(json.crypto.ciphertext, 'hex');
    const mac = ethUtil.keccak(Buffer.concat([derivedKey.slice(16, 32), ciphertext])).toString('hex')
    if (mac !== json.crypto.mac)
      throw new Error('Key derivation failed - possibly wrong password given in --privateKeyPassphrase command line arg or IN3KEYPASSPHRASE env variable.');

    const decipher = cryp.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), new Buffer(json.crypto.cipherparams.iv, 'hex'));
    (config as any)._pk = createPK(Buffer.concat([decipher.update(ciphertext), decipher.final()]))
  } catch (ex) {
    throw new Error('Could not decode the private : ' + ex.message)
  }

}

export async function checkRegistry(handler: BaseHandler, context?: AppContext): Promise<any> {
  checkPrivateKey(handler.config)

  //first checking if server is registered in registry or not
  const nl = await handler.getNodeList(false);
  const pk: PK = (handler.config as any)._pk
  if (pk && !nl.nodes.find(_ => _.address.toLowerCase() === pk.address.toLowerCase()))
    logger.error("IN3 Server " + pk.address.toLowerCase() + " is not registered in contract " + handler.config.registry + " for chain ID "+handler.chainId);

  //now moving on to normal auto registry checks and functionality
  if (!handler.config.registry || !handler.config.autoRegistry)
    return


  const autoReg = handler.config.autoRegistry
  if (nl.nodes.find(_ => _.url === autoReg.url))
    // all is well we are already registered
    return

  const units = {
    ether: '1000000000000000000',
    finney: '1000000000000000',
    szabo: '1000000000000',
    gwei: 1000000000,
    nano: 1000000000,
    mwei: 1000000,
    pico: 1000000,
    kwei: 1000,
    wei: 1
  }
  const unit = autoReg.depositUnit || 'ether'
  if (!units[unit]) throw new Error('The unit ' + unit + ' is not supported, only ' + Object.keys(units).join())
  const caps = autoReg.capabilities || {}
  const deposit = '0x' + util.toBN(autoReg.deposit || 0).mul(util.toBN(units[unit])).toString(16)
  const props = util.toHex((caps.proof ? 1 : 0) + (caps.multiChain ? 2 : 0))

  //check balance
  const balance = parseInt((await handler.getFromServer({ method: 'eth_getBalance', params: [pk.address] })).result as any)
  const txGasPrice = parseInt((await handler.getFromServer({ method: 'eth_gasPrice', params: [] })).result as any)

  const registrationCost = txGasPrice * 1000000

  context?.hub.addBreadcrumb({
    category: "autoregister",
    data: {
      request: {
        url: autoReg.url,
        props: props,
        deposit: deposit
      },
      chainId: handler.chainId,
      registryRPC: handler.config.registryRPC || handler.config.rpcUrl[0],
      balance: balance,
    }
  })

  if (balance < (autoReg.deposit + registrationCost))
    throw new Error("Insufficient funds to register a server, need: " + autoReg.deposit + " ether, have: " + balance + " wei")

  await registerNodes((handler.config as any)._pk, handler.config.registry, [{
    url: autoReg.url,
    pk: (handler.config as any)._pk,
    props,
    deposit: deposit as any,
    timeout: 3600
  }], handler.chainId, handler.config.registryRPC || handler.config.rpcUrl[0], undefined, false, context).catch(_ => {
    throw new Error("Error trying to register node")
  })
}
