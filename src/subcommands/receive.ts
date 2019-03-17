import { Config } from '../config'
import { Keystore } from '../Keystore'
import { Messenger, MessageEvent, Verification } from '../Messenger'
import { stationToCallsignSSID, callsignSSIDToStation } from '../utils'
import { Station } from '../Packet'

function printVerbose(message: MessageEvent, raw: boolean): void {
    let msg = `[verbose] received a packet with `
    if (message.verification === Verification.Valid) msg += `VALID_SIGNATURE `
    else if (message.verification === Verification.NotSigned) msg += `NO_SIGNATURE `
    else if (message.verification === Verification.Invalid) msg += `INVALID_SIGNATURE `
    else if (message.verification === Verification.KeyNotFound) msg += `UNKNOWN_SIGNATURE `
    msg += `from ${stationToCallsignSSID(message.from)} `
    msg += `to ${stationToCallsignSSID(message.to)}: `
    if (raw && message.ax25Buffer != null) msg += `${message.ax25Buffer.toString('utf8')}`
    else msg += `"${message.message}"`
    console.error(msg)
}

function printPacket(message: MessageEvent, raw: boolean): void {
    let msg: string = message.message
    if (raw && message.ax25Buffer != null) msg = message.ax25Buffer.toString('utf8')
    console.log(msg)
}

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    const messenger = new Messenger(conf)

    messenger.on('close', () => {
        console.error(`The connection to KISS TNC at ${conf.kissPort} is now closed. Exiting.`)
        process.exit(1)
    })

    messenger.on('tnc-error', (err) => {
        console.error(`The connection to KISS TNC ${conf.kissPort} experienced the following error:`)
        console.error(err)
        process.exit(1)
    })

    messenger.on('message', (message: MessageEvent) => {
        const to: Station = callsignSSIDToStation(args.to)
        if (args.verbose) printVerbose(message, args.raw)
        if (args.allowAll) printPacket(message, args.raw)
        else if (args.allRecipients ||
                 (message.to.callsign === to.callsign && message.to.ssid == to.ssid)) {
            if (message.verification === Verification.Valid) {
                printPacket(message, args.raw)
            } else if (args.allowUnsigned  && message.verification === Verification.NotSigned) {
                printPacket(message, args.raw)
            } else if (args.allowUntrusted && message.verification === Verification.KeyNotFound) {
                printPacket(message, args.raw)
            } else if (args.allowInvalid   && message.verification === Verification.Invalid) {
                printPacket(message, args.raw)
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

    // await an unending promise to hang indefinitely
    await new Promise(()=>{})
    return 0 // this will never be reached.
}
