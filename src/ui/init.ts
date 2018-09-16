import { timeout } from '../utils'
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

    try {
        init()
        save(conf)
        term(`\nSettings saved to ${defaultConfigPath}`)
    } catch (err) {
        term(`\nError saving settings to ${defaultConfigPath}`)
        term.processExit()
    }

    const ks: Keystore = new Keystore(conf.keystoreFile)
    term(`\nGenerating ECDSA keypair...`)
    const key: Key = ks.genKeyPair(conf.callsign)
    await timeout(2500) // delay for dramatic effect, lol
    term(`\nPublic Key: ^c${key.public}^\n`)
}

async function askUser(): Promise<Config> {

    term(`\nWhat is your call sign? `)
    const callsign: string = (await term.inputField().promise).trim().toUpperCase()

    term(`\n(press ENTER to skip) What is your name or handle? `)
    let nick: string = await term.inputField().promise
    if (nick.trim() === '') nick = null

    term(`\nDo you have a dedicated hardware TNC that you would like to use instead of direwolf (default: no)? `)
    let dedicatedTNC: string = (await term.inputField().promise).trim().toLowerCase()
    const launchDirewolf = !(dedicatedTNC === 'yes' || dedicatedTNC === 'y')

    let kissPort: string
    let kissBaud: number
    if (!launchDirewolf) {
        term(`\nWhat is the serial port device name of this TNC (e.g. /dev/ttyS0)? `)
        kissPort = (await term.inputField().promise).trim()

        term(`\nWhat is the baud rate for this serial device (default ${defaultConfig.kissBaud})? `)
        const baud = (await term.inputField().promise).trim()
        kissBaud = baud === '' ? defaultConfig.kissBaud : parseInt(baud)
    }

    const conf: Config = JSON.parse(JSON.stringify(defaultConfig))
    conf.callsign = callsign
    conf.launchDirewolf = launchDirewolf
    if (kissPort) conf.kissPort = kissPort
    if (kissBaud) conf.kissBaud = kissBaud
    if (nick) conf.nicks[callsign] = nick
    return conf
}

// interactiveInit().catch(err => {
//     console.error(err)
//     term.processExit()
// })
