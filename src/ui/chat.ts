
import { terminal as term } from 'terminal-kit'
import { Messenger, MessageEvent, Verification } from '../Messenger';
import { stationToCallsignSSID } from '../utils'

term.on('key', (name: string , matches: string[], data: any): void => {
    if ( matches.includes('CTRL_C') || matches.includes('CTRL_D')) {
        exit(0)
    }
})

type TerminalFunction = (buffer: string) => TerminalFunction // function
const colorMap: { [callsign: string]: TerminalFunction } = {}
const myColorFunction: TerminalFunction = term.cyan

function getColorFunction(callsign: string): TerminalFunction {
    
    const choices = [
        term.red,
        term.green,
        term.yellow,
        term.blue,
        term.magenta,
        term.brightRed,
        term.brightGreen,
        term.brightYellow,
        term.brightBlue,
        term.brightMagenta
    ]

    if (!colorMap.hasOwnProperty(callsign)) {
        colorMap[callsign] = choices[Math.floor(Math.random() * choices.length)]
    }

    return colorMap[callsign]
}

export function enter(): void {
    term.fullscreen()
}

export function exit(code: number): void {
    term.processExit(code)
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
                myColorFunction(`${callsign}`)(': ')
                input.redraw()
            }
        }
    }
}

export async function inputLoop(callsign: string, messenger: Messenger, sign: boolean): Promise<void> {
    while (true) {
        const text = (await prompt(callsign)).trim()
        // TODO dynamic to addresses, not just CQ. "TOCALL: message" should only
        // be sent appear to specific user.
        if (text !== '') await messenger.send('CQ', text, sign)
        term.eraseLine()
        const pos: { x: number, y: number } = await term.getCursorLocation()
        term.moveTo(0, pos.y)
        myColorFunction(`${callsign}`)(`: ${text}`)
    }
}

let input: any
async function prompt(callsign: string): Promise<string> {
    myColorFunction(`\n${callsign}`)(': ')
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

    const from: string = stationToCallsignSSID(message.from)
    getColorFunction(from)(`${from}`)    
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