import { Config } from '../config'
import { Keystore } from '../Keystore'
import { Station } from '../Packet'
import { Messenger, MessageEvent, Verification } from '../Messenger'
import { isCallsign, isCallsignSSID, callsignSSIDToStation } from '../utils'
import * as readline from 'readline'

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

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
        const to: Station = callsignSSIDToStation(args.to)
        if (args.allowAll) console.log(message.message)
        else if (args.allRecipients ||
                 (message.to.callsign === to.callsign && message.to.ssid == to.ssid)) {
            if (message.verification === Verification.Valid) {
                console.log(message.message)
            } else if (args.allowUnsigned  && message.verification === Verification.NotSigned) {
                console.log(message.message)
            } else if (args.allowUntrusted && message.verification === Verification.KeyNotFound) {
                console.log(message.message)
            } else if (args.allowInvalid   && message.verification === Verification.Invalid) {
                console.log(message.message)
            }
        }
    })

    try {
        await messenger.openTNC()
    } catch (err) {
        console.error(`Error opening a connection to the KISS TNC that should be listening at ${conf.kissPort}. Are you sure your TNC is running?`)
        console.error(`If you have Direwolf installed you can start it in another window with "direwolf -p -q d -t 0"`)
        return 1
    }

    if (!isCallsign(args.to) && !isCallsignSSID(args.to)) {
        console.error(`--to must be a valid callsign, callsign-ssid pair (e.g. "CALL-1"), or chatroom.`)
        return 1
    }

    // only sign if the user's config has a signing key
    const sign: boolean = (typeof conf.signingKey === 'string' && args.dontSign !== true)
    await new Promise((resolve, reject) => {
        const rl: readline.ReadLine = readline.createInterface({
            input: process.stdin,
            terminal: false,
            crlfDelay: Infinity
        })

        const promises: Promise<any>[] = []
        rl.on('line', (line) => {
            promises.push(messenger.send(args.to.toUpperCase(), line, sign))
        })

        rl.on('close', () => {
            Promise.all(promises).then(resolve).catch(reject)
        })
    })

    return 0
}
