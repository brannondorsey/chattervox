import { Config } from '../config'
import { Keystore } from '../Keystore'
import { Messenger } from '../Messenger'
import { isCallsign, isCallsignSSID } from '../utils'
import * as readline from 'readline'

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    const messenger = new Messenger(conf)

    messenger.on('tnc-error', (err) => {
        console.error(`The connection to KISS TNC ${conf.kissPort} experienced the following error:`)
        console.error(err)
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

    // only sign if the user's config has a signing key
    const sign: boolean = typeof conf.signingKey === 'string'
    if (args.message != null && args.message.length > 0) {
        await messenger.send(args.to.toUpperCase(), args.message, sign)
    } else {
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
    }

    return 0
}
