import { Config } from '../config'
import { Keystore, Key } from '../Keystore'

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {

    conf; // intentionally unused
    if (args.callsign) {
        printKeys(args.callsign.toUpperCase(), ks)
    } else {
        ks.getCallsigns().forEach((callsign) => printKeys(callsign, ks))
    }

    return 0
}

function printKeys(callsign: string, keystore: Keystore): void {
    const keys: Key[] = keystore.getKeyPairs(callsign)
    keys.forEach((key) => {
        if (key.public) console.log(`${callsign} Public Key: ${key.public}`)
        if (key.private) console.log(`${callsign} Private Key: ${key.private}`)
    })
}