import IMode from "../interfaces/mode.interface";
import { LegendItem, NbnPlace, PointAndPlaces } from "../types";
import * as L from "leaflet";

import {
    isPlaceFTTP,
    isPlaceFTTC,
    isPlaceFTTPAvail,
    isPlaceFTTPSoon,
    isPlaceFTTPFar,
    isFwtoFTTC,
    isFwtoFTTN,
    isSatToFW,
    isDebugMode
} from "../utils";

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
const colourUnknown      = '#888888';

function getTechColour(techType: string) {
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

export default class AllMode implements IMode {

    readonly id = 'all';
    readonly name = 'Show All Locations';

    filter(place: NbnPlace) : boolean {
        return true;
    }

    pointColour(point: PointAndPlaces) : string {
        return this.placeColour(point.places[0]);
    }

    placeColour(place: NbnPlace) : string {
        
        if (isPlaceFTTP(place)) {
            return colourFTTP;
        }
    
        if (isPlaceFTTPAvail(place)) {
            return colourFTTPAvail;
        }
    
        if (isPlaceFTTPSoon(place)) {
            return colourFTTPSoon;
        }
    
        if (isPlaceFTTPFar(place)) {
            return getTechColour(place.techType);
        }
    
        if (isPlaceFTTC(place)) {
            return colourFTTC;
        }
    
        if (isFwtoFTTC(place)) {
            return colourFTTCAvail;
        }
    
        if (isFwtoFTTN(place)) {
            return colourFTTNB;
        }
        
        if (isSatToFW(place)) {
            return colourFWAvail;
        }
    
        if (place.altReasonCode && place.altReasonCode != 'NULL_NA') {
            console.log(place);
        }
    
        return getTechColour(place.techType);

    }

    renderPopupContent(place: NbnPlace) : HTMLElement {
        
        const content = L.DomUtil.create('div');

        content.innerHTML = '<b>'+place.id+'</b></br>'
            + place.address1 + '</br>'
            + place.address2 + '</br>'
            + '<br />';
            
        content.innerHTML += '<b>Technology Plan</b></br>';

        /** Technology Plan Final State */
        if (place.techType == 'FTTP'
            || !place.altReasonCode
            || place.altReasonCode == 'NULL_NA'
        ) {
            content.innerHTML += 'Technology: ' + place.techType + '<br />';
            if (place.techType != 'FTTP') {
                content.innerHTML += 'No tech upgrade planned<br />';
            }
        } 
        
        else if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
            content.innerHTML += 'Current: ' + place.techType + '<br />';
            content.innerHTML += 'Change: ' + place.altReasonCode + '<br />';
            content.innerHTML += 'Status: ' + place.techChangeStatus + '<br />';
            content.innerHTML += 'Program: ' + place.programType + '<br />';
            content.innerHTML += 'Target Qtr: ' + place.targetEligibilityQuarter + '<br />';
        }
        
        else {
            content.innerHTML += 'Current: ' + place.techType + '<br />';
            content.innerHTML += 'Change: ' + place.altReasonCode + '<br />';
            content.innerHTML += 'Status: ' + place.techChangeStatus + '<br />';
            content.innerHTML += 'Program: ' + place.programType + '<br />';
            content.innerHTML += 'Target Qtr: ' + place.targetEligibilityQuarter + '<br />';
        }


        content.innerHTML += '<br />'; 
        
        if (place.ee) {
            content.innerHTML  += '<b>Enterprise Ethernet</b></br>';
            content.innerHTML  += 'Price Zone: ' + ( place.cbdpricing ? 'CBD' : 'Zone 1/2/3' ) + '<br />'
            content.innerHTML  += 'Build Cost: ' + ( place.zeroBuildCost ? '$0' : 'POA' ) + '<br />'
            content.innerHTML  += '<br />';
        }

        if (isDebugMode()) {
            const hr = L.DomUtil.create('hr');
            const pre = L.DomUtil.create('pre');
            pre.innerHTML = JSON.stringify(place, null, 2);
            content.appendChild(hr);
            content.appendChild(pre);
        }

        return content;
    }

    renderTooltip(places: NbnPlace[]) : string {
        let label = places[0].address1;

        if (places.length > 1) {
            label += ' ( + ' + (places.length - 1) + ' more)';
        }

        return label;

    }

    getLegendItems(): LegendItem[] {
        return [
            {
                label: 'FTTP',
                colour: colourFTTP,
            },
            {
                label: 'FTTP Upgrade',
                colour: colourFTTPAvail,
            },
            {
                label: 'FTTP Coming',
                colour: colourFTTPSoon,
            },
            {
                label: 'HFC',
                colour: colourHFC,
            },
            {
                label: 'FTTC',
                colour: colourFTTC,
            },
            {
                label: 'FTTN/FTTB',
                colour: colourFTTNB,
            },
            {
                label: 'FW',
                colour: colourFW,
            },
            {
                label: 'FW Upgrade',
                colour: colourFWAvail,
            },
            {
                label: 'Satellite',
                colour: colourSat,
            },
            {
                label: 'Unknown',
                colour: colourUnknown,
            }
        ];
    }

}