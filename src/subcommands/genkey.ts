import { Config, load, save } from '../config'
import { Keystore, Key } from '../Keystore';

export async function main(args: any): Promise<number> {
    
    const conf: Config = load(args.config)
    const ks: Keystore = new Keystore(conf.keystoreFile)
    const key: Key = ks.genKeyPair(conf.callsign)
    if (args.makeSigning) conf.signingKey = key.public
    save(conf)
    console.log(key.public)

    return 0
}