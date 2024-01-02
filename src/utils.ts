import { NbnPlace } from "./types";

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
