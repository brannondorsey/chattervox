import * as fs from 'fs'
import * as crypto from 'crypto'
import * as util from 'util'
import { ec as EC } from 'elliptic'
const ec = new EC('p192')

type Curve = 'p192'

interface Key {
    curve: Curve,
    public: string
    private?: string
}

type keystore = { [callsign: string]: Key[] }

/**
 * @class Keystore
 * A class for managing keys, signatures, and signature verification
 */
class Keystore {
    
    path: string
    _keystore: keystore

    /**@constructor
     * @param  {string} path The path to a JSON keystore file. If path does not exist it is created.
     */
    constructor(path: string) {
        
        this.path = path
        this._keystore = {}

        if (!this._exists()) {
            this._save()
        } else {
            this._keystore = this._load()
        }
    }
    
    /**
     * @method addPublicKey
     * @param  {string} callsign
     * @param  {string} pubkeyHex
     */
    addPublicKey(callsign: string, pubkeyHex: string): void {
        this._addKey(callsign, pubkeyHex, undefined)
    }

    // only used for you
    /**
     * @param  {string} callsign
     * @returns {object} keypair object 
     */
    genKeyPair(callsign: string): Key {
        const key = ec.genKeyPair()
        const pub = key.getPublic('hex')
        const priv = key.getPrivate('hex')
        this._addKey(callsign, pub, priv)
        return { public: pub, private: priv, curve: 'p192'}
    }
    /**
     * @param  {string} callsign
     * @param  {string} pubkeyHex
     * @returns {boolean} True if a key was removed from the keystore.
     */
    revoke(callsign: string, pubkeyHex: string): boolean {
        
        // callsign not in keystore, no key is revoked
        if (!this._keystore.hasOwnProperty(callsign)) return false
        
        // number of keys before the filter
        const length = this._keystore[callsign].length
        this._keystore[callsign] = this._keystore[callsign].filter((key: Key) => {
            return key.public !== pubkeyHex
        })
        
        if (this._keystore[callsign].length !== length) {
            this._save()
            return true
        }

        return false
    }

    /**
     * @method getPublicKeys
     * @param  {string} callsign
     * @returns {string[]} An array of public keys associated with a call sign.
     */
    getPublicKeys(callsign: string): string[] {
        if (!this._keystore.hasOwnProperty(callsign)) return []
        return this._keystore[callsign].map(key => key.public)
    }

    /**@method getKeyPairs
     * @param  {string} callsign
     * @returns {object[]} An array of keypair objects { public: 'hex', private: 'hex' }
     */
    getKeyPairs(callsign: string): Key[] {
        if (!this._keystore.hasOwnProperty(callsign)) return []
        return this._keystore[callsign].filter(key => {
            return typeof key.public === 'string' && typeof key.private === 'string'
        })
    }

    
    /**@method sign
     * @param  {string} message A string containing a message to sign.
     * @param  {string} privateHex A private key as a string of hex characters.
     * @returns {Buffer} A message signature.
     */
    sign(message: string, privateHex: string): Buffer {
        const key = ec.keyFromPrivate(privateHex)
        const hash: Buffer = this.sha256(message)
        const signature = key.sign(hash).toDER()
        return new Buffer(signature)
    }

    
    /**@method verify
     * @param  {string} callsign
     * @param  {string} message
     * @param  {Buffer} signature
     * @returns {boolean} True if the message signature is valid
     */
    verify(callsign: string, message: string, signature: Buffer): boolean {
        const hash = this.sha256(message)
        for (let publicKey of this.getPublicKeys(callsign)) {
            const key = ec.keyFromPublic(publicKey, 'hex')
            if (key.verify(hash, signature)) return true
        }
        return false
    }

    /**
     * @method sha256
     * @param  {string} message
     * @return {Buffer} The SHA 256 message digest
     */
    sha256(message: string): Buffer {
        return crypto.createHash('sha256')
               .update(message, 'utf8')
               .digest()
    }

    _addKey(callsign: string, publicHex: string, privateHex?: string): void {

        if (typeof callsign !== 'string') throw TypeError('callsign must be a string type')
        if (typeof publicHex !== 'string') throw TypeError('publicHex must be a string type')
        if (typeof privateHex !== 'undefined' && typeof privateHex !== 'string') throw TypeError('if privateHex is not undefined it must be a string type')

        if (!this._keystore.hasOwnProperty(callsign)) {
            this._keystore[callsign] = []
        }

        const key: Key = { public: publicHex, curve: 'p192' }
        if (privateHex) key.private = privateHex
        this._keystore[callsign].push(key)
        this._save()
    }

    _save(): void {
        fs.writeFileSync(this.path, JSON.stringify(this._keystore, null, '\t'))
    }

    _load(): keystore {
        return JSON.parse(fs.readFileSync(this.path).toString('utf8'))
    }

    _exists(): boolean {
        return fs.existsSync(this.path)
    }
}

module.exports = Keystore

// const keyFromPrivate = ec.keyFromPrivate(priv)
// console.log(keyFromPrivate)

// const keyFromPublic = ec.keyFromPublic(pub, 'hex')
// console.log(keyFromPublic)

// const pub = key.getPublic('hex')
// const priv = key.getPrivate('hex')

// const message = 'This is a signed message. try something else!'
// const buff = new Buffer.from(message, 'utf8')
// const signature = key.sign(buff).toDER()
// const signatureBuff = new Buffer(signature)
// const verify = key.verify(buff, signatureBuff)

// console.log(`Curve: ${curve}`)
// console.log(`Public key length: ${pub.length}`)
// console.log(`Private key length: ${priv.length}`)
// console.log(`Signature length: ${signatureBuff.length}`)
// console.log(`verified: ${verify}`)
