const { Keystore } = require('../build/Keystore.js')
const assert = require('assert')
const fs = require('fs')

describe('Keystore', function() {

    let ks = null
    const call = 'N0CALL'
    const path = './test/tmp-keystore.json'
    
    before(() => {
        if (fs.existsSync(path)) fs.unlinkSync(path)
    })

    after(() => {
        fs.unlinkSync(path)
    })

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

    it(`should not revoked public keys where callsign isn't in the keystore`, () => {
        const pubs = ks.getPublicKeys(call)
        const revoked = ks.revoke('TEST', pubs[0])
        assert.equal(false, revoked)
        assert.ok(ks.getPublicKeys('TEST').length === 0)
    })

    it(`should not revoked public keys that don't exist in the keystore`, () => {
        const revoked = ks.revoke(call, '04c89d36628646335c3764bf33072a69e2787d1277639fb007625d7ee9df2139f01dbba76072eac810ff19b2893bb407ca')
        const numBefore = ks.getPublicKeys(call).length  
        assert.ok(revoked === false)
        assert.equal(numBefore, ks.getPublicKeys(call).length)
    })

    it(`should return an empty array of keypairs if callsign is not in the keystore`, () => {
        assert.deepEqual([], ks.getKeyPairs('UNSEEN'))
    })

    it(`should add a new public key`, () => {
        ks.addPublicKey('KC3LZO', '04c89d36628646335c3764bf33072a69e2787d1277639fb007625d7ee9df2139f01dbba76072eac810ff19b2893bb407ca')
    })

    it(`should add a second public key`, () => {
        ks.addPublicKey('PUBONLY', '0470326b0d79c816ec4b0b2cc44c76973b3361e53b0929127da7d16c9da8be8cf2eb934894cec50a48e22fd39f8ef3892f')
    })

    it(`the public keys we just added for PUBONLY shouldn't show up in getKeyPairs()`, () => {
        assert.deepEqual([], ks.getKeyPairs('PUBONLY'))
    })

    it(`the public keys we just added for PUBONLY should show up in getKeys()`, () => {
        assert.equal(ks.getKeys('PUBONLY').length, 1)
    })

    it(`should error if callsign is undefined`, () => {
        assert.throws(() => {
            ks.addPublicKey(undefined, '04c89d36628646335c3764bf33072a69e2787d1277639fb007625d7ee9df2139f01dbba76072eac810ff19b2893bb407ca')
        })
    })

    it(`should error if publickey is undefined`, () => {
        assert.throws(() => {
            ks.addPublicKey('KC3LZO', undefined)
        })
    })

    it(`_addKey() should error if privatekey is not undefined and not a string`, () => {
        assert.throws(() => {
            ks._addKey('KC3LZO', '04c89d36628646335c3764bf33072a69e2787d1277639fb007625d7ee9df2139f01dbba76072eac810ff19b2893bb407ca', true)
        })
    })

    it(`should have three callsigns stored`, () => {
        assert.deepEqual([ 'N0CALL', 'DEADBEEF', 'KC3LZO', 'PUBONLY' ], ks.getCallsigns())
    })

    it(`should load an existing keystore from disk on construction`, () => {
        const ks = new Keystore(path)
    })

})