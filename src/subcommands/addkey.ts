
import { Config, save } from '../config'
import { Keystore } from '../Keystore';

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {
    
    ks.addPublicKey(args.callsign.toUpperCase(), args.publickey)
    save(conf)
    
    return 0
}