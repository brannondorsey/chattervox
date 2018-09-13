const { Messenger, Verification } = require('../build/Messenger.js')

async function main() {

    const messenger = new Messenger({ 
        callsign: 'N0CALL' ,
        kissPort: '/tmp/kisstnc',
        kissBaud: 9600
    })

    messenger.on('open', () => {
        console.log('Messenger\'s tnc is open')
    })

    messenger.on('close', () => {
        console.log('Messenger\'s tnc is now closed')
    })

    messenger.on('tnc-error', (err) => {
        console.log('Messenger\'s TNC experienced an error:')
        console.error(err)
    })

    messenger.on('message', (to, from, message, verification) => {
        console.log('message received!')
        console.log(`to: ${to}`)
        console.log(`from: ${from}`)
        console.log(`message: ${message}`)
        console.log(`verified: ${verification == Verification.Valid}`)
    })

    await messenger.openTNC()
    await messenger.send('CQ', 'This message is a zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz test baby!')
    messenger.closeTNC()

    setTimeout(()=>{}, 100000)
}

main().catch(console.error)