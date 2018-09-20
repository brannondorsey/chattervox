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

export function callsignSSIDToStation(callsign: string): Station {
    if (callsign.includes('-')) {
        const parts = callsign.split('-')
        if (parts.length !== 2) throw TypeError(`Invalid callsign + SSID combo: ${callsign}`)
        const ssid = parseInt(parts[1])
        if (ssid < 0 || ssid > 15) throw TypeError(`Invalid SSID in ${callsign}`)
        return { callsign: parts[0], ssid }
    } else {
        return { callsign, ssid: 0 }
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