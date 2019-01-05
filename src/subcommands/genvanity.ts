import { Config } from '../config'
import { Keystore, Key } from '../Keystore'
import { ec as EC } from 'elliptic'
const curve = 'p192'
const ec = new EC(curve)

function genKeyWith(needle: string): Key {
    let genKey: Function = () => {
        const key = ec.genKeyPair()
        return {
            public: key.getPublic('hex'),
            private: key.getPrivate('hex'),
            curve,
        }
    }
    let key: Key = genKey()
    while (! key.public.includes(needle)) {
        key = genKey()
    } 
    return key
}

export async function main(args: any, conf: Config, ks: Keystore): Promise<number> {
    const { prefix, suffix, needle, min } = args
    let key = null

    if (prefix) {
        console.log(`Generating vanity for ${conf.callsign} with prefix ${prefix}`)
        key = genKeyWith(prefix)
        while(key.public.slice(2, 2 + prefix.length) !== prefix) key = genKeyWith(prefix)
    } else if (suffix) {
        console.log(`Generating vanity for ${conf.callsign} with suffix ${suffix}`)
        key = genKeyWith(suffix)
        while(!key.public.endsWith(suffix)) key = genKeyWith(suffix)
    } else if (needle) {
        key = genKeyWith(needle)
        if (min) {
            console.log(`Generating vanity for ${conf.callsign} with at least ${min} '${needle}'s`)
            while(key.public.match(RegExp(needle, 'g')).length < min) key = genKeyWith(needle)
        } else {
            console.log(`Generating vanity for ${conf.callsign} with needle ${needle}`)
            while(!key.public.includes(needle)) key = genKeyWith(needle)
        }
    }
        
    console.dir(key)

    return 0
}