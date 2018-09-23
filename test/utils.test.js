const utils = require('../build/utils.js')
const fs = require('fs')
const assert = require('assert')

describe('utils', () => {

    describe('stationToCallsignSSID()', () => {
        
        it('should convert a station with an SSID to string', () => {
            const station = { callsign: 'KC3LZO', ssid: 1 }
            assert.equal('KC3LZO-1', utils.stationToCallsignSSID(station))
        })

        it('should convert a station with a zero SSID to a basic callsign string', () => {
            const station = { callsign: 'KC3LZO', ssid: 0 }
            assert.equal('KC3LZO', utils.stationToCallsignSSID(station))
        })
    })

    describe('callsignSSIDToStation()', () => {
        
        it('should convert a basic callsign to a station', () => {
            const result = utils.callsignSSIDToStation('KC3LZO')
            const shouldBe = { callsign: 'KC3LZO', ssid: 0 }
            assert.deepEqual(result, shouldBe)
        })

        it('should convert a callsign with an SSID to a station', () => {
            const result = utils.callsignSSIDToStation('KC3LZO-14')
            const shouldBe = { callsign: 'KC3LZO', ssid: 14 }
            assert.deepEqual(result, shouldBe)
        })
    })

    describe('isCallsign()', () => {
        
        it('should report that KC3LZO is a callsign', () => {
            assert.ok(utils.isCallsign('KC3LZO'))
        })

        it('should report that KC3LZO-1 is not a callsign', () => {
            assert.equal(false, utils.isCallsign('KC3LZO-1'))
        })

        it('should report that an empty string is not a callsign', () => {
            assert.equal(false, utils.isCallsign(''))
        })

        it('should report that a seven letter callsign is not a callsign. This is an AX25 limitation.', () => {
            assert.equal(false, utils.isCallsign('SEVENCH'))
        })
    })

    describe('isCallsignSSID()', () => {
        
        it('should report that KC3LZO-1 is a callsign with an SSID', () => {
            assert.ok(utils.isCallsignSSID('KC3LZO-1'))
        })

        it('should report that KC3LZO is not a callsign with an SSID', () => {
            assert.equal(false, utils.isCallsignSSID('KC3LZO'))
        })
    })

    describe('isSSID()', () => {
        
        it('should report that 0 is a valid SSID', () => {
            assert.ok(utils.isSSID(0))
        })

        it('should report that 1 is a valid SSID', () => {
            assert.ok(utils.isSSID(1))
        })

        it('should report that 15 is a valid SSID', () => {
            assert.ok(utils.isSSID(15))
        })

        it('should report that 16 is not a valid SSID', () => {
            assert.equal(false, utils.isSSID(16))
        })

        it('should report that -1 is not a valid SSID', () => {
            assert.equal(false, utils.isSSID(-1))
        })

        it('should error if passed an empty string', () => {
            assert.throws(() => utils.isSSID(''), TypeError)
        })

        it('should error if passed undefined', () => {
            assert.throws(() => utils.isSSID(undefined), TypeError)
        })

        it('should error if passed null', () => {
            assert.throws(() => utils.isSSID(null), TypeError)
        })
    })
})
