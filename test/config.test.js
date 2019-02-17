const config = require('../build/config.js')
const fs = require('fs')
const assert = require('assert')

describe('config', () => {

    const tmpConfig = 'tmp-config.json'
    let conf = {
        version: 3,
        callsign: 'N0CALL',
        ssid: 0,
        keystoreFile: './tmp-keystore.json',
        kissPort: '/tmp/kisstnc',
        kissBaud: 9600,
        feedbackDebounce: 20 * 1000,
    }

    const tmpConfigV2 = 'tmp-config-v2.json'
    let confV2 = {
        version: 2,
        callsign: 'N0CALL',
        ssid: 0,
        keystoreFile: './tmp-keystore.json',
        kissPort: '/tmp/kisstnc',
        kissBaud: 9600,
    }

    before(() => {
        fs.writeFileSync(conf.keystoreFile, '{}')
        fs.writeFileSync(tmpConfigV2, JSON.stringify(confV2))
    })

    after(() => {
        fs.unlinkSync(conf.keystoreFile)
        fs.unlinkSync(tmpConfig)
        fs.unlinkSync(tmpConfigV2)
    })

    describe('save', () => {

        it ('should save a valid config file', () => {
            config.save(conf, tmpConfig)
        })

        it ('should not save an invalid config file', () => {
            const c = copy(conf)
            delete c.callsign
            assert.throws(() => config.save(c, tmpConfig), TypeError)
        })
    })

    describe('exists', () => {

        it ('should find that a valid file exists', () => {
            assert.ok(config.exists(tmpConfig))
        })

        it ('should find that an invalid file doesn\'t exist', () => {
            assert.equal(false, config.exists('/some/file/that/doesn\'t/exist'))
        })
    })

    describe('load', () => {

        it ('should load an existing config file', () => {
            conf = config.load(tmpConfig)
        })

        it ('should error when loading a non existing config file', () => {
            assert.throws(() => config.load('/non/existing/path.json'), Error)
        })

        it ('should error when loading an invalid config file', () => {
            const path = './tmp-invalid-config.json'
            const c = copy(conf)
            delete c.callsign
            fs.writeFileSync(path, JSON.stringify(c))
            assert.throws(() => config.load(path), TypeError)
            fs.unlinkSync(path)
        })
    })

    describe('migrate', () => {

        it ('should migrate a v2 config file', () => {
            assert.equal(confV2.feedbackDebounce, undefined)
            const changed = config.migrate(confV2)
            assert.equal(changed, true)
            assert.equal(confV2.feedbackDebounce, config.defaultConfig.feedbackDebounce)
        })

        it ('should load a config v2 file', () => {
            config.load(tmpConfigV2)
        })

        it ('should save a migrated v2 -> v3 config file on load()', () => {
            const migratedConf = JSON.parse(fs.readFileSync(tmpConfigV2).toString('utf8'))
            assert.equal(migratedConf.feedbackDebounce, config.defaultConfig.feedbackDebounce)
        })
    })

    describe('validate', () => {

        it ('should validate a valid config JSON object', () => {
            config.validate(conf)
        })

        it ('should error if no config object is passed into it', () => {
            assert.throws(() => config.validate(), TypeError)
        })

// --------------------------------------------------------------------

        it ('should error if version doesn\'t exist', () => {
            const c = copy(conf)
            delete c.version
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if callsign doesn\'t exist', () => {
            const c = copy(conf)
            delete c.callsign
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if ssid doesn\'t exist', () => {
            const c = copy(conf)
            delete c.ssid
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if kissPort doesn\'t exist', () => {
            const c = copy(conf)
            delete c.kissPort
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if kissBaud doesn\'t exist', () => {
            const c = copy(conf)
            delete c.kissBaud
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if keystoreFile doesn\'t exist', () => {
            const c = copy(conf)
            delete c.keystoreFile
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if feedbackDebounce doesn\'t exist', () => {
            const c = copy(conf)
            delete c.feedbackDebounce
            assert.throws(() => config.validate(c), TypeError)
        })

// --------------------------------------------------------------------

        it ('should error if version isn\'t a number', () => {
            const c = copy(conf)
            c.version = '4'
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if callsign is invalid', () => {
            const c = copy(conf)
            c.callsign = ''
            assert.throws(() => config.validate(c), TypeError)
            c.callsign = 'LONGCALL'
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if callsign includes SSID', () => {
            const c = copy(conf)
            c.callsign = 'KC3LZO-1'
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if ssid is invalid', () => {
            const c = copy(conf)
            c.ssid = -1
            assert.throws(() => config.validate(c), TypeError)
            c.ssid = 16
            assert.throws(() => config.validate(c), TypeError)

            c.ssid = 15
            config.validate(c)
        })

        it ('should error if kissPort is not a string', () => {
            const c = copy(conf)
            c.kissPort = 8
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if kissBaud is not a string', () => {
            const c = copy(conf)
            c.kissBaud = '9600'
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if keystoreFile isn\'t a string', () => {
            const c = copy(conf)
            c.keystoreFile = true
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if signingKey is included but not a string', () => {
            const c = copy(conf)
            c.signingKey = 5
            assert.throws(() => config.validate(c), TypeError)
        })

        it ('should error if feedbackDebounce isn\'t null or a number', () => {
            const c = copy(conf)
            c.feedbackDebounce = '4000'
            assert.throws(() => config.validate(c), TypeError)

        })
    })
})

function copy(obj) {
    return JSON.parse(JSON.stringify(obj))
}
