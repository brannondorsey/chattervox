import { Config } from '../config'
import { Keystore } from '../Keystore'
import { terminal as term } from 'terminal-kit'
import { Messenger, MessageEvent, Verification } from '../Messenger'


// -----------------------------------------------------------------------------

term.on('key', (name: string , matches: string[], data: any): void => {
    name; // intentionally unused
    data; // intentionally unused
    if ( matches.includes('CTRL_C') || matches.includes('CTRL_D'))
	{
        term.processExit(0)
    }
})

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    const messenger = new Messenger(conf)

    messenger.on('open', (err: Error) => {
        if (err) {
            console.log('Error opening tnc connection')
        } else {
            console.log('Messenger\'s tnc is open')
        }
    })

    messenger.on('close', () => {
        console.log('Messenger\'s tnc is now closed')

    })

    messenger.on('tnc-error', (err) => {
        console.log('Messenger\'s TNC experienced an error:')
        console.error(err)
    })

    messenger.on('message', (message: MessageEvent) => {
        printReceivedMessage(message)
    })

    messenger.openTNC()
    term.fullscreen()

    const sign: boolean = typeof conf.signingKey === 'string'
    await inputLoop(conf.callsign, messenger, sign)
    term.processExit()
    
    return 0
}

async function inputLoop(callsign: string, messenger: Messenger, sign: boolean): Promise<void> {
    while (true) {
        const text = await prompt(callsign)
        await messenger.send('CQ', text, sign)

        term.eraseLine()
        const pos: { x: number, y: number } = await term.getCursorLocation()
        term.moveTo(0, pos.y)
        term.green(`\n${callsign}`)(`: ${text}`)
    }
}

async function prompt(callsign: string): Promise<string> {
    term.green(`\n${callsign}`)(': ')
    const input = term.inputField({ cancelable: true })
    const message = await input.promise
    return message
}

async function printReceivedMessage(message: MessageEvent): Promise<void> {

    const pos: { x: number, y: number } = await term.getCursorLocation()
    if (pos) {
        if (term.height === pos.y + 1) {
            term.scrollUp(1)
        } else {
            term.moveTo(0, pos.y)
            term.insertLine(1)
            printStyledText(message)
            term.move(pos.x - 1, 0)
        }
    }
}

function printStyledText(message: MessageEvent): void {
    

    //// For testing only...
    // const rand = Math.random()
    // if (rand < 0.25) message.verification = Verification.NotSigned
    // else if (rand < 0.50) message.verification = Verification.Valid
    // else if (rand < 0.75) message.verification = Verification.Invalid
    // else message.verification = Verification.KeyNotFound

    term.cyan(`${message.from}`)    
    switch (message.verification) {
        
        case Verification.NotSigned:
            term(' (UNSIGNED): ').dim(`${message.message}`)
            break;

        case Verification.Valid:
            term(`: ${message.message}`)
            break;
        
        case Verification.Invalid:
            term(' (INVALID SIGNATURE): ').strike(`${message.message}`)
            break;

        case Verification.KeyNotFound:
            term(' (KEY NOT FOUND): ').underline(`${message.message}`)
            break;
    }

    term('\n')
}