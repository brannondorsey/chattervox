const { Packet } = require('../build/Packet.js')
const { Keystore } = require('../build/Keystore.js')
const assert = require('assert')
const fs = require('fs')

describe('Packet', () => {

    const ks = new Keystore('tmp-keystore.json')
    const { public, private } = ks.genKeyPair('N0CALL')

    const shortMessage = 'this is a message 🤑'
    let shortUnsignedAX25Packet = null
    let shortSignedAX25Packet = null

    const longMessage = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
    let longUnsignedAX25Packet = null
    let longSignedAX25Packet = null

    describe('ToAX25Packet()', () => {
        it('should construct an AX25 Packet with a short message and no signature', async () => {
            shortUnsignedAX25Packet = await Packet.ToAX25Packet('N0CALL', 'CQ', shortMessage)
        })

        it('should construct an AX25 Packet with a short message and a signature', async () => {
            const signature = ks.sign(shortMessage, private)
            shortSignedAX25Packet = await Packet.ToAX25Packet('N0CALL-1', 'KC3LZO', shortMessage, signature)
        })

        it('should construct an AX25 Packet with a long message and no signature', async () => {
            longUnsignedAX25Packet = await Packet.ToAX25Packet('N0CALL', 'KC3LZO-2', longMessage)
        })

        it('should construct an AX25 Packet with a long message and a signature', async () => {
            const signature = ks.sign(longMessage, private)
            longSignedAX25Packet = await Packet.ToAX25Packet('N0CALL-3', 'KC3LZO-3', longMessage, signature)
        })

        it('should error constructing an AX25 Packet with a signature that is greater than 256 bytes', async () => {
            const buff = Buffer.alloc(512)            
            try {
                await Packet.ToAX25Packet('N0CALL', 'CQ', shortMessage, buff)
                assert.fail('No error creating packet with signature length 512')
            } catch (err) {
                assert.equal('signature is larger than 256 bytes', err.message)
            }
        })
    })

    describe('FromAX25Packet()', () => {
        
        describe('should error when creating invalid packets', () => {

            it ('should error if packet contains less than four bytes', async () => {
                try {
                    await Packet.FromAX25Packet(Buffer.from([0x10, 0x11, 0x12]))
                    assert.fail('Invalid packet must throw an error')
                } catch (err) {
                    assert.equal('InvalidPacket', err.name)
                }
            })
            
        })

        describe('short packet no signature', () => {
            let packet
            
            it ('should create a packet object from the raw ax25 packet buffer', async () => {
                packet = await Packet.FromAX25Packet(shortUnsignedAX25Packet)
            })

            it('should correctly extract the original message', () => {
                assert.equal(shortMessage, packet.message)
            })

            it('signature property should be null', () => {
                assert.equal(packet.signature, null)
            })

            it('should have a from callsign', () => {
                assert.ok(typeof packet.from.callsign === 'string')
            })

            it('should have a to callsign', () => {
                assert.ok(typeof packet.to.callsign === 'string')
            })

            it('should have a from ssid', () => {
                assert.ok(typeof packet.from.ssid === 'number')
            })

            it('should have a to ssid', () => {
                assert.ok(typeof packet.to.ssid === 'number')
            })

            it('header.compressed should be false', () => {
                assert.equal(packet.header.compressed, false)
            })

            it('header.signed should be false', () => {
                assert.equal(packet.header.signed, false)
            })

            it('header.signatureLength should be null', () => {
                assert.equal(packet.header.signatureLength, null)
            })
        })

        describe('short packet with signature', () => {
            let packet
            
            it ('should create a packet object from the raw ax25 packet buffer', async () => {
                packet = await Packet.FromAX25Packet(shortSignedAX25Packet)
            })

            it('should correctly extract the original message', () => {
                assert.equal(shortMessage, packet.message)
            })

            it('signature property should be a buffer', () => {
                assert.ok(packet.signature instanceof Buffer)
            })

            it('the signature should be valid', () => {
                assert.ok(ks.verify('N0CALL', shortMessage, packet.signature))
            })

            it('should have a from callsign', () => {
                assert.ok(typeof packet.from.callsign === 'string')
            })

            it('should have a to callsign', () => {
                assert.ok(typeof packet.to.callsign === 'string')
            })

            it('should have a from ssid', () => {
                assert.ok(typeof packet.from.ssid === 'number')
            })

            it('should have a to ssid', () => {
                assert.ok(typeof packet.to.ssid === 'number')
            })

            it('header.compressed should be false', () => {
                assert.equal(packet.header.compressed, false)
            })

            it('header.signed should be true', () => {
                assert.equal(packet.header.signed, true)
            })

            it('header.signatureLength should be greater than zero', () => {
                assert.ok(packet.header.signatureLength > 0)
            })
        })

        describe('long packet no signature', () => {
            let packet
            
            it ('should create a packet object from the raw ax25 packet buffer', async () => {
                packet = await Packet.FromAX25Packet(longUnsignedAX25Packet)
            })

            it('should correctly extract the original message', () => {
                assert.equal(longMessage, packet.message)
            })

            it('signature property should be null', () => {
                assert.equal(packet.signature, null)
            })

            it('should have a from callsign', () => {
                assert.ok(typeof packet.from.callsign === 'string')
            })

            it('should have a to callsign', () => {
                assert.ok(typeof packet.to.callsign === 'string')
            })

            it('should have a from ssid', () => {
                assert.ok(typeof packet.from.ssid === 'number')
            })

            it('should have a to ssid', () => {
                assert.ok(typeof packet.to.ssid === 'number')
            })

            it('header.compressed should be true', () => {
                assert.equal(packet.header.compressed, true)
            })

            it('header.signed should be false', () => {
                assert.equal(packet.header.signed, false)
            })

            it('header.signatureLength should be null', () => {
                assert.equal(packet.header.signatureLength, null)
            })
        })

        describe('long packet with signature', () => {
            let packet
            
            it ('should create a packet object from the raw ax25 packet buffer', async () => {
                packet = await Packet.FromAX25Packet(longSignedAX25Packet)
            })

            it('should correctly extract the original message', () => {
                assert.equal(longMessage, packet.message)
            })

            it('signature property should be a buffer', () => {
                assert.ok(packet.signature instanceof Buffer)
            })

            it('the signature should be valid', () => {
                assert.ok(ks.verify('N0CALL', longMessage, packet.signature))
            })

            it('should have a from callsign', () => {
                assert.ok(typeof packet.from.callsign === 'string')
            })

            it('should have a to callsign', () => {
                assert.ok(typeof packet.to.callsign === 'string')
            })

            it('should have a from ssid', () => {
                assert.ok(typeof packet.from.ssid === 'number')
            })

            it('should have a to ssid', () => {
                assert.ok(typeof packet.to.ssid === 'number')
            })

            it('header.compressed should be true', () => {
                assert.equal(packet.header.compressed, true)
            })

            it('header.signed should be true', () => {
                assert.equal(packet.header.signed, true)
            })

            it('header.signatureLength should be greater than zero', () => {
                assert.ok(packet.header.signatureLength > 0)
            })
        })
    })

    it('should remove the temporary keystore file', () => {
        fs.unlinkSync('tmp-keystore.json')
    })
})
