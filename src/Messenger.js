const KISS_TNC = require('kiss-tnc');
const AX25 = require('ax25')
const Keystore = require('./Keystore.js')

class Messenger extends EventEmitter{
    
    constructor(config) {

        config.callsign = 'N0CALL'
        this.config = config
        this.ks = new Keystore('keystore.json')
        if (ks.getKeyPairs(config.callsign).length === 0) {
            ks.genKeyPair(config.callsign)
        }

        // device, baud_rate
        this.tnc = new KISS_TNC(config.kissPort, config.kissBaud)
        // process.on('SIGTERM', tnc.close)
        this.tnc.on('error', (error) => this.emit('tnc-error', error))
        this.tnc.on('data', this._onAX25DataRecieved)
        this.tnc.open(() => this.emit('tnc-open'))
    }

    send(to, message, options) {

    }

    _signAndCompress(buffer) {

    }

    _decompressAndVerify(buffer) {

    }

    _onAX25DataRecieved(data) {
        const packet = new AX25.Packet()
        packet.disassemble(data.data)
        console.log(`Packet received on port ${data.port}`)
        console.log('Destination:', packet.destination)
        console.log('Source:', packet.source)
        console.log('Type:', packet.type_name)
        // if (packet.payload.length > 0) {
        //     console.log('Payload:', packet.payload.toString('utf8'))
        // }
    }

    _sendAX25Data(from, to, payload) {
        return new Promise((resolve, reject) => {
            const packet = new AX25.Packet()
            packet.type = AX25.Masks.control.frame_types.u_frame.subtypes.ui;
            packet.source = { callsign : from, ssid : 0 }
            packet.destination = { callsign : to, ssid : 0 }
            packet.payload = Buffer.from(message, 'utf8')
            // tnc.send_data(packet.assemble(), () => console.log('Sent:', message))
            tnc.send_data(packet.assemble(), resolve)
        })
    }
}

// class ChatterVoxPacket {

//     constructor() {

//     }

//     static FromAX25Payload(payload) {

//     }

//     static async ToAX25Payload(message, signature) {

//         const messageBuffer = Buffer.from(message, 'utf8')
//         messageBuffer += Buffer.from('|', 'utf8')
//         messageBuffer += Buffer.from(signature, 'hex')
//         const compressed = 

//     }

// }

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//     terminal: true,
//     prompt: `${MY_CALL}: `
// })

// rl.on('line', line => {
//     readline.moveCursor(process.stdout, 0, -1)
//     readline.clearLine(process.stdout, 0)
//     sendData(line)
//     printMessage(MY_CALL, line)
// })

// function printMessage(fromCall, message) {
//     console.log(`${fromCall}: ${message}`)
// }
