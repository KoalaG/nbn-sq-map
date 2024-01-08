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

const COL_TECH_COMPLETE         = '#1D7044';
const COL_TECH_AVAIL            = '#02B9E3';
const COL_TECH_BUILDFINALISED   = '#FFBE00';
const COL_TECH_DESIGN           = '#FF7E01';
const COL_TECH_COMMITTED        = '#E3071D';
const COL_TECH_MDU_INBUILD      = '#022BE3';
const COL_TECH_MDU_ELIGIBLE     = '#6B02E3';
const COL_UNKNOWN               = '#888888';

export default class TechUpgradeMode implements IMode {

    filter(place: NbnPlace) : boolean {

        if (place.techChangeStatus == 'Not Planned') {
            return false;
        }

        if (place.techChangeStatus) {
            return true;
        }

        return false;

    }

    pointColour(point: PointAndPlaces) : string {
        return this.placeColour(point.places[0]);
    }

    placeColour(place: NbnPlace) : string {

        switch(place.techChangeStatus) {
            case 'Previous Tech Disconnected': return COL_TECH_COMPLETE;
            case 'New Tech Connected' : return COL_TECH_COMPLETE;
            case 'In Design': return COL_TECH_DESIGN;
            case 'Build Finalised': return COL_TECH_BUILDFINALISED;
            case 'Committed': return COL_TECH_COMMITTED;
            case 'Eligible To Order': return COL_TECH_AVAIL;
            case 'MDU Complex Eligible To Apply': return COL_TECH_MDU_ELIGIBLE;
            case 'MDU Complex Premises In Build': return COL_TECH_MDU_INBUILD;
        }
        
        return COL_UNKNOWN;

    }

    renderPopupContent(place: NbnPlace) : HTMLElement {
        
        const content = L.DomUtil.create('div');

        content.innerHTML = '<b>'+place.locid+'</b></br>'
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
        
        if (place.location.technologyPlan?.forecastRTCDate) {
            content.innerHTML += 'Forecast RTC: ' + place.location.technologyPlan.forecastRTCDate + '<br />';
        }
        if (place.location.technologyPlan?.changeDate) {
            content.innerHTML += 'Change Date: ' + place.location.technologyPlan.changeDate + '<br />';
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
                label: 'Previous Tech Disconnected',
                colour: COL_TECH_COMPLETE
            },
            {
                label: 'New Tech Connected',
                colour: COL_TECH_COMPLETE
            },
            {
                label: 'Eligible To Order',
                colour: COL_TECH_AVAIL
            },
            {
                label: 'Build Finalised',
                colour: COL_TECH_BUILDFINALISED
            },
            {
                label: 'In Design',
                colour: COL_TECH_DESIGN
            },
            {
                label: 'Committed',
                colour: COL_TECH_COMMITTED
            },
            {
                label: 'MDU Complex Eligible To Apply',
                colour: COL_TECH_MDU_ELIGIBLE
            },
            {
                label: 'MDU Complex Premises In Build',
                colour: COL_TECH_MDU_INBUILD
            },
            {
                label: 'Unknown',
                colour: COL_UNKNOWN
            }
        ];
    }

}