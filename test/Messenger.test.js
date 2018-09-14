const { Messenger, Verification } = require('../build/Messenger.js')

async function main() {

    const messenger = new Messenger({ 
        callsign: 'N0CALL' ,
        kissPort: '/tmp/kisstnc',
        kissBaud: 9600
    })

    messenger.on('open', (err) => {
        if (err) {
            console.log('Error opening tnc connection')
        } else {
            console.log('Messenger\'s tnc is open')
        }
    })

    messenger.on('close', () => {
        console.log('Messenger\'s tnc is now closed')
        setTimeout(async () => {
            await messenger.openTNC()
            await messenger.send('CQ', 'This is a second message that was sent after the tnc was first closed.')
        }, 10 * 1000)
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

    messenger.openTNC()
    .then(
        () => sendMessage(messenger), 
        () => { console.log('Error opening TNC connection message') }
    )
    
}

async function sendMessage(messenger) {
        
    await messenger.send('CQ', 'This message is a zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz test baby!', true)
    // messenger.closeTNC()
    // await messenger.send('CQ', 'This message is a zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz test baby!')

    setTimeout(()=>{}, 100000)
}

main().catch(console.error)