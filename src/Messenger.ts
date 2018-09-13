import KISS_TNC from 'kiss-tnc'
import * as AX25 from 'ax25'
import { EventEmitter } from 'events'
import { Keystore } from './Keystore.js'
import { Packet } from './CVPacket.js'

export enum Verification {
    NotSigned,
    KeyNotFound,
    Valid,
    Invalid
}

export class Messenger extends EventEmitter {

    ks: Keystore
    tnc: any
    config: any

    constructor(config: any) {
        super()
        config.callsign = 'N0CALL'
        this.config = config
        this.ks = new Keystore('keystore.json')
        if (this.ks.getKeyPairs(config.callsign).length === 0) {
            this.ks.genKeyPair(config.callsign)
        }

        // device, baud_rate
        this.tnc = new KISS_TNC(config.kissPort, config.kissBaud)
        // process.on('SIGTERM', tnc.close)
        this.tnc.on('error', (error: any) => this.emit('tnc-error', error))
        this.tnc.on('data', (data: any) => this._onAX25DataRecieved(data))
    }

    openTNC(): Promise<undefined> {
        return new Promise((resolve, reject) => {
            // set a 5 second timeout
            const timeout = setTimeout(reject, 5 * 1000)
            this.tnc.open(() => {
                clearTimeout(timeout)
                this.emit('open')
                resolve()
            })
        })
    }

    closeTNC(): void {
        this.tnc.close()
        this.emit('close')
    }

    async send(to: string, message: string, sign: boolean) {
        const from: string = this.config.callsign
        let signature: Buffer = null
        if (sign) {
            // TODO get signing key from config
            const priv = this.ks.getKeyPairs(this.config.callsign)[0].private
            signature = this.ks.sign(message, priv)
        }

        const packet: Buffer = await Packet.ToAX25Packet(from, to, message, signature)
        return new Promise((resolve) => this.tnc.send_data(packet, resolve))
    }

    async _onAX25DataRecieved(data: any) {

        let packet
        try  {
            packet = await Packet.FromAX25Packet(data.data)
        } catch (err) {
            if (err.name == 'InvalidPacket') {
                console.log('recieved invalid packet, skipping')
                return
            } else throw err
        }

        let verification = Verification.NotSigned
        if (packet.signature) {
            // if we don't have a public key from that callsign
            if (this.ks.getPublicKeys(packet.from).length === 0) {
                verification = Verification.KeyNotFound
            } else {
                const verified = this.ks.verify(packet.from, packet.message, packet.signature)
                if (verified) verification = Verification.Valid
                else Verification.Invalid
            }
        }

        this.emit('message', packet.to, packet.from, packet.message, verification)
    }
}
