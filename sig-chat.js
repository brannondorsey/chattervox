'use strict';
const KISS_TNC = require('.');
const AX25 = require('../node-ax25') // https://github.com/echicken/node-ax25/tree/es6rewrite
const readline = require('readline')
const MY_CALL = 'KC3LZO'

function onDataRecieved(data) {
    const packet = new AX25.Packet()
    packet.disassemble(data.data)
    console.log(`Packet received on port ${data.port}`)
    console.log('Destination:', packet.destination)
    console.log('Source:', packet.source)
    console.log('Type:', packet.type_name)
    if (packet.payload.length > 0) {
        console.log('Payload:', packet.payload.toString('utf8'))
    }
}

function sendData(message) {
    const packet = new AX25.Packet()
    packet.type = AX25.Masks.control.frame_types.u_frame.subtypes.ui;
    packet.source = { callsign : 'KC3LZO', ssid : 0 }
    packet.destination = { callsign : 'CQ', ssid : 0 }
    packet.payload = Buffer.from(message, 'utf8')
    // tnc.send_data(packet.assemble(), () => console.log('Sent:', message))
    tnc.send_data(packet.assemble())
}

// device, baud_rate
const tnc = new KISS_TNC('/tmp/kisstnc', 9600)
process.on('SIGTERM', tnc.close)
tnc.on('error', console.error)
// tnc.on('data', onDataRecieved)
tnc.open(() => {
    console.log('TNC opened')
    sendData('🤑')
})

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: `${MY_CALL}: `
})

rl.on('line', line => {
    readline.moveCursor(process.stdout, 0, -1)
    readline.clearLine(process.stdout, 0)
    sendData(line)
    printMessage(MY_CALL, line)
})

function printMessage(fromCall, message) {
    console.log(`${fromCall}: ${message}`)
}
