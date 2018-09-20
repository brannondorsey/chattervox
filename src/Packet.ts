import * as AX25 from 'ax25' // https://github.com/echicken/node-ax25/tree/es6rewrite
import { compress, decompress } from './compression.js'
import { callsignSSIDToStation } from './utils.js';

export enum HeaderFlags {
    Compressed = 0x01,
    Signed = 0x2
}

export interface Station {
    callsign: string,
    ssid: number
}

export const MagicBytes = [0x7a, 0x39]

export interface Header {
    version: number,
    compressed: boolean,
    signed: boolean,
    signatureLength: number
}

export class Packet {

    header: Header
    from: Station
    to: Station
    message: string
    signature: Buffer
    data: Buffer

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
        this.data = null
    }

    async toAX25Packet(): Promise<any> {
        const packet = new AX25.Packet()
        packet.type = AX25.Masks.control.frame_types.u_frame.subtypes.ui
        packet.source = this.from
        packet.destination = this.to
        packet.payload = await this.assemble()
        return packet.assemble()
    }

    async assemble(): Promise<Buffer> {
        
        if (Buffer.isBuffer(this.signature)) {
            this.header.signed = true
            this.header.signatureLength = this.signature.length
        } 

        // compress signature + message
        let payload: Buffer = this.header.signed ? this.signature : Buffer.from([])
        let message: Buffer = Buffer.from(this.message, 'utf8')
        const compressed = await compress(message)
        if (compressed.length < message.length) {
            this.header.compressed = true
            payload = Buffer.concat([payload, compressed])
        } else {
            this.header.compressed = false
            payload = Buffer.concat([payload, message])
        }

        // flags
        let flags = 0x00
        if (this.header.signed) flags = flags | HeaderFlags.Signed
        if (this.header.compressed) flags = flags | HeaderFlags.Compressed
        
        // header buffer
        const headerArray = [...MagicBytes, this.header.version, flags]
        if (this.signature !== null) {
            if (this.signature.length > 256) throw Error('signature is larger than 256 bytes')
            headerArray.push(this.signature.length)
        }

        const header = Buffer.from(new Uint8Array(headerArray))
        this.data = Buffer.concat([header, payload])
        return this.data
    }

    async disassemble(data: Buffer): Promise<void> {

        if (!Buffer.isBuffer(data)) throw TypeError('Invalid data must be a Buffer')

        if (data.length < 4) {
            const error = TypeError('Invalid packet, too few bytes.')
            error.name = 'InvalidPacket'
            throw error
        }

        const magic = data.slice(0, 2)
        if (magic[0] !== MagicBytes[0] || magic[1] !== MagicBytes[1]) {
            const err = TypeError(`Invalid magic bytes in packet header. This is not a CV Packet.`)
            err.name = 'InvalidPacket'
            throw err
        }

        const version = data[2]
        if (version !== 1) {
            const err = TypeError(`Invalid packet version: ${version}`)
            err.name = 'InvalidPacket'
            throw err
        }

        const flags = data[3]
        this.header.compressed = (flags & HeaderFlags.Compressed) == HeaderFlags.Compressed
        this.header.signed = (flags & HeaderFlags.Signed) == HeaderFlags.Signed

        // console.log(`compressed: ${this.header.compressed}`)
        // console.log(`signed: ${this.header.signed}`)

        let payloadIndex = 4
        if (this.header.signed) {
            this.header.signatureLength = data[4]
            payloadIndex = 5
        }

        let payload: Buffer = data.slice(payloadIndex)
        let messageIndex = 0
        if (this.header.signed) {
            this.signature = payload.slice(0, this.header.signatureLength)
            messageIndex = this.header.signatureLength
        }

        if (this.header.compressed) {
            this.message = (await decompress(payload.slice(messageIndex))).toString('utf8')
        } else {
            this.message = payload.slice(messageIndex).toString('utf8')
        }

    }

    static async ToAX25Packet(from: string | Station, 
                              to: string | Station, 
                              utf8Text: string, 
                              signature?: Buffer): Promise<any> {
        
        if (typeof from === 'string') from = callsignSSIDToStation(from)
        if (typeof to === 'string') to = callsignSSIDToStation(to)

        const packet = new Packet()
        packet.from = from
        packet.to = to
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

    static async FromAX25Packet(ax25Buffer: Buffer): Promise<Packet> {
        
        const ax25Packet = new AX25.Packet()        
        try {
            ax25Packet.disassemble(ax25Buffer)
        } catch (err) {
            const error = TypeError(err.message)
            error.name = 'InvalidPacket'
            throw error
        }

        const packet = new Packet()
        packet.from = ax25Packet.source
        packet.to = ax25Packet.destination
        await packet.disassemble(ax25Packet.payload)
        return packet
    }
}
