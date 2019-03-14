import * as fs from 'fs'
import { createHash } from 'crypto'
import { ec as EC } from 'elliptic'
const ec = new EC('p192')

type Curve = 'p192'

export interface Key {
    curve: Curve,
    public: string
    private?: string
}

type keystore = { [callsign: string]: Key[] }

/**
 * @class Keystore
 * A class for managing keys, signatures, and signature verification
 */
export class Keystore {

    readonly path: string
    private _keystore: keystore

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
        return { public: pub, private: priv, curve: 'p192' }
    }
    /**
     * Remove a Key object from the keystore, using the public key.
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

    /** Get a list of callsigns.
     * @method getCallsigns
     * @returns {string[]}
     */
    getCallsigns(): string[] {
        return Object.keys(this._keystore)
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

    /**
     * Get Key objects that have both public and private keys
     * @method getKeyPairs
     * @param  {string} callsign
     * @returns {Key[]} An array of keypair objects that have both { public: 'hex', private: 'hex' }
     */
    getKeyPairs(callsign: string): Key[] {
        return this.getKeys(callsign).filter(key => {
            return typeof key.public === 'string' && typeof key.private === 'string'
        })
    }

    /** Get Key objects that have at least a public key
     * @method getKeys
     * @param  {string} callsign
     * @returns {Key[]} An array of key objects that have at least a public key
     */
    getKeys(callsign: string): Key[] {
        if (!this._keystore.hasOwnProperty(callsign)) return []
        return this._keystore[callsign]
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
        return Buffer.from(signature)
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
        return createHash('sha256')
            .update(message, 'utf8')
            .digest()
    }

    private _addKey(callsign: string, publicHex: string, privateHex?: string): void {

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

    private _save(): void {
        fs.writeFileSync(this.path, JSON.stringify(this._keystore, null, '\t'))
    }

    private _load(): keystore {
        return JSON.parse(fs.readFileSync(this.path).toString('utf8'))
    }

    private _exists(): boolean {
        return fs.existsSync(this.path)
    }
}
