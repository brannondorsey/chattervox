import { Station } from './Packet'

export function timeout(millis: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, millis)
    })
}

export function stationToCallsignSSID(station: Station): string {
    return typeof station.ssid === 'number' && station.ssid !== 0 ? 
        `${station.callsign}-${station.ssid}` : station.callsign
}

export function callsignSSIDToStation(callsignSSID: string): Station {
    if (isCallsignSSID(callsignSSID)) {
        const [callsign, ssid] = callsignSSID.split('-')
        return { callsign: callsign, ssid: parseInt(ssid) }
    } else if(isCallsign(callsignSSID)) {
        return { callsign: callsignSSID, ssid: 0 }
    } else {
        throw TypeError(`Invalid callsign: ${callsignSSID}`)
    }
}

// mainly lifted from node-ax25 utils.testCallsign
// callsign must be max 6 characters alphanumeric (no "-")
export function isCallsign(callsign: string): boolean {
    if (typeof callsign !== 'string' || callsign.length > 6) return false
    callsign = callsign.toUpperCase().replace(/\s*$/g, "")
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
    return parseInt(ssid) >= 0 && parseInt(ssid) <= 15 && isCallsign(callsign)
}