import { Config, save } from '../config'
import { Keystore, Key } from '../Keystore'

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {
    
    const key: Key = ks.genKeyPair(conf.callsign)
    if (args.makeSigning) conf.signingKey = key.public
    save(conf, args.config)
    console.log(key.public)

    return 0
}