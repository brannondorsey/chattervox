import { timeout, isCallsign } from '../utils'
import { Config, defaultConfig, save, init, defaultConfigPath } from '../config'
import { Keystore, Key } from '../Keystore'
import { terminal as term } from 'terminal-kit'

export async function interactiveInit() {

    term(`Welcome! It looks like you are using chattervox for the first time.\n`)
    term(`We'll ask you some questions to create an initial settings configuration.\n\n`)

    let conf: Config
    while (true) {
        conf = await askUser()
        term.yellow(`\n${JSON.stringify(conf, null, 2)}`)
        term(`\nIs this correct [Y/n]? `)
        const correct = (await term.inputField().promise).trim().toLowerCase()
        if (correct === '' || correct === 'yes' || correct === 'y') break
    }

    // create the ~/.chattervox dir, config.json, and keystore.json
    init()

    const ks: Keystore = new Keystore(conf.keystoreFile)
    term(`\nGenerating ECDSA keypair...`)
    const key: Key = ks.genKeyPair(conf.callsign)
    await timeout(2000) // delay for dramatic effect, lol
    term(`\nPublic Key: ^c${key.public}^\n`)

    // signatures are created using a private key, but we don't want to include
    // the private key in the config file, so instead we use the public key
    // as the identifier, and then actually sign with the private key.
    conf.signingKey = key.public

    try {
        save(conf)
        term(`\nSettings saved to ${defaultConfigPath}\n`)
    } catch (err) {
        term(`\nError saving settings to ${defaultConfigPath}\n`)
        term.processExit()
    }
}

async function askUser(): Promise<Config> {

    let callsign: string = await promptCallsign()
    let ssid: number = await promptSSID()

    term(`\nDo you have a dedicated hardware TNC that you would like to use instead of direwolf (default: no)? `)
    let hasDedicatedTNC: string = (await term.inputField().promise).trim().toLowerCase()
    let dedicatedTNC: boolean = (hasDedicatedTNC === 'yes' || hasDedicatedTNC === 'y')

    let kissPort: string
    let kissBaud: number
    if (dedicatedTNC) {
        term(`\nWhat is the serial port device name of this TNC (e.g. /dev/ttyS0)? `)
        kissPort = (await term.inputField().promise).trim()

        term(`\nWhat is the baud rate for this serial device (default ${defaultConfig.kissBaud})? `)
        const baud = (await term.inputField().promise).trim()
        kissBaud = baud === '' ? defaultConfig.kissBaud : parseInt(baud)
    }

    const conf: Config = JSON.parse(JSON.stringify(defaultConfig))
    conf.callsign = callsign
    conf.ssid = ssid
    if (kissPort) conf.kissPort = kissPort
    if (kissBaud) conf.kissBaud = kissBaud
    return conf
}

async function promptCallsign(): Promise<string> {
    term(`\nWhat is your call sign (default: ${defaultConfig.callsign})? `)
    let callsign: string = (await term.inputField().promise).trim().toUpperCase()
    if (callsign === '') return defaultConfig.callsign
    else if (isCallsign(callsign)) return callsign
    else {
        term('\nCallsign must be between 1 and 6 alphanumeric characters.')
        return promptCallsign()
    }
}

async function promptSSID(): Promise<number> {
    term(`\nWhat SSID would you like to associate with this station (press ENTER to skip)? `)
    let ssid: string = await term.inputField().promise
    if (ssid.trim() === '') return 0
    else if (!isNaN(parseInt(ssid))) {
        let num = parseInt(ssid)
        if (num >= 0 && num <= 15) return num
    }
    term('\nSSID must be a number between 0 and 15.')
    return promptSSID()
}
