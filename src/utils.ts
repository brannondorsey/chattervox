import { Station } from './Packet'
import * as crypto from 'crypto'

export function timeout(millis: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, millis)
    })
}

// MD5 is weak as hell. Don't use this for anything cryptographic.
export function md5(buffer: string | Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex')
}

export function stationToCallsignSSID(station: Station): string {
    return typeof station.ssid === 'number' && station.ssid !== 0 ? 
        `${station.callsign}-${station.ssid}` : station.callsign
}

/**
 * @function callsignSSIDToStation
 * @param  {string} callsignSSID
 * @throws {TypeError} If callsignSSID is invalid
 * @returns Station
 */
export function callsignSSIDToStation(callsignSSID: string): Station {
    if (isCallsignSSID(callsignSSID)) {
        const [callsign, ssidStr] = callsignSSID.split('-')
        const ssid = parseInt(ssidStr)
        return { callsign: callsign, ssid: ssid }
    } else if(isCallsign(callsignSSID)) {
        return { callsign: callsignSSID, ssid: 0 }
    } else {
        throw TypeError(`Invalid callsignSSID: ${callsignSSID}`)
    }
}

// mainly lifted from node-ax25 utils.testCallsign
// callsign must be max 6 characters alphanumeric (no "-")
export function isCallsign(callsign: string): boolean {
    if (typeof callsign !== 'string' || callsign.length > 6) return false
    callsign = callsign.toUpperCase().replace(/\s*$/g, "")
    // AX.25 has a built-in hard limit of six characters, which means a 
    // seven-character callsign cannot be used in an AX.25 network. 
    if (callsign.length < 1 || callsign.length > 6) return false
    for(let c = 0; c < callsign.length; c++) {
        let a: number = callsign[c].charCodeAt(0)
        if((a >= 48 && a <= 57) || (a >= 65 && a <= 90)) continue
        return false
    }
    return true
}

export function isCallsignSSID(callsignSSID: string): boolean {
    if ((callsignSSID.match(/-/g) || []).length !== 1) return false
    const [callsign, ssid] = callsignSSID.split('-')
    return isCallsign(callsign) && isSSID(parseInt(ssid))
}

export function isSSID(ssid: number) {
    if (typeof ssid !== 'number') 
        throw TypeError('ssid must be a number type')
    return ssid >= 0 && ssid <= 15
}