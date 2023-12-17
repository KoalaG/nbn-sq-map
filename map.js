(function() {

    const DEFAULT_OPTIONS = {
        mapContainerId: 'map',
    }

    const MIN_ZOOM_FOR_DATA_FETCH = 13;

    
    // Constant Colours
    const colourFTTP 		= '#1D7044';
    const colourFTTPAvail   = '#75AD6F';
    const colourFTTPSoon    = '#C8E3C5';
    const colourHFC 		= '#FFBE00';
    const colourFTTC 		= '#FF7E01';
    const colourFTTCAvail   = '#FF7E01';
    const colourFTTNB 		= '#E3071D';
    const colourFW 		    = '#02B9E3';
    const colourFWAvail 	= '#022BE3';
    const colourSat 	    = '#6B02E3';

    const colourEE_CBD_ZBC  = '#1D7044';
    const colourEE_CBD_BC   = '#02B9E3';
    const colourEE_Z123_ZBC = '#FF7E01';
    const colourEE_Z123_BC  = '#E3071D';
    
    const COL_TECH_COMPLETE         = '#1D7044';
    const COL_TECH_AVAIL            = '#02B9E3';
    const COL_TECH_BUILDFINALISED   = '#FFBE00';
    const COL_TECH_DESIGN           = '#FF7E01';
    const COL_TECH_COMMITTED        = '#E3071D';

    const COL_TECH_MDU_INBUILD      = '#022BE3';
    const COL_TECH_MDU_ELIGIBLE     = '#6B02E3';

    const colourUnknown      = '#888888';

    function isPlaceFTTP(place) {
        return place.techType == 'FTTP';
    }

    function isPlaceFTTPAvail(place) {
        if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
            switch(place.techChangeStatus) {
                case 'Eligible To Order':
                    return true;
            }
        }
        return false;
    }

    function isPlaceFTTPSoon(place) {
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

    function isPlaceFTTPFar(place) {
        if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
            switch(place.techChangeStatus) {
                case 'Committed':
                    return true;
            }
        }
    }

    function isPlaceFTTC(place) {
        if(place.techType == "FTTC"
            && place.reasonCode && place.reasonCode.match(/^FTTC/)
            && place.techChangeStatus == 'New Tech Connected'
        ) {
            return true;
        }
        return false;
    }

    function isFWtoFTTC(place) {
        return place.techType == "FTTC"
            && place.reasonCode && place.reasonCode.match(/^FTTC/)
            && place.techChangeStatus == 'Eligible To Order'
        ;
    }

    function isFwtoFTTN(place) {
        return place.techType == "FTTN"
            && place.reasonCode == "FTTN_SA"
            && place.altReasonCode == "FW_CT"
            && place.techChangeStatus == 'Eligible To Order'
        ;
    }

    function isSatToFW(place) {
        return place.techType == "WIRELESS"
            && place.reasonCode == "FW_SA"
            && place.techChangeStatus == 'Eligible To Order'
        ;
    }

    function getTechColour(techType) {
        switch(techType) {
            case 'FTTP': return colourFTTP;
            case 'FTTC': return colourFTTC;
            case 'FTTN':
            case 'FTTB': return colourFTTNB;
            case 'HFC': return colourHFC;
            case 'WIRELESS': return colourFW;
            case 'SATELLITE': return colourSat;
        }
        return colourUnknown;
    }

})();