#!/usr/bin/env node

import { ArgumentParser, SubParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import * as config from './config'
import { Keystore, Key } from './Keystore'
import * as chat from './subcommands/chat'
import * as addkey from './subcommands/addkey'
import * as removekey from './subcommands/removekey'
import * as showkey from './subcommands/showkey'
import * as genkey from './subcommands/genkey'
import * as send from './subcommands/send'
import { interactiveInit } from './ui/init'
import { isCallsign } from './utils'

function parseArgs(): any {

    const pkgBuff = fs.readFileSync(path.resolve(__dirname, '..', 'package.json'))
    const pkgJSON: any = JSON.parse(pkgBuff.toString('utf8'))
    
    const parser = new ArgumentParser({
        prog: pkgJSON.name,
        version: pkgJSON.version,
        description: pkgJSON.description
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

    chat; // intentionally unused

    const send: ArgumentParser = subs.addParser('send', {
        addHelp: true,
        description: 'Send a chattervox packet.'
    })

    send.addArgument('--to', { 
        type: 'string', 
        help: 'The recipient\'s callsign, callsign-ssid pair, or chatroom name. (default: "CQ")', 
        defaultValue: 'CQ',
        required: false
    })

    send.addArgument('message', {
        type: 'string',
        help: 'A UTF-8 message to be sent.',
        nargs: '?',
        required: false
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

    removeKey.addArgument('callsign', { type: 'string' })
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

function validateArgs(args: any): void {
    if (args.callsign != null && !isCallsign(args.callsign)) {
        console.error(`${args.callsign} is not a valid callsign.`)
        if (args.callsign.includes('-')) {
            console.error(`callsign should not include an SSID for key management subcommands.`)
        }
        process.exit(1)
    } 
}

// not sure if we should add this here...
// function validateKeystoreFile(conf: config.Config): void {

//     if (!fs.existsSync(conf.keystoreFile)) {
//         console.error(`No keystoreFile exists at location "${conf.keystoreFile}".`)
//         process.exit(1)
//     } else {
//         try {
//             JSON.parse(fs.readFileSync(conf.keystoreFile).toString('utf8'))
//         } catch (err) {
//             console.error(`Error loading keystoreFile file from "${conf.keystoreFile}".`)
//             console.error(err.message)
//             process.exit(1)
//         }
//     }
// }

function validateSigningKeyExists(conf: config.Config, ks: Keystore): void {
        // if there is a signing in the config but it doesn't exist in the keystore
        if (conf.signingKey != null) {
            const signing = ks.getKeyPairs(conf.callsign).filter((key: Key) => {
                return key.public === conf.signingKey 
            })
    
            if (signing.length < 1) {
                console.error(`Default signing key has no matching private key found in the keystore.`)
                process.exit(1)
            }
        }
}

async function main() {

    const args = parseArgs()
    validateArgs(args)

    // initialize a new config
    if (!config.exists(args.config)) {
        // if the default config doesn't exist, let's run the interactive init
        if (args.config === config.defaultConfigPath) {
            await interactiveInit()
        } else {
            console.error(`No config file exists at "${args.config}".`)
            process.exit(1)
        }
    }

    let conf: config.Config = null
    try {
        conf = config.load(args.config)
    } catch(err) {
        console.error(`Error loading config file from "${args.config}".`)
        console.error(err.message)
        process.exit(1)
    }

    // validate that keystore file exists
    // validateKeystoreFile(conf)
    const ks: Keystore = new Keystore(conf.keystoreFile)

    // if this subcommand is any of the commands that signs something
    if (['chat', 'send'].includes(args.subcommand)) {
        validateSigningKeyExists(conf, ks)
    }

    let code = null
    switch (args.subcommand) {
        case 'chat': code = await chat.main(args, conf, ks); break
        case 'send': code = await send.main(args, conf, ks); break
        case 'showkey': code = await showkey.main(args, conf, ks); break
        case 'addkey': code = await addkey.main(args, conf, ks); break
        case 'removekey': code = await removekey.main(args, conf, ks); break
        case 'genkey': code = await genkey.main(args, conf, ks); break
    }

    process.exit(code)
}

main()
.catch((err) => {
    console.error(err)
    process.exit(1)
})