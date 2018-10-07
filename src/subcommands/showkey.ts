import { Config } from '../config'
import { Keystore, Key } from '../Keystore'

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    if (args.callsign) {
        printKeys(args.callsign.toUpperCase(), ks, conf)
    } else {
        ks.getCallsigns().forEach((callsign) => printKeys(callsign, ks, conf))
    }

    return 0
}

function printKeys(callsign: string, keystore: Keystore, conf: Config): void {
    
    const keys: Key[] = keystore.getKeys(callsign)
    keys.forEach((key) => {
        if (key.public) {
            if (key.public === conf.signingKey) {
                console.log(`${callsign} Public Key (your signing key): ${key.public}`)
            } else {
                console.log(`${callsign} Public Key: ${key.public}`)
            }
        }
        if (key.private) console.log(`${callsign} Private Key: ${key.private}`)
    })
}