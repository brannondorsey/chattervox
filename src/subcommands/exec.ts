import { Config } from '../config'
import { Keystore } from '../Keystore'
import { Station } from '../Packet'
import { Messenger, MessageEvent, Verification } from '../Messenger'
import { isCallsign, isCallsignSSID, callsignSSIDToStation, timeout } from '../utils'
import * as readline from 'readline'
import { spawn, ChildProcess } from 'child_process'

let proc: ChildProcess

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    const promises: Promise<any>[] = []
    const messenger = new Messenger(conf)

    messenger.on('close', () => {
        console.error(`The connection to KISS TNC at ${conf.kissPort} is now closed. Exiting.`)
        process.exit(1)
    })

    messenger.on('tnc-error', (err) => {
        console.error(`The connection to KISS TNC ${conf.kissPort} experienced the following error:`)
        console.error(err)
    })

    messenger.on('message', (message: MessageEvent) => {
        let receive = false
        const to: Station = callsignSSIDToStation(args.to)
        if (args.allowAll) receive = true
        else if (args.allRecipients ||
                 (message.to.callsign === to.callsign && message.to.ssid == to.ssid)) {
            if (message.verification === Verification.Valid) {
                receive = true
            } else if (args.allowUnsigned  && message.verification === Verification.NotSigned) {
                receive = true
            } else if (args.allowUntrusted && message.verification === Verification.KeyNotFound) {
                receive = true
            } else if (args.allowInvalid   && message.verification === Verification.Invalid) {
                receive = true
            }
        }

        if (receive) {
            promises.push(timeout(args.delay).then(() => writeToProc(proc, message.message)))
        }

    })

    try {
        await messenger.openTNC()
    } catch (err) {
        console.error(`Error opening a serial connection to KISS TNC that should be at ${conf.kissPort}. Are you sure your TNC is running?`)
        console.error(`If you have direwolf installed you can start it in another window with "direwolf -p -q d -t 0"`)
        return 1
    }

    if (!isCallsign(args.to) && !isCallsignSSID(args.to)) {
        console.error(`--to must be a valid callsign, callsign-ssid pair (e.g. "CALL-1"), or chatroom.`)
        return 1
    }

    await new Promise((resolve, reject) => {

        const commandArgs: Array<string> = args.command.split(' ')
        const command = commandArgs.shift()

        proc = spawn(command, commandArgs)

        proc.stdout.on('data', (data) => {
            const text: string = data.toString('utf8')
            console.log(text)
            promises.push(messenger.send(args.to.toUpperCase(), text, true))
        })

        if (args.stderr) {
            proc.stderr.on('data', (data) => {
                const text: string = data.toString('utf8')
                console.error(text)
                promises.push(messenger.send(args.to.toUpperCase(), text, true))
            })
        }

        proc.on('exit', (code: number) => {
            resolve(code)
        })

        proc.on('error', (err: any) => {
            if (err.code == 'ENOENT') {
                console.error(`"${command}" does not exist.`)
            }
            reject(err)
        })

        const rl: readline.ReadLine = readline.createInterface({
            input: process.stdin,
            terminal: false,
            crlfDelay: Infinity
        })

        rl.on('line', (line) => {
            proc.stdin.write(line)
            proc.stdin.write('\n')
        })

    })

    await Promise.all(promises)

    return 0
}

// If we have spawned a child process send it a SIGTERM signal.
// If it doesn't die send it a SIGKILL in 7 seconds.
// Reject the promise if it still isn't dead 3 seconds after that.
export function cleanup(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (proc) {
            proc.on('close', resolve)
            proc.on('exit', resolve)
            proc.on('error', reject)

            proc.kill('SIGTERM')
            // note that these timeouts can still run even after resolve and
            // reject, so be careful what's put in here.
            setTimeout(() => {
                if (proc.pid) {
                    proc.kill('SIGKILL')
                    let message = 'Sent SIGKILL signal after child process didn\'t'
                    message += ' exit from SIGTERM. There may be a zombie process'
                    message += ' left over as a result.'
                    console.error(message)
                }
            }, 7000)

            // give up and reject the promise
            setTimeout(reject, 10000)
        } else {
            resolve()
        }
    })
}

function writeToProc(proc: ChildProcess, text: string): void {
    if (proc) {
        proc.stdin.write(text)
        proc.stdin.write('\n')
    }
}
