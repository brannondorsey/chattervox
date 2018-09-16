import { compress } from './compression'
import { Keystore, Key } from './Keystore'
import * as fs from 'fs'

const ks: Keystore = new Keystore('/tmp/keystore.json')

async function main(): Promise<void> {
    
    const key: Key = ks.genKeyPair('N0CALL')
    const strings = fs.readFileSync('../../Branger_Briz/twitter-transfer-learning/data/text/realdonaldtrump.txt')
                   .toString('utf8')
                   .split('\n')

    const totals : { one: number[], both: number[] } = { one:[], both: [] }
    
    for (let message of strings) {
        const results = await compare(message, key.private)
        totals.one.push(results.one)
        totals.both.push(results.both)
        console.log(`one: ${results.one}, two: ${results.both}`)
    }

    console.log(`Averages -> one: ${mean(totals.one)}, both: ${mean(totals.both)}`)
}

async function compare(message: string, privKey: string) : Promise<{ one: number, both: number }> {
    
    let one = Buffer.concat([
        ks.sign(message, privKey),
        await compress(Buffer.from(message, 'utf8'))
    ])

    let both = await compress(Buffer.concat([
        ks.sign(message, privKey),
        await compress(Buffer.from(message, 'utf8'))
    ]))

    return { one: one.length , both: both.length  }
}

function mean(arr: number[]): number {
    if (arr.length == 0) return null
    return arr.reduce((total, value) => total + value) / arr.length
}


main().catch(console.error)