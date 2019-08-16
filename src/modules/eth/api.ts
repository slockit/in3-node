
import { methodID } from 'ethereumjs-abi'
import { toChecksumAddress, privateToAddress, keccak, ecsign } from 'ethereumjs-util'
import {  util  } from 'in3-common'
import BN = require('bn.js')
import { AbiCoder, Interface, Fragment } from '@ethersproject/abi'
import { RPCResponse } from '../../model/types';

export type BlockType = number | 'latest' | 'earliest' | 'pending'
export type Hex = string
export type Quantity = number | Hex
export type Hash = Hex
export type Address = Hex
export type Data = Hex

export type Signature = {
    message: Data
    messageHash: Hash
    v: Hex
    r: Hash
    s: Hash
    signature?: Data
}

export type ABIField = {
    indexed?: boolean
    name: string
    type: string
}
export type ABI = {
    anonymous?: boolean
    constant?: boolean
    payable?: boolean
    stateMutability?: 'nonpayable' | 'payable' | 'view' | 'pure'

    inputs?: ABIField[],
    outputs?: ABIField[]
    name?: string
    type: 'event' | 'function' | 'constructor' | 'fallback'
}
export type Transaction = {
    /** 20 Bytes - The address the transaction is send from. */
    from: Address
    /** (optional when creating new contract) 20 Bytes - The address the transaction is directed to.*/
    to: Address
    /** Integer of the gas provided for the transaction execution. eth_call consumes zero gas, but this parameter may be needed by some executions. */
    gas: Quantity
    /** Integer of the gas price used for each paid gas.  */
    gasPrice: Quantity
    /** Integer of the value sent with this transaction. */
    value: Quantity
    /** 4 byte hash of the method signature followed by encoded parameters. For details see Ethereum Contract ABI.*/
    data: string
    /** nonce */
    nonce: Quantity
    /** optional chain id */
    chainId?: any
}
export type TransactionReceipt = {
    /** 32 Bytes - hash of the block where this transaction was in. */
    blockHash: Hash
    /** block number where this transaction was in.*/
    blockNumber: BlockType
    /** 20 Bytes - The contract address created, if the transaction was a contract creation, otherwise null.*/
    contractAddress: Address
    /** The total amount of gas used when this transaction was executed in the block. */
    cumulativeGasUsed: Quantity
    /** 20 Bytes - The address of the sender. */
    from: Address
    /** 20 Bytes - The address of the receiver. null when it’s a contract creation transaction.*/
    to: Address
    /** The amount of gas used by this specific transaction alone. */
    gasUsed: Quantity
    /** Array of log objects, which this transaction generated. */
    logs: Log[]
    /** 256 Bytes - A bloom filter of logs/events generated by contracts during transaction execution. Used to efficiently rule out transactions without expected logs.*/
    logsBloom: Data
    /** 32 Bytes - Merkle root of the state trie after the transaction has been executed (optional after Byzantium hard fork EIP609)*/
    root: Hash
    /** 0x0 indicates transaction failure , 0x1 indicates transaction success. Set for blocks mined after Byzantium hard fork EIP609, null before. */
    status: Quantity
    /** 32 Bytes - hash of the transaction. */
    transactionHash: Hash
    /** Integer of the transactions index position in the block. */
    transactionIndex: Quantity
}
export type TransactionDetail = {
    /**  32 Bytes - hash of the transaction. */
    hash: Hash
    /** the number of transactions made by the sender prior to this one.*/
    nonce: Quantity
    /** 32 Bytes - hash of the block where this transaction was in. null when its pending.*/
    blockHash: Hash
    /** block number where this transaction was in. null when its pending.*/
    blockNumber: BlockType
    /** integer of the transactions index position in the block. null when its pending.*/
    transactionIndex: Quantity
    /** 20 Bytes - address of the sender.*/
    from: Address
    /** 20 Bytes - address of the receiver. null when its a contract creation transaction. */
    to: Address
    /**  value transferred in Wei.*/
    value: Quantity
    /** gas price provided by the sender in Wei.*/
    gasPrice: Quantity
    /** gas provided by the sender. */
    gas: Quantity
    /** the data send along with the transaction. */
    input: Data
    /** the standardised V field of the signature.*/
    v: Quantity
    /** the standardised V field of the signature (0 or 1).*/
    standardV: Quantity
    /** the R field of the signature.*/
    r: Quantity
    /** raw transaction data */
    raw: Data
    /** public key of the signer. */
    publicKey: Hash
    /** the chain id of the transaction, if any. */
    chainId: Quantity
    /** creates contract address */
    creates: Address
    /** (optional) conditional submission, Block number in block or timestamp in time or null. (parity-feature)    */
    condition: any
    /** optional: the private key to use for signing */
    pk?: any
}

