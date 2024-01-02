import IDatastore from "../interfaces/datastore.interface";
import IMarkerLayer from "../interfaces/markerlayer.interface";
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
//import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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

import IMode from "../interfaces/mode.interface";

export default class MarkerLayerCluster implements IMarkerLayer {

    private map: L.Map;
    private datastore: IDatastore;
    private modeHandler: IMode;

    private markers: L.MarkerClusterGroup;

    private points: {
        [latLngString: string]: {
            layer: L.CircleMarker,
            point: PointAndPlaces,
        }
    } = {};

    constructor(map: L.Map, datastore: IDatastore, modeHandler: IMode) {

        this.map = map;
        this.datastore = datastore;
        this.modeHandler = modeHandler;

        this.markers = new L.MarkerClusterGroup({
            maxClusterRadius: this.markerClusterRadius,
            spiderfyOnMaxZoom: false,
            disableClusteringAtZoom: 18,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            removeOutsideVisibleBounds: true,
            iconCreateFunction: this.iconCreateFunction,
            chunkedLoading: true,
            chunkInterval: 150,
            chunkDelay: 150,
            chunkProgress: (processed, total, elapsed) => {
                console.log('chunkProgress', { processed, total, elapsed });
            },
        });

        this.markers.addTo(this.map);

        this.map.on('zoomend', (event) => {
            console.log('zoomend', event.target.getZoom());
        });

    }


    private iconCreateFunction(cluster: L.MarkerCluster) : L.DivIcon
    {
        
        const colorArray = cluster.getAllChildMarkers().map((marker) => (marker as any).options.fillColor)

        const colorCounts: {[color: string]: number} = {};

        colorArray.forEach((color) => {
            if (!colorCounts[color]) {
                colorCounts[color] = 0;
            }
            colorCounts[color]++;
        });

        const colorArraySorted = Object.keys(colorCounts)
            .sort((a, b) => colorCounts[b] - colorCounts[a])
        ;

        let background = 'background: conic-gradient('

        let lastColourPercent = 0;

        colorArraySorted.forEach((color, index) => {
            if (index == 0) {
                background += "\n" + color + ' 0%';
            }
            const thisColourPercent = (colorCounts[color] / colorArray.length * 100);
            background += ", \n" + color + ' ' + (lastColourPercent) + '%';
            background += ", \n" + color + ' ' + (lastColourPercent+thisColourPercent) + '%';
            lastColourPercent += thisColourPercent;
        });

        background += "\n);";

        const randomId = Math.random().toString(36).substring(7);

        return L.divIcon({
            html: `<style>#cluster_${randomId}::before { ${background} }</style> <div id='cluster_${randomId}'><span>` + cluster.getChildCount() + '</span></div>',
            className: 'marker-cluster',
        })
    }

    markerClusterRadius(zoom: number) {
        switch(zoom) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13: return 150;
            case 14: return 100;
            case 15:
            case 16:
            default: return 0;
        }
    }

    setModeHandler(modeHandler: IMode) {

        this.modeHandler = modeHandler;

        // Update the colour of the points
        Object.values(this.points).forEach(({layer, point}) => {
            layer.setStyle({
                fillColor: modeHandler.pointColour(point),
            });
            layer.redraw();
        });

        console.error(this.markers);

        if (this.markers && this.markers.getLayers().length) {
            this.markers.refreshClusters();
        }

        return this;
    }

    async refreshMarkersInsideBounds(bounds: L.LatLngBounds, mFilter?: (place: NbnPlace) => boolean) {

        if (!this.datastore) {
            throw new Error('Datastore not set');
        }

        const newPoints = await this.datastore.getFullPointsWithinBounds(bounds);
        
        newPoints
            .forEach(point => {
                const latLngString = point.latlng;
                if (!this.points[latLngString]) {
                    this.points[latLngString] = {
                        layer: this.renderPoint(point),
                        point,
                    };
                } else {
                    this.points[latLngString].point = point;
                }
            })


        if (mFilter) {

            const removeLayers: L.Layer[] = [];

            const filteredPoints = Object.values(this.points)
                .filter(({layer, point}) => {
                    const showPoint = point.places.filter(mFilter).length > 0;
                    if (!showPoint) {
                        removeLayers.push(layer);
                    }
                    return showPoint;
                });

            if (removeLayers.length) {
                this.markers?.removeLayers(removeLayers);
            }

            this.markers?.addLayers(filteredPoints.map(p => p.layer));

        }
            
        else {
            this.markers?.addLayers(Object.values(this.points).map(p => p.layer));
        }
    }

    async removeMarkersOutsideBounds(bounds: L.LatLngBounds) {
        // We don't need to do anything here, as the marker cluster plugin handles this for us
        //const removeMarkers = this.markers.getLayers()
        //    .filter((layer: L.CircleMarker) => !bounds.contains(layer.getLatLng()))
        //;
        //this.markers.removeLayers(removeMarkers);
    }

    async removeAllMarkers(): Promise<void> {
        this.markers?.clearLayers();
    }

    /**
     * Renders a point using the current mode handler.
     * @param point
     * @returns 
     */
    renderPoint(point: PointAndPlaces): L.CircleMarker {

        const circleMarkerLayer = L.circleMarker([ point.latitude, point.longitude ], {
            radius: 5,
            fillColor: this.modeHandler?.pointColour(point), //this.getPlaceColour(place),
            color: "#000000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        });

        circleMarkerLayer.bindPopup(
            (layer) => this.renderPopup(point.places) || '',
            {
                autoPan: true,
                autoClose: false,
            }
        );

        circleMarkerLayer.bindTooltip(
            (layer) => this.modeHandler.renderTooltip(point.places) || '',
            {}
        );
        
        return circleMarkerLayer;

    }

    renderPopup(places: NbnPlace[]) : HTMLElement {

        if (places.length == 1) {
            return this.modeHandler.renderPopupContent(places[0]);
        }

        return this.rendorPopupMulti(places);

    }
    
    rendorPopupMulti(places: NbnPlace[]) : HTMLElement {
        const groupDiv = document.createElement('div');

        const placeContainers: HTMLElement[] = [];

        for (let place of places) {

            const placeContainer = document.createElement('div');

            // Create Accordion Button
            const button = document.createElement('button');
            button.classList.add('accordion');
            button.type = 'button';
            button.textContent = place.address1;

            const title = document.createElement('div');

            
            // Add Panel
            const panel = document.createElement('div');
            panel.classList.add('panel');
            panel.appendChild(this.modeHandler.renderPopupContent(place));
            
            // Add Events
            button.addEventListener('click', () => {

                const currentlyActive = placeContainer.classList.contains('active');
                
                // Remove active class from all buttons and panels
                placeContainers.forEach((placeContainer) => {
                    placeContainer.classList.remove('active');
                });

                if (!currentlyActive) {
                    placeContainer.classList.add('active');
                }

            });

            // Add to DOM
            placeContainer.appendChild(button);
            placeContainer.appendChild(panel);
            groupDiv.appendChild(placeContainer);
            placeContainers.push(placeContainer);

        }

        return groupDiv;
    }

    /*
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
/*
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
*/

}