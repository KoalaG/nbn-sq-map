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

const COL_EE_CBD_ZBC    = '#1D7044';
const COL_EE_CBD_BC     = '#02B9E3';
const COL_EE_Z123_ZBC   = '#FF7E01';
const COL_EE_Z123_BC    = '#E3071D';
const COL_UNKNOWN       = '#888888';

export default class EEMode implements IMode {

    filter(place: NbnPlace) : boolean {
        return place.addressDetail.ee;
    }

    pointColour(point: PointAndPlaces) : string {
        return this.placeColour(point.places[0]);
    }

    placeColour(place: NbnPlace) : string {

        if(place.addressDetail.cbdpricing && place.addressDetail.zeroBuildCost) {
            return COL_EE_CBD_ZBC;
        }

        if(place.addressDetail.cbdpricing && !place.addressDetail.zeroBuildCost) {
            return COL_EE_CBD_BC;
        }

        if(!place.addressDetail.cbdpricing && place.addressDetail.zeroBuildCost) {
            return COL_EE_Z123_ZBC;
        }

        if(!place.addressDetail.cbdpricing && !place.addressDetail.zeroBuildCost) {
            return COL_EE_Z123_BC;
        }
        
        return COL_UNKNOWN;

    }

    renderPopupContent(place: NbnPlace) : HTMLElement {
        
        const content = L.DomUtil.create('div');

        content.innerHTML = '<b>'+place.id+'</b></br>'
            + place.addressDetail.address1 + '</br>'
            + place.addressDetail.address2 + '</br>'
            + '<br />';

        content.innerHTML  += '<b>Enterprise Ethernet</b></br>';
        content.innerHTML  += 'Price Zone: ' + ( place.addressDetail.cbdpricing ? 'CBD' : 'Zone 1/2/3' ) + '<br />'
        content.innerHTML  += 'Build Cost: ' + ( place.addressDetail.zeroBuildCost ? '$0' : 'POA' ) + '<br />'
        content.innerHTML  += '<br />';
        
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
        let label = places[0].addressDetail.address1;

        if (places.length > 1) {
            label += ' ( + ' + (places.length - 1) + ' more)';
        }

        return label;

    }

    getLegendItems(): LegendItem[] {
        return [
            {
                label: 'EE CBD $0',
                colour: COL_EE_CBD_ZBC
            },
            {
                label: 'EE CBD POA',
                colour: COL_EE_CBD_BC
            },
            {
                label: 'EE Z123 $0',
                colour: COL_EE_Z123_ZBC
            },
            {
                label: 'EE Zone 1/2/3 POA',
                colour: COL_EE_Z123_BC
            },
            {
                label: 'Unknown',
                colour: COL_UNKNOWN
            }
        ];
    }

}