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
import * as receive from './subcommands/receive'
import * as exec from './subcommands/exec'
import * as tty from './subcommands/tty'
import { interactiveInit } from './ui/init'
import { isCallsign, isCallsignSSID } from './utils'

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
        description: 'Send chattervox packets.'
    })

    send.addArgument(['--to', '-t'], { 
        type: 'string', 
        help: 'The recipient\'s callsign, callsign-ssid pair, or chatroom name. (default: "CQ")', 
        defaultValue: 'CQ',
        required: false
    })

    send.addArgument(['--dont-sign', '-d'], { 
        action: 'storeTrue',
        dest: 'dontSign',
        help: 'Don\'t sign messages.',
        required: false
    })

    send.addArgument('message', {
        type: 'string',
        help: 'A UTF-8 message to be sent.',
        nargs: '?',
        required: false
    })

    const receive: ArgumentParser = subs.addParser('receive', {
        addHelp: true,
        description: 'Write chattervox packets to stdout.'
    })

    receive.addArgument(['--allow-unsigned', '-u'], {
        action: 'storeTrue',
        dest: 'allowUnsigned',
        help: 'Receive unsigned messages.',
    })

    receive.addArgument(['--allow-untrusted', '-e'], {
        action: 'storeTrue',
        dest: 'allowUntrusted',
        help: 'Receive messages signed by senders not in keyring.',
    })

    receive.addArgument(['--allow-invalid', '-i'], {
        action: 'storeTrue',
        dest: 'allowInvalid',
        help: 'Receive messages with invalid signatures.',
    })

    receive.addArgument(['--all-recipients', '-g'], {
        action: 'storeTrue',
        dest: 'allRecipients',
        help: 'Receive messages to all callsigns and chat rooms.',
    })

    receive.addArgument(['--allow-all', '-a'], {
        action: 'storeTrue',
        dest: 'allowAll',
        help: 'Receive all messages, independent of signatures and destinations.',
    })

    receive.addArgument(['--raw', '-r'], {
        action: 'storeTrue',
        dest: 'raw',
        help: 'Print raw ax25 packets instead of parsed chattervox messages.',
    })

    receive.addArgument('--to', { 
        type: 'string', 
        help: 'The recipient\'s callsign, callsign-ssid pair, or chatroom name (default: "CQ").', 
        defaultValue: 'CQ',
        required: false
    })

    receive.addArgument(['--verbose', '-v'], {
        action: 'storeTrue',
        help: 'Print verbose output from any chattervox packet received to stderr.',
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

    const exec: ArgumentParser = subs.addParser('exec', {
        addHelp: true,
        description: 'Execute a command using chattervox as the standard interface'
    })

    exec.addArgument(['--delay', '-s'], {
        type: 'int',
        help: 'Milliseconds before transmitting stdout after receiving stdin (default: 5000)',
        defaultValue: 5000,
        required: false
    })

    exec.addArgument(['--to', '-t'], {
        type: 'string',
        help: 'The recipient\'s callsign, callsign-ssid pair, or chatroom name. (default: "CQ")',
        defaultValue: 'CQ',
        required: false
    })

    exec.addArgument(['--dont-sign', '-d'], {
        action: 'storeTrue',
        dest: 'dontSign',
        help: 'Don\'t sign messages.',
        required: false
    })

    exec.addArgument(['--stderr', '-e'], {
        action: 'storeTrue',
        help: 'Also transmit stderr.',
        defaultValue: false,
        required: false
    })

    exec.addArgument('command', {
        type: 'string',
        help: 'A command to be run'
    })

    const tty: ArgumentParser = subs.addParser('tty', {
        addHelp: true,
        description: 'A dumb tty interface. Sends what\'s typed, prints what\'s received.' 
    })

    tty.addArgument(['--to', '-t'], {
        type: 'string',
        help: 'The recipient\'s callsign, callsign-ssid pair, or chatroom name. (default: "CQ")',
        defaultValue: 'CQ',
        required: false
    })

    tty.addArgument(['--dont-sign', '-d'], {
        action: 'storeTrue',
        dest: 'dontSign',
        help: 'Don\'t sign messages.',
        required: false
    })

    return parser.parseArgs()
}

function validateArgs(args: any): void {
    if (args.callsign != null && !isCallsign(args.callsign)) {
        console.error(`${args.callsign} is not a valid callsign.`)
        if (isCallsignSSID(args.callsign)) {
            console.error(`callsign should not include an SSID for key management subcommands.`)
        }
        process.exit(1)
    } 

    if (args.to != null && args.to !== 'CQ' && !(isCallsign(args.to) || isCallsignSSID(args.to))) {
        console.error('--to must be a callsign, callsign-ssid pair, or chatroom name with less than 7 alphanumeric characters.')
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
    if (['chat', 'send', 'receive'].includes(args.subcommand)) {
        validateSigningKeyExists(conf, ks)
    }

    let code = null
    switch (args.subcommand) {
        case 'chat': code = await chat.main(args, conf, ks); break
        case 'send': code = await send.main(args, conf, ks); break
        case 'receive': code = await receive.main(args, conf, ks); break
        case 'showkey': code = await showkey.main(args, conf, ks); break
        case 'addkey': code = await addkey.main(args, conf, ks); break
        case 'removekey': code = await removekey.main(args, conf, ks); break
        case 'genkey': code = await genkey.main(args, conf, ks); break
        case 'exec': code = await exec.main(args, conf, ks); break
        case 'tty': code = await tty.main(args, conf, ks); break
    }

    process.exit(code)
}

main()
.catch((err) => {
    console.error(err)
    process.exit(1)
})