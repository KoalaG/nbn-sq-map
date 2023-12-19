import IDatastore from "../interfaces/datastore.interface";
import IMarkerLayer from "../interfaces/markerlayer.interface";

import * as L from "leaflet";
import { MarkerClusterGroup } from "leaflet";
import { NbnPlace, PointAndLocids } from "../types";

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

function isPlaceFTTP(place: NbnPlace) {
    return place.techType == 'FTTP';
}

function isPlaceFTTPAvail(place: NbnPlace) {
    if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
        switch(place.techChangeStatus) {
            case 'Eligible To Order':
                return true;
        }
    }
    return false;
}

function isPlaceFTTPSoon(place: NbnPlace) {
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

function isPlaceFTTPFar(place: NbnPlace) {
    if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
        switch(place.techChangeStatus) {
            case 'Committed':
                return true;
        }
    }
}

function isPlaceFTTC(place: NbnPlace) {
    if(place.techType == "FTTC"
        && place.reasonCode && place.reasonCode.match(/^FTTC/)
        && place.techChangeStatus == 'New Tech Connected'
    ) {
        return true;
    }
    return false;
}

function isFWtoFTTC(place: NbnPlace) {
    return place.techType == "FTTC"
        && place.reasonCode && place.reasonCode.match(/^FTTC/)
        && place.techChangeStatus == 'Eligible To Order'
    ;
}

function isFwtoFTTN(place: NbnPlace) {
    return place.techType == "FTTN"
        && place.reasonCode == "FTTN_SA"
        && place.altReasonCode == "FW_CT"
        && place.techChangeStatus == 'Eligible To Order'
    ;
}

function isSatToFW(place: NbnPlace) {
    return place.techType == "WIRELESS"
        && place.reasonCode == "FW_SA"
        && place.techChangeStatus == 'Eligible To Order'
    ;
}

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

export default class MarkerLayerCluster implements IMarkerLayer {

    private map: L.Map;
    private datastore: IDatastore;

    private markers: MarkerClusterGroup;

    constructor(map: L.Map, datastore: IDatastore) {
        this.map = map;
        this.datastore = datastore;

        this.markers = new MarkerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: false,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: false,
        });

        this.markers.addTo(this.map);
    }

    async refreshMarkersInsideBounds(bounds: L.LatLngBounds) {
        const points = await this.datastore.getPointsWithinBounds(bounds);
        this.markers.addLayers(points.map(point => this.renderPoint(point)));
    }

    async removeMarkersOutsideBounds(bounds: L.LatLngBounds) {
        const removeMarkers = this.markers.getLayers()
            .filter((layer: L.CircleMarker) => !bounds.contains(layer.getLatLng()))
        ;

        this.markers.removeLayers(removeMarkers);
    }

    async removeAllMarkers(): Promise<void> {
        this.markers.clearLayers();
    }

    renderPoint(point: PointAndLocids): L.Layer {

        const circleMarkerLayer = L.circleMarker([ point.latitude, point.longitude ], {
            radius: 5,
            fillColor: colourFTTP, //this.getPlaceColour(place),
            color: "#000000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        });
        
        return circleMarkerLayer;

    }

    getPlaceColour(place: NbnPlace) {

        /** EE Display Mode */
        /*
        if (this.controls.displayMode.displayMode == 'ee') {

            if(place.cbdpricing && place.zeroBuildCost) {
                return colourEE_CBD_ZBC;
            }

            if(place.cbdpricing && !place.zeroBuildCost) {
                return colourEE_CBD_BC;
            }

            if(!place.cbdpricing && place.zeroBuildCost) {
                return colourEE_Z123_ZBC;
            }

            if(!place.cbdpricing && !place.zeroBuildCost) {
                return colourEE_Z123_BC;
            }

            return colourUnknown;

        }

        if (this.controls.displayMode.displayMode == 'upgrade') {
            
            switch (place.techChangeStatus) {
                case 'Previous Tech Disconnected': return COL_TECH_COMPLETE;
                case 'New Tech Connected' : return COL_TECH_COMPLETE;
                case 'In Design': return COL_TECH_DESIGN;
                case 'Build Finalised': return COL_TECH_BUILDFINALISED;
                case 'Committed': return COL_TECH_COMMITTED;
                case 'Eligible To Order': return COL_TECH_AVAIL;
                case 'MDU Complex Eligible To Apply': return COL_TECH_MDU_ELIGIBLE;
                case 'MDU Complex Premises In Build': return COL_TECH_MDU_INBUILD;
            }

            return colourUnknown;
        }*/

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

        if (isFWtoFTTC(place)) {
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

}