export type Block = {
    /**  The block number. null when its pending block */
    number: Quantity
    /** hash of the block. null when its pending block */
    hash: Hash
    /** hash of the parent block */
    parentHash: Hash
    /** 8 bytes hash of the generated proof-of-work. null when its pending block. Missing in case of PoA. */
    nonce: Data
    /** SHA3 of the uncles data in the block */
    sha3Uncles: Data
    /** 256 Bytes - the bloom filter for the logs of the block. null when its pending block */
    logsBloom: Data
    /** 32 Bytes - the root of the transaction trie of the block */
    transactionsRoot: Data
    /** 32 Bytes - the root of the final state trie of the block */
    stateRoot: Data
    /** 32 Bytes - the root of the receipts trie of the block */
    receiptsRoot: Data
    /** 20 Bytes - the address of the author of the block (the beneficiary to whom the mining rewards were given)*/
    author: Address
    /** 20 Bytes - alias of ‘author’*/
    miner: Address
    /** integer of the difficulty for this block */
    difficulty: Quantity
    /** integer of the total difficulty of the chain until this block */
    totalDifficulty: Quantity
    /** the ‘extra data’ field of this block */
    extraData: Data
    /** integer the size of this block in bytes */
    size: Quantity
    /** the maximum gas allowed in this block */
    gasLimit: Quantity
    /** the total used gas by all transactions in this block */
    gasUsed: Quantity
    /** the unix timestamp for when the block was collated */
    timestamp: Quantity
    /** Array of transaction objects, or 32 Bytes transaction hashes depending on the last given parameter */
    transactions: (Hash | Transaction)[]
    /** Array of uncle hashes */
    uncles: Hash[]
    /** PoA-Fields */
    sealFields: Data[]
}
export type Log = {
    /** true when the log was removed, due to a chain reorganization. false if its a valid log. */
    removed: boolean
    /** integer of the log index position in the block. null when its pending log. */
    logIndex: Quantity
    /** integer of the transactions index position log was created from. null when its pending log. */
    transactionIndex: Quantity
    /** Hash, 32 Bytes - hash of the transactions this log was created from. null when its pending log. */
    transactionHash: Hash
    /** Hash, 32 Bytes - hash of the block where this log was in. null when its pending. null when its pending log. */
    blockHash: Hash,
    /** the block number where this log was in. null when its pending. null when its pending log. */
    blockNumber: Quantity
    /** 20 Bytes - address from which this log originated. */
    address: Address,
    /**  contains the non-indexed arguments of the log. */
    data: Data
    /** - Array of 0 to 4 32 Bytes DATA of indexed log arguments. (In solidity: The first topic is the hash of the signature of the event (e.g. Deposit(address,bytes32,uint256)), except you declared the event with the anonymous specifier.) */
    topics: Data[]
}

export type LogFilter = {
    /**  Quantity or Tag - (optional) (default: latest) Integer block number, or 'latest' for the last mined block or 'pending', 'earliest' for not yet mined transactions. */
    fromBlock: BlockType
    /** Quantity or Tag - (optional) (default: latest) Integer block number, or 'latest' for the last mined block or 'pending', 'earliest' for not yet mined transactions.*/
    toBlock: BlockType
    /** (optional) 20 Bytes - Contract address or a list of addresses from which logs should originate.*/
    address: Address
    /** (optional) Array of 32 Bytes Data topics. Topics are order-dependent. It’s possible to pass in null to match any topic, or a subarray of multiple topics of which one should be matching. */
    topics: (string | string[])[]
    /** å(optional) The maximum number of entries to retrieve (latest first). */
    limit: Quantity
}

export type TxRequest = {
    /** contract */
    to?: Address

    /** address of the account to use */
    from?: Address

    /** the data to send */
    data?: Data

    /** the gas needed */
    gas?: number

    /** the gasPrice used */
    gasPrice?: number

    /** the nonce */
    nonce?: number

    /** the value in wei */
    value?: Quantity

    /** the ABI of the method to be used */
    method?: string

    /** the argument to pass to the method */
    args?: any[]

    /**raw private key in order to sign */
    pk?: Hash

    /**  number of block to wait before confirming*/
    confirmations?: number
}

/** converts it to a Buffer  */
const bytes = val => util.toBuffer(val)

function convertToType(solType: string, v: any): any {
    // check for arrays
    const list = solType.lastIndexOf('[')
    if (list >= 0) {
        if (!Array.isArray(v)) throw new Error('Invalid result for type ' + solType + '. Value must be an array, but is not!')
        solType = solType.substr(0, list)
        return v.map(_ => convertToType(solType, _))
    }

    // convert integers
    if (solType.startsWith('uint')) return parseInt(solType.substr(4)) <= 32 ? util.toNumber(v) : util.toBN(v)
    if (solType.startsWith('int')) return parseInt(solType.substr(3)) <= 32 ? util.toNumber(v) : util.toBN(v) // TODO handle negative values
    if (solType === 'bool') return typeof (v) === 'boolean' ? v : (util.toNumber(v) ? true : false)
    if (solType === 'string') return v.toString('utf8')
    if (solType === 'address') return toChecksumAddress('0x' + v)
    //    if (solType === 'bytes') return toBuffer(v)

    // everything else will be hexcoded string
    if (Buffer.isBuffer(v)) return '0x' + v.toString('hex')
    if (v && v.ixor) return '0x' + v.toString(16)
    return v[1] !== 'x' ? '0x' + v : v
}

