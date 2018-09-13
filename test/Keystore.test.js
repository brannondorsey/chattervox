const { Keystore } = require('../build/Keystore.js')
const assert = require('assert')
const fs = require('fs')

describe('Keystore', function() {

    let ks = null
    const call = 'N0CALL'
    const path = './test/tmp-keystore.json'
    
    if (fs.existsSync(path)) fs.unlink(path)

    it('should fail on construction with no path parameter', () => {
        assert.throws(() => new Keystore(), TypeError)
    })

    it('should should create a new keystore json file if none exists', () => {
        assert.ok(!fs.existsSync(path))
        ks = new Keystore(path)
        assert.ok(fs.existsSync(path))
    })

    it('should generate a new key pair', () => {
        const { public, private } = ks.genKeyPair(call)
        assert.ok(public && private)
    })

    it('should update the keystore JSON file when a new key is generated', () => {
        const keystore = JSON.parse(fs.readFileSync(path))
        assert.ok(keystore[call].length == 1)
    })

    it('should return an array of public keys for a callsign in the store', () => {
        const keys = ks.getPublicKeys(call)
        assert.ok(typeof keys[0] === 'string')
    })

    it('should return an empty array for a callsign that is not in the store', () => {
        const keys = ks.getPublicKeys('DEADBEEF')
        assert.ok(keys && keys.constructor === Array && keys.length === 0)
    })

    it(`should generate a valid signature from call "${call}"`, () => {

        let message = 'This is a test message.'
        const private = ks.getKeyPairs(call)[0].private
        const signature = ks.sign(message, private)
        const valid = ks.verify(call, message, signature)
        assert.ok(valid)
    })

    it(`should not generate a valid signature signed by call "${call}" but verified with "DEADBEEF"`, () => {

        ks.genKeyPair('DEADBEEF')

        let message = 'This is a test message.'
        const private = ks.getKeyPairs(call)[0].private
        const signature = ks.sign(message, private)
        const valid = ks.verify('DEADBEEF', message, signature)
        assert.ok(valid === false)
    })

    it(`should remove revoked public keys from the keystore`, () => {
        const pubs = ks.getPublicKeys('DEADBEEF')
        assert.ok(pubs.length === 1)
        const revoked = ks.revoke('DEADBEEF', pubs[0])
        assert.ok(revoked)
        assert.ok(ks.getPublicKeys('DEADBEEF').length === 0)
    })

    it(`should not revoked public keys that don't exist in the keystore`, () => {
        const pubs = ks.getPublicKeys(call)
        const revoked = ks.revoke('TEST', pubs[0])
        assert.ok(revoked === false)
        assert.ok(ks.getPublicKeys('TEST').length === 0)
    })
})