import { ArgumentParser, SubParser } from 'argparse'
import * as config from './config'
import * as chat from './subcommands/chat'
import * as addkey from './subcommands/addkey'
import * as removekey from './subcommands/removekey'
import * as showkey from './subcommands/showkey'
import * as genkey from './subcommands/genkey'
import { interactiveInit } from './ui/init'

function parseArgs(): any {

    const parser = new ArgumentParser({
        version: 'v0.0.1',
        description: 'AX.25 packet radio chat application/protocol with support for digital signatures and compression.'
    })

    parser.addArgument(['--config', '-c'], { 
        help: `Path to config file (default: ${config.defaultConfigPath})`,
        defaultValue: config.defaultConfigPath
    })

    const subs: SubParser = parser.addSubparsers({
        title: 'subcommands',
        dest: 'subcommand'
    })

    const chat: ArgumentParser = subs.addParser('chat', {
        addHelp: true,
        description: 'Enter the chat room.'
    })

    const showKey: ArgumentParser = subs.addParser('showkey', {
        addHelp: true,
        description: 'List keys.'
    })

    showKey.addArgument('callsign', { type: 'string', nargs: '?' })

    const addKey: ArgumentParser = subs.addParser('addkey', { 
        addHelp: true, 
        description: 'Add a new public key to the keystore associated with a callsign.' 
    })

    addKey.addArgument('callsign', { type: 'string' })
    addKey.addArgument('publickey', { type: 'string' })

    const removeKey: ArgumentParser = subs.addParser('removekey', { 
        addHelp: true,
        description: 'Remove a public key from the keystore.'
    })

    removeKey.addArgument('publickey', { type: 'string' })

    const genKey: ArgumentParser = subs.addParser('genkey', {
        addHelp: true,
        description: 'Generate a new keypair for your callsign.'
    })

    genKey.addArgument('--make-signing', { 
        action: 'storeTrue',
        dest: 'makeSigning',
        help: 'Make the generated key your default signing key.' 
    })

    return parser.parseArgs()
}

async function main() {

    const args = parseArgs()

    // initialize a new config
    if (!config.exists(args.config)) {
        // if the default config doesn't exist, let's run the interactive init
        if (args.config === config.defaultConfigPath) {
            await interactiveInit()
        } else {
            console.error(`No config file exists at "${args.config}". Exiting.`)
            process.exit(1)
        }
    }

    let code = null
    switch (args.subcommand) {
        case 'chat': code = await chat.main(args); break
        case 'showkey': code = await showkey.main(args); break
        case 'addkey': code = await addkey.main(args); break
        case 'removekey': code = await removekey.main(args); break
        case 'genkey': code = await genkey.main(args); break
    }

    process.exit(code)
}

main()
.catch((err) => {
    console.error(err)
    process.exit(1)
})