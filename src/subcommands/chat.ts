import { Config, defaultConfig } from '../config'
import { Keystore } from '../Keystore'
import { Messenger, MessageEvent } from '../Messenger'
// import * as direwolf from '../DirewolfManager'
import * as ui from '../ui/chat'
// import { timeout } from '../utils';

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    // let launchedDirewolf = false
    // if (defaultConfig.launchDirewolf) {
    //     if (!direwolf.installed()) {
    //         console.error('Cannot find direwolf binary. Please install direwolf. Exiting.')
    //         return 1
    //     } else {
    //         console.log(await direwolf.running())
    //         if (await direwolf.running()) {
    //             console.log('Direwolf is already running.')
    //         } else {
    //             console.log('Launching direwolf...')
    //             await direwolf.start()
    //             await timeout(1000)
    //             launchedDirewolf = true
    //         }
    //     }
    // }

    const messenger = new Messenger(conf)

    messenger.on('close', () => {
        console.log('Messenger\'s tnc is now closed')
    })

    messenger.on('tnc-error', (err) => {
        console.log('Messenger\'s TNC experienced an error:')
        console.error(err)
    })

    messenger.on('message', (message: MessageEvent) => {
        ui.printReceivedMessage(message, conf.callsign)
    })

    try {
        await messenger.openTNC()
    } catch (err) {
        console.error('Error opening a serial connection to the TNC. Exiting.')
        return 1
    }

    ui.begin()
        
    const sign: boolean = typeof conf.signingKey === 'string'
    await ui.inputLoop(conf.callsign, messenger, sign)        
    
    return 0
}
