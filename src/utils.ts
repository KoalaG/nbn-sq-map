import { NbnPlace } from "./types";


export class Logger {

    sub(name: string) {
        return new Logger(`${this.name}.${name}`);
    }

    constructor(private name: string) {
    }

    error(...args: any[]) {
        console.error(`[${this.name}]`, ...args);
    }

    warn(...args: any[]) {
        console.warn(`[${this.name}]`, ...args);
    }

    debug(...args: any[]) {
        if (isDebugMode()) {
            console.debug(`[${this.name}]`, ...args);
        }
    }
    
    info(...args: any[]) {
        console.info(`[${this.name}]`, ...args);
    }

    log(...args: any[]) {
        console.log(`[${this.name}]`, ...args);
    }
}

export function chunkArray<T>(array: T[], size: number): T[][] {
    const results = [];
    while (array.length) {
        results.push(array.splice(0, size));
    }
    return results;
}

export function isLocalhost() {
    return window.location.href.includes('localhost')
        || window.location.href.includes('127.0.0.1')
}

export function isDebugMode() {
    return process.env.NODE_ENV === 'development'
        || window.location.href.includes('localhost')
        || window.location.href.includes('debug=true')
    ;
}

export function isPlaceFTTP(place: NbnPlace) {
    return place.techType === 'FTTP';
}

export function isPlaceFTTN(place: NbnPlace) {
    return place.techType === 'FTTN';
}

export function isPlaceHFC(place: NbnPlace) {
    return place.techType === 'HFC';
}

export function isPlaceFTTB(place: NbnPlace) {
    return place.techType === 'FTTB';
}

export function isPlaceFTTC(place: NbnPlace) {
    if(place.techType == "FTTC"
        && place.reasonCode && place.reasonCode.match(/^FTTC/)
        && place.techChangeStatus == 'New Tech Connected'
    ) {
        return true;
    }
    return false;
}

export function isPlaceFixedWireless(place: NbnPlace) {
    return place.techType === 'Fixed Wireless';
}

export function isPlaceSatellite(place: NbnPlace) {
    return place.techType === 'Satellite';
}

export function isPlaceFTTPAvail(place: NbnPlace) {
    if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
        switch(place.techChangeStatus) {
            case 'Eligible To Order':
                return true;
        }
    }
    return false;
}

export function isPlaceFTTPSoon(place: NbnPlace) {
    if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
        switch(place.techChangeStatus) {
            case 'In Design':
            case 'Build Finalised':
            case 'Planned':
            case 'MDU Complex Eligible To Apply':
            case 'MDU Complex Premises In Build':
                return true;
        }
    }
    return false;
}

export function isPlaceFTTPFar(place: NbnPlace) {
    if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
        switch(place.techChangeStatus) {
            case 'Committed':
                return true;
        }
    }
}

export function isFwtoFTTN(place: NbnPlace) {
    return place.techType == "FTTN"
        && place.reasonCode == "FTTN_SA"
        && place.altReasonCode == "FW_CT"
        && place.techChangeStatus == 'Eligible To Order'
    ;
}

export function isFwtoFTTC(place: NbnPlace) {
    return place.techType == "FTTC"
        && place.reasonCode == "FTTC_SA"
        && place.altReasonCode == "FW_CT"
        && place.techChangeStatus == 'Eligible To Order'
    ;
}

export function isSatToFW(place: NbnPlace) {
    return place.techType == "WIRELESS"
        && place.reasonCode == "FW_SA"
        && place.techChangeStatus == 'Eligible To Order'
    ;
}
