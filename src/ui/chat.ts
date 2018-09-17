
import { terminal as term } from 'terminal-kit'
import { Messenger, MessageEvent, Verification } from '../Messenger';

term.on('key', (name: string , matches: string[], data: any): void => {
    name; // intentionally unused
    data; // intentionally unused
    if ( matches.includes('CTRL_C') || matches.includes('CTRL_D')) {
        term.processExit(0)
    }
})

export function begin(): void {
    term.fullscreen()
}

export async function printReceivedMessage(message: MessageEvent, callsign: string): Promise<void> {

    const pos: { x: number, y: number } = await term.getCursorLocation()
    if (pos) {

        term.moveTo(0, pos.y)
        term.insertLine(1)
        printStyledText(message)
        term.move(pos.x - 1, 0)

        if (term.height === pos.y) {
            if (input) {
                // term.moveTo(0, term.height)
                term.moveTo(0, term.height)
                term.green(`${callsign}`)(': ')
                input.redraw()
            }
        }
    }
}

export async function inputLoop(callsign: string, messenger: Messenger, sign: boolean): Promise<void> {
    while (true) {
        const text = (await prompt(callsign)).trim()
        if (text !== '') await messenger.send('CQ', text, sign)
        term.eraseLine()
        const pos: { x: number, y: number } = await term.getCursorLocation()
        term.moveTo(0, pos.y)
        term.green(`${callsign}`)(`: ${text}`)
    }
}

let input: any
async function prompt(callsign: string): Promise<string> {
    term.green(`\n${callsign}`)(': ')
    input = term.inputField({ cancelable: true })
    const message = await input.promise
    return message
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