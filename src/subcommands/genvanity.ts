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
    let { prefix, suffix, needle, min } = args
    let requirements = []

    needle = needle || prefix || suffix
    let key: Key = genKeyWith(needle)

    console.log(`Generating vanity key for ${conf.callsign} with needle ${needle}`)

    if (prefix) requirements.push( (key: Key) => key.public.slice(2, 2 + prefix.length) === prefix )
    if (suffix) requirements.push( (key: Key) => key.public.endsWith(suffix) )
    if (min) requirements.push( (key: Key) => key.public.match(RegExp(needle, 'g')).length >= min)

    while(! requirements.every(requirement => requirement(key))){
        key = genKeyWith(needle)
    }

    console.dir(key)

    return 0
}