function decodeResult(types: string[], result: Buffer): any {
    const abiCoder = new AbiCoder()

    return abiCoder.decode(types, result).map((v, i) => convertToType(types[i], v))
}

function createCallParams(method: string, values: any[]): { txdata: string, convert: (a: any) => any } {
    if (!method) throw new Error('method needs to be a valid contract method signature')
    if (method.indexOf('(') < 0) method += '()'
    const methodRegex = /^\w+\((.*)\)$/gm
    let convert = null

    if (method.indexOf(':') > 0) {
        const srcFullMethod = method;
        const retTypes = method.split(':')[1].substr(1).replace(')', ' ').trim().split(',');
        convert = result => {
            if (result) result = decodeResult(retTypes, Buffer.from(result.substr(2), 'hex'))
            if (Array.isArray(result) && (!srcFullMethod.endsWith(')') || result.length == 1))
                result = result[0]
            return result
        }
        method = method.substr(0, method.indexOf(':'))
    }

    const m = methodRegex.exec(method)
    if (!m) throw new Error('No valid method signature for ' + method)
    const types = m[1].split(',').filter(_ => _)
    if (values.length < types.length) throw new Error('invalid number of arguments. Must be at least ' + types.length)
    values.forEach((v, i) => {
        if (types[i] === 'bytes') values[i] = util.toBuffer(v)
    })

    return {
        txdata: '0x' + (values.length
            ? encodeFunction(method, values)
            : methodID(method.substr(0, method.indexOf('(')), []).toString('hex'))
        , convert
    }
}

export function createSignatureHash(def: ABI) {
    return keccak(def.name + createSignature(def.inputs))
}

export function createSignature(fields: ABIField[]): string {
    return '(' + fields.map(f => {
        let baseType = f.type
        const t = baseType.indexOf('[')
        if (t > 0) baseType = baseType.substr(0, t)
        if (baseType === 'uint' || baseType === 'int') baseType += '256'
        return baseType + (t < 0 ? '' : f.type.substr(t))
    }).join(',') + ')'
}
function parseABIString(def: string): ABI {
    const [name, args] = def.split(/[\(\)]/)
    return {
        name, type: 'event', inputs: args.split(',').filter(_ => _).map(_ => _.split(' ').filter(z => z)).map(_ => ({
            type: _[0],
            name: _[_.length - 1],
            indexed: _[1] == 'indexed'
        }))
    }
}

function decodeEventData(log: Log, def: string | { _eventHashes: any }): any {
    let d: ABI = (typeof def === 'object') ? def._eventHashes[log.topics[0]] : parseABIString(def)
    if (!d) return null//throw new Error('Could not find the ABI')
    return decodeEvent(log, d)
}
export function decodeEvent(log: Log, d: ABI): any {
    const indexed = d.inputs.filter(_ => _.indexed), unindexed = d.inputs.filter(_ => !_.indexed), r: any = { event: d && d.name }
    if (indexed.length)
        decodeResult(indexed.map(_ => _.type), Buffer.concat(log.topics.slice(1).map(bytes))).forEach((v, i) => r[indexed[i].name] = v)
    if (unindexed.length)
        decodeResult(unindexed.map(_ => _.type), bytes(log.data)).forEach((v, i) => r[unindexed[i].name] = v)
    return r
}

function encodeEtheresBN(val: any) {
    return val && BN.isBN(val) ? util.toHex(val) : val
}

export function soliditySha3(...args: any[]): string {

    const abiCoder = new AbiCoder()
    return util.toHex(keccak(abiCoder.encode(args.map(_ => {
        switch (typeof (_)) {
            case 'number':
                return _ < 0 ? 'int256' : 'uint256'
            case 'string':
                return _.substr(0, 2) === '0x' ? 'bytes' : 'string'
            case 'boolean':
                return 'bool'
            default:
                return BN.isBN(_) ? 'uint256' : 'bytes'
        }
    }), args.map(encodeEtheresBN))))
}

function toHexBlock(b: any): string {
    return typeof b === 'string' ? b : util.toMinHex(b)
}

export function encodeFunction(signature: string, args: any[]): string {
    const inputParams = signature.split(':')[0]

    const abiCoder = new AbiCoder()

    const typeTemp = inputParams.substring(inputParams.indexOf('(') + 1, (inputParams.indexOf(')')))

    const typeArray = typeTemp.length > 0 ? typeTemp.split(",") : []
    const methodHash = (methodID(signature.substr(0, signature.indexOf('(')), typeArray)).toString('hex')

    return methodHash + abiCoder.encode(typeArray, args.map(encodeEtheresBN)).substr(2)
}

export function decodeFunction(signature: string, args: Buffer | RPCResponse): any {
    const outputParams = signature.split(':')[1]

    const abiCoder = new AbiCoder()

    const typeTemp = outputParams.substring(outputParams.indexOf('(') + 1, (outputParams.indexOf(')')))

    const typeArray = typeTemp.length > 0 ? typeTemp.split(",") : []

    return abiCoder.decode(typeArray, util.toBuffer(args))
}