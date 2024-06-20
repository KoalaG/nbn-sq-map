import IMode from "../interfaces/mode.interface";
import { LegendItem, NbnPlace, PointAndPlaces } from "../types";
import * as L from "leaflet";

import {
    isDebugMode
} from "../utils";

const COL_FW_AVAIL_SUPERFAST = '#1D7044';
const COL_FW_AVAIL_FAST      = '#02B9E3';
const COL_FW_AVAIL_PLUS      = '#FFBE00';
const COL_FW_PLANNED           = '#FF7E01';
const COL_TECH_COMMITTED        = '#E3071D';
const COL_TECH_MDU_INBUILD      = '#022BE3';
const COL_FW_NOT_PLANNED     = '#E3071D';
const COL_UNKNOWN               = '#888888';

export default class FixedWirelessMode implements IMode {

    readonly id = 'fw';
    readonly name = 'Fixed Wireless';

    filter(place: NbnPlace) : boolean {

        if (place.techType == 'WIRELESS') {
            return true;
        }

        return false;

    }

    pointColour(point: PointAndPlaces) : string {
        return this.placeColour(point.places[0]);
    }

    placeColour(place: NbnPlace) : string {

        if (place.hstStatus == 'Eligible to Order') {
            switch(place.hstSpeedTier) {
                case 'FW Superfast': return COL_FW_AVAIL_SUPERFAST;
                case 'FW Home Fast': return COL_FW_AVAIL_FAST;
                case 'FW Plus': return COL_FW_AVAIL_PLUS;
            }
        }

        switch(place.hstStatus) {
            case 'Planned': return COL_FW_PLANNED;
            case 'Not Planned': return COL_FW_NOT_PLANNED;
        }
        
        return COL_UNKNOWN;

    }

    renderPopupContent(place: NbnPlace) : HTMLElement {
        
        const content = L.DomUtil.create('div');

        content.innerHTML = '<b>'+place.id+'</b></br>'
            + place.address1 + '</br>'
            + place.address2 + '</br>'
            + '<br />';
            
        content.innerHTML += '<b>Fixed Wireless</b></br>';
        
        if (place.programType == 'Fixed Wireless and Satellite Upgrade Program') {
            content.innerHTML += 'Program: Fixed Wireless Upgrade Program<br />';
            content.innerHTML += 'Status: ' + place.hstStatus + '<br />';
            content.innerHTML += 'SpeedTier: ' + place.hstSpeedTier + '<br />';
            content.innerHTML += 'Target Qtr: ' + place.targetEligibilityQuarter + '<br />';
        }

        content.innerHTML += '<br />'; 
        
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
                label: 'Available - Superfast',
                colour: COL_FW_AVAIL_SUPERFAST
            },
            {
                label: 'Available - Home Fast',
                colour: COL_FW_AVAIL_FAST
            },
            {
                label: 'Available - Plus',
                colour: COL_FW_AVAIL_PLUS
            },
            {
                label: 'Planned',
                colour: COL_FW_PLANNED
            },
            {
                label: 'Not Planned',
                colour: COL_FW_NOT_PLANNED
            },
            {
                label: 'Unknown',
                colour: COL_UNKNOWN
            }
        ];
    }

}