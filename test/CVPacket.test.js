const CVPacket = require('../src/CVPacket.js')
const Keystore = require('../src/Keystore.js')
const assert = require('assert')

// describe('CVPacket', async () => {

//     const ks = new Keystore('./tmp-keystore.json')
//     const { public, private } = ks.genKeyPair('N0CALL')

//     let ax25Packet = null
//     describe('#ToAX25Packet()', async () => {
//         it('should construct a new AX25 Packet with only a message without a signature', async () => {
//             await CVPacket.ToAX25Packet('N0CALL', 'CQ', 'this is a message 🤑')
//         })

//         it('should construct a new AX25 Packet with a message and a signature', async () => {
//             const message = 'this is a message 🤑'
//             const signature = ks.sign(message, private)
//             ax25Packet = await CVPacket.ToAX25Packet('N0CALL', 'CQ', message, signature)
//         })
//     })

//     describe('#FromAX25Packet()', async () => {
//         it('should populate message', async () => {
//             await CVPacket.FromAX25Packet(ax25Packet)
//         })
//     })
// })

async function main() {
   const ax25Packet = await CVPacket.ToAX25Packet('N0CALL', 'CQ', 'you compressed this?')
   await CVPacket.FromAX25Packet(ax25Packet)
}

main()