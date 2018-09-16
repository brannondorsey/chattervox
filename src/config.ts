import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { Keystore } from './Keystore' 

export interface Config {
    readonly version: number,
    callsign: string,
    nicks: { [callsign: string]: string },
    keystoreFile: string,
    kissPort: string,
    kissBaud: number,
    launchDirewolf: boolean,
    signingKey?: string,
    direwolfPath?: string
}

export const defaultChattervoxDir = path.join(os.homedir(), '.chattervox')
export const defaultConfigPath = path.join(defaultChattervoxDir, 'config.json')
export const defaultKeystorePath = path.join(defaultChattervoxDir, 'keystore.json')

export const defaultConfig: Config = {
    version: 1,
    callsign: 'N0CALL',
    nicks: {},
    keystoreFile: defaultKeystorePath,
    kissPort: '/tmp/kisstnc',
    kissBaud: 9600,
    launchDirewolf: true
}

/** Save a config file as JSON
 * @function save
 * @param  {Config} config
 * @param  {string} configPath?
 * @returns void
 */
export function save(config: Config, configPath?: string): void {
    const path = typeof configPath === 'string' ? configPath : defaultConfigPath
    fs.writeFileSync(path, JSON.stringify(config, null, 4))
}

/** Load a config file
 * @function load
 * @param  {string} configPath?
 * @returns Config
 */
export function load(configPath?: string): Config {
    const path = typeof configPath === 'string' ? configPath : defaultConfigPath
    return JSON.parse(fs.readFileSync(path).toString('utf8'))
}

/** Check if the config file (or any file) exists
 * @function exists
 * @param  {string} configPath?
 * @returns boolean
 */
export function exists(configPath?: string): boolean {
    const path = typeof configPath === 'string' ? configPath : defaultConfigPath
    return fs.existsSync(path)
}

/**
 * Create new chattervox directory, config file, and keystore ONLY if they do
 * not already exist.
 * @function init
 */
export function init(): void {

    if (!fs.existsSync(defaultChattervoxDir)) {
        fs.mkdirSync(defaultChattervoxDir)
    }

    if (!exists(defaultConfigPath)) {
        save(defaultConfig)
    }

    if (!exists(defaultKeystorePath)) {
        // simply creating a new keystore object with save the store
        new Keystore(defaultKeystorePath)
    }
}
