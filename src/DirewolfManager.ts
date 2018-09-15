
import { promisify } from 'util'
import { ChildProcess, spawn, exec } from 'child_process'
import { sync as commandExistsSync } from 'command-exists'

const exists = commandExistsSync('direwolf')
// quiet the decoding of APRS packets
const path = 'direwolf'
const args: string[] = ['-p', '-q', 'd', '-t', '0']
let proc: ChildProcess = null

// export interface OnError { (error: Error): void }
// export interface OnExit { (code: number): void }
// export interface OnClose { (code: number): void }

// export let onError: OnError = function() {}
// export let onExit: OnExit = function() {}
// export let onClose: OnClose = function() {}

export function installed(direwolfPath?: string): boolean {
    return typeof direwolfPath === 'undefined' ? exists : commandExistsSync(direwolfPath)
}

export async function running(direwolfPath?: string): Promise<boolean> {

    if (typeof direwolfPath === 'undefined' && proc) return !proc.killed
    
    const platform: string = process.platform
    const query: string = direwolfPath || 'direwolf'
    let cmd: string = ''

    switch (platform) {
        case 'win32': cmd = `tasklist`; break;
        case 'darwin': cmd = `ps -ax | grep ${query}`; break;
        case 'linux': cmd = `ps -A`; break;
        default: break;
    }

    const { stdout } = await promisify(exec)(cmd)
    return stdout.toLowerCase().indexOf(query.toLowerCase()) > -1
}

export async function start(direwolfPath?: string): Promise<void> {
    const isUp: boolean = await running(direwolfPath)
    if (isUp || proc) return 
    else {
        if (!installed(direwolfPath)) throw Error(`${direwolfPath} is not installed`)
        proc = spawn(direwolfPath || path, args)
        // proc.on('error', onError)
        // proc.on('exit', onExit)
        // proc.on('close', onClose)
    }
}

/**
 * Kill a process that was launched with start()
 */
export async function kill(): Promise<void> {
    
    const promise: Promise<void> = new Promise((resolve, reject) => {
        
        if (proc) {
            proc.on('close', () => {
                proc = null
                resolve()
            })
    
            proc.on('error', reject)

            proc.kill()
        } else {
            reject(TypeError('The process object is null. Cannot kill null process.'))
        }
    })

    return promise
}
