import { Config } from '../config'
import { Keystore } from '../Keystore'
import { Messenger, MessageEvent } from '../Messenger'
import * as ui from '../ui/chat'
import { stationToCallsignSSID } from '../utils';

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    const messenger = new Messenger(conf)

    messenger.on('close', () => {
        console.error(`The connection to KISS TNC at ${conf.kissPort} is now closed. Exiting.`)
        ui.exit(1)
    })

    messenger.on('tnc-error', (err) => {
        console.error(`The connection to KISS TNC ${conf.kissPort} experienced the following error:`)
        console.error(err)
    })

    messenger.on('message', (message: MessageEvent) => {
        if (message.to.callsign === 'CQ' || 
           (message.to.callsign === conf.callsign && 
            message.to.ssid === conf.ssid)) {
                ui.printReceivedMessage(message, conf.callsign)
        }
    })

    try {
        await messenger.openTNC()
    } catch (err) {
        console.error(`Error opening a serial connection to KISS TNC that should be at ${conf.kissPort}. Are you sure your TNC is running?`)
        console.error(`If you have direwolf installed you can start it in another window with "direwolf -p -q d -t 0"`)
        return 1
    }

    ui.enter()
    
    // only sign if the user's config has a signing key
    const sign: boolean = typeof conf.signingKey === 'string'
    const callsignSSID: string = stationToCallsignSSID({ callsign: conf.callsign, ssid: conf.ssid })
    await ui.inputLoop(callsignSSID, messenger, sign)

    return 0
}
