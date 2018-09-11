const KISS_TNC = require('kiss-tnc');
const AX25 = require('ax25') // https://github.com/echicken/node-ax25/tree/es6rewrite
const compression = require('./compression.js')

const FLAGS = {
    COMPRESSED: 0x01,
    SIGNED: 0x2
}

class CVPacket {

    constructor() {
        
        this.header = {
            version: 0x01,
            compressed: null,
            signed: null,
            signatureLength: null
        }

        this.from = null
        this.to = null
        this.message = null
        this.signature = null
        this.compressed = null
        this.data = null
    }

    async toAX25Packet() {
        const packet = new AX25.Packet()
        packet.type = AX25.Masks.control.frame_types.u_frame.subtypes.ui
        packet.source = { callsign : this.from, ssid : 0 }
        packet.destination = { callsign : this.to, ssid : 0 }
        packet.payload = await this.assemble()
        return packet.assemble()
    }

    async assemble() {
        
        // compress signature + message
        let buff = Buffer.from([])
        if (this.signature) buff = this.signature
        buff = Buffer.concat([buff, Buffer.from(this.message, 'utf8')])
        const compressed = await compression.compress(buff)

        if (compressed.length < buff.length) {
            this.header.compressed = true
        } else {
            this.header.compressed = false
        }

        // flags
        let flags = 0x00
        if (Buffer.isBuffer(this.signature)) flags = flags | FLAGS.SIGNED
        if (this.header.compressed) flags = flags | FLAGS.COMPRESSED
        
        // header buffer
        const headerArray = [this.header.version, flags]
        if (this.signature !== null) {
            if (this.signature.length > 256) throw Error('signature is larger than 256 bytes')
            headerArray.push(this.signature.length)
        }

        const header = Buffer.from(new Uint8Array(headerArray))
        const payload = this.header.compressed ? compressed : Buffer.from(this.message, 'utf8')
        this.data = Buffer.concat([header, payload])
        return this.data
    }

    async disassemble(data) {

        if (!Buffer.isBuffer(data)) throw TypeError('data must be a Buffer')
        if (Buffer.length < 3) throw Error('invalid packet length')

        const version = data[0]
        if (version !== 1) {
            throw Error(`invalid packet version: ${version}`)
        }

        // COME BACK HERE
        const flags = data[1]
        console.log(`flags: ${flags}`)
        this.header.compressed = flags & FLAGS.COMPRESSED | FLAGS.COMPRESSED == 1
        this.header.signed = flags & FLAGS.SIGNED | FLAGS.SIGNED == 1

        console.log(`compressed: ${this.header.compressed}`)
        console.log(`signed: ${this.header.signed}`)
    }

    static async ToAX25Packet(fromCallsign, toCallsign, utf8Text, signature) {
        
        const packet = new CVPacket()
        packet.from = fromCallsign
        packet.to = toCallsign
        packet.message = utf8Text
        
        if (signature) {
            if (Buffer.isBuffer(signature)) packet.signature = signature
            else throw TypeError(`signature must be a Buffer type, not ${typeof signature}`)
        }

        if (packet.signature) {
            packet.header.signatureLength = packet.signature.length
        }

        return await packet.toAX25Packet()
    }

    static async FromAX25Packet(ax25Buffer) {
        const ax25Packet = new AX25.Packet()
        ax25Packet.disassemble(ax25Buffer)

        if (ax25Packet.payload.length == 0) {
            throw Error('ax25 packet payload is empty')
        }

        const packet = new CVPacket()
        packet.from = ax25Packet.source
        packet.to = ax25Packet.destination
        await packet.disassemble(ax25Packet.payload)
        return packet
    }
}

module.exports = CVPacket