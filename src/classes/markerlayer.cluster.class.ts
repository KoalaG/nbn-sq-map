import IDatastore from "../interfaces/datastore.interface";
import IMarkerLayer from "../interfaces/markerlayer.interface";
import 'leaflet.markercluster';

import * as L from "leaflet";
import { NbnPlace, PointAndLocids, PointAndPlaces } from "../types";

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

    private markers: L.MarkerClusterGroup;

    constructor() {
        this.markers = new L.MarkerClusterGroup({
            maxClusterRadius: this.markerClusterRadius,
            spiderfyOnMaxZoom: false,
            disableClusteringAtZoom: 18,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            removeOutsideVisibleBounds: true,
            chunkedLoading: true,
            chunkProgress: (processed, total, elapsed) => {
                console.log('chunkProgress', processed, total, elapsed);
            },
        });
    }

    markerClusterRadius(zoom: number) {
        switch(zoom) {
            case 13: return 24;
            case 14: return 23;
            case 15: return 20;
            default: return 0;
        }
    }

    setMap(map: L.Map) {
        if (this.map) {
            this.map.removeLayer(this.markers);
        }
        this.map = map;
        this.markers.addTo(this.map);
        this.map.on('zoomend', () => {
            console.log('zoomend', this.map.getZoom());
        });
        return this;
    }
    setDatastore(datastore: IDatastore): ThisType<this> {
        this.datastore = datastore;
        return this;
    }


    private points: {
        [latLngString: string]: {
            layer: L.Layer,
            point: PointAndPlaces,
        }
    } = {};

    async refreshMarkersInsideBounds(bounds: L.LatLngBounds) {

        const newPoints = await this.datastore.getFullPointsWithinBounds(bounds);
        
        newPoints.forEach(point => {
            const latLngString = point.latlng;
            if (!this.points[latLngString]) {
                this.points[latLngString] = {
                    layer: this.renderPoint(point),
                    point,
                };
            } else {
                this.points[latLngString].point = point;
            }
        });

        this.markers.addLayers(Object.values(this.points).map(p => p.layer));
    }

    async removeMarkersOutsideBounds(bounds: L.LatLngBounds) {
        // We don't need to do anything here, as the marker cluster plugin handles this for us
        //const removeMarkers = this.markers.getLayers()
        //    .filter((layer: L.CircleMarker) => !bounds.contains(layer.getLatLng()))
        //;
        //this.markers.removeLayers(removeMarkers);
    }

    async removeAllMarkers(): Promise<void> {
        this.markers.clearLayers();
    }

    renderPoint(point: PointAndPlaces): L.Layer {

        const circleMarkerLayer = L.circleMarker([ point.latitude, point.longitude ], {
            radius: 5,
            fillColor: this.getPlaceColour(point.places[0]), //this.getPlaceColour(place),
            color: "#000000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        });

        circleMarkerLayer.bindPopup(() => this.renderPopupContent(point), {
            autoPan: true,
            autoClose: false,
        });

        circleMarkerLayer.bindTooltip((layer) => {
            return this.points[point.latlng].point.places.map((place) => place.address1).join(', ')
        }, {
            
        });
        
        return circleMarkerLayer;

    }

    

    renderPopupContent(point: PointAndPlaces) {

        const places = point.places;
        const place = places[0];

        let popup = '<b>'+place.locid+'</b></br>'
            + place.address1 + '</br>'
            + place.address2 + '</br>'
            + '<br />';
            
        popup += '<b>Technology Plan</b></br>';

        /** Technology Plan Final State */
        if (place.techType == 'FTTP'
            || !place.altReasonCode
            || place.altReasonCode == 'NULL_NA'
        ) {
            popup += 'Technology: ' + place.techType + '<br />';
            if (place.techType != 'FTTP') {
                popup += 'No tech upgrade planned<br />';
            }
        } 
        
        else if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
            popup += 'Current: ' + place.techType + '<br />';
            popup += 'Change: ' + place.altReasonCode + '<br />';
            popup += 'Status: ' + place.techChangeStatus + '<br />';
            popup += 'Program: ' + place.programType + '<br />';
            popup += 'Target Qtr: ' + place.targetEligibilityQuarter + '<br />';
        }
        
        else {
            popup += 'Current: ' + place.techType + '<br />';
            popup += 'Change: ' + place.altReasonCode + '<br />';
            popup += 'Status: ' + place.techChangeStatus + '<br />';
            popup += 'Program: ' + place.programType + '<br />';
            popup += 'Target Qtr: ' + place.targetEligibilityQuarter + '<br />';
        }


        popup += '<br />'; 

        /*if (this.controls.displayMode.displayMode == 'upgrade') {
            popup += '<b>Debug</b></br>';
            popup += '<pre>' + JSON.stringify(place, null, 2) + '</pre>';
        }*/
        
        /*if (place.ee && this.controls.displayMode.displayMode == 'ee' || this.controls.displayMode.displayMode == 'all') {
            popup += '<b>Enterprise Ethernet</b></br>';
            popup += 'Price Zone: ' + ( place.cbdpricing ? 'CBD' : 'Zone 1/2/3' ) + '<br />'
            popup += 'Build Cost: ' + ( place.zeroBuildCost ? '$0' : 'POA' ) + '<br />'
            popup += '<br />';
        }*/

        return popup;

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