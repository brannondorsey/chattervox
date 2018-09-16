import { Config } from '../config'
import { Keystore } from '../Keystore'

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {
    
    if (ks.revoke(args.callsign.toUpperCase(), args.publickey)) {
        console.log(`Removed key ${args.publickey}`)
    } else {
        console.log(`Failed to remove key ${args.publickey}, are you sure it exists?`)
    }
    return 0
}