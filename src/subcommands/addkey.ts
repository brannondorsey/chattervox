
import { Config, load, save } from '../config'
import { Keystore } from '../Keystore';

export async function main(args: any): Promise<number> {
    
    const conf: Config = load(args.config)
    const ks: Keystore = new Keystore(conf.keystoreFile)
    ks.addPublicKey(args.callsign.toUpperCase(), args.publickey)
    save(conf)
    
    return 0
}