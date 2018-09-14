import KISS_TNC from 'kiss-tnc'
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

    private ks: Keystore
    private tnc: any
    private config: any

    constructor(config: any) {
        super()
        config.callsign = 'N0CALL'
        this.config = config
        this.ks = new Keystore('keystore.json')
        if (this.ks.getKeyPairs(config.callsign).length === 0) {
            this.ks.genKeyPair(config.callsign)
        }

        // device, baud_rate
        this.tnc = this._createTNC(config.kissPort, config.kissBaud)
    }

    openTNC(): Promise<undefined> {
        return new Promise((resolve, reject) => {
            if (this.tnc == null) {
                this.tnc = this._createTNC(this.config.kissPort, this.config.kissBaud)
            }

            this.tnc.open((err: any) => {
                this.emit('open', err)
                if (err) reject(err)
                else resolve()
            })
        })
    }

    closeTNC(): void {
        this.tnc.close()
        this.tnc = null
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
        if (this.tnc == null) throw Error('Error sending message with send(). The Messenger\'s TNC object is null. Are you sure it is connected?')
        return new Promise((resolve) => this.tnc.send_data(packet, resolve))
    }

    private async _onAX25DataRecieved(data: any) {

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

    private _createTNC(port: string, baudrate: number): any {
        const tnc = new KISS_TNC(port, baudrate)
        // process.on('SIGTERM', tnc.close)
        tnc.on('error', (error: any) => this.emit('tnc-error', error))
        tnc.on('data', (data: any) => this._onAX25DataRecieved(data))
        return tnc
    }
}
