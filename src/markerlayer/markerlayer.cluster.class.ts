import IDatastore from "../interfaces/datastore.interface";
import IMarkerLayer from "../interfaces/markerlayer.interface";

import * as L from "leaflet";
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';

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

import IMode from "../interfaces/mode.interface";
import IPlaceStore from "../interfaces/placestore.interface";
import { Logger } from "../utils";

export default class MarkerLayerCluster implements IMarkerLayer {

    private logger = new Logger('MarkerLayerCluster');

    private map: L.Map;
    private placeStore: IPlaceStore;
    private modeHandler: IMode;

    private markers: L.MarkerClusterGroup;

    private pointMap: Map<string, {
        layer: L.CircleMarker,
        point: PointAndLocids
    }> = new Map();

    constructor(map: L.Map, modeHandler: IMode, placeStore: IPlaceStore) {

        this.map = map;
        this.placeStore = placeStore;
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

    /**
     * Add points to the map
     * @param points 
     */
    addPoints(
        points: Map<string, PointAndLocids>
    ) : void
    {

        const logger = this.logger.sub('addPoints');
        
        const newLayers: L.CircleMarker[] = [];

        // Add the points to the point store
        points.forEach((point) => {
            const latLngString = point.lat + ',' + point.lng;
            const pointMap = this.pointMap.get(latLngString);
            if (!pointMap) {
                const newLayer = this.renderPoint(point);
                newLayers.push(newLayer);
                this.pointMap.set(latLngString, {
                    layer: newLayer,
                    point,
                });
            } else {
                pointMap.point = point;
            }
        });

        // Add all the layers to the map
        logger.debug('Adding new layers', newLayers.length);
        if (newLayers.length) {
            this.markers.addLayers(newLayers);
        }

    }

    /**
     * Remove points from the map
     * @param points 
     */
    removeAllPoints() : void
    {
        this.logger.sub('removeAllPoints').debug('Removing all points', this.pointMap);
        this.markers.clearLayers();
        this.pointMap.clear();
        this.logger.sub('removeAllPoints').debug('Removed all points', this.pointMap);
    }

    
    async removeAllMarkers(): Promise<void> {
        this.removeAllPoints();
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

    private updatePointStyle(places: NbnPlace[], layer: L.CircleMarker) {
        layer.setStyle({
            fillColor: this.modeHandler.placeColour(places[0]),
        });
        layer.setTooltipContent(this.modeHandler.renderTooltip(places));
        layer.redraw();
    }

    /**
     * Set the mode handler
     *  - Store the mode handler
     *  - Update the colour of the points
     * @param modeHandler 
     * @returns 
     */
    setModeHandler(modeHandler: IMode, placestore: IPlaceStore) {

        this.modeHandler = modeHandler;
        /*
        this.pointMap.forEach(({ layer, point }) => {

            // Get the places
            const getPlaces = placestore.getPlaces(point.ids);

            // Update the point style
            getPlaces.then((places) => this.updatePointStyle(places, layer));

        });

        if (this.markers && this.markers.getLayers().length) {
            this.markers.refreshClusters();
        }
        */
        return this;
    }

    async DEP_refreshMarkersInsideBounds(bounds: L.LatLngBounds, mFilter?: (place: NbnPlace) => boolean) {

        /*
        if (!this.datastore) {
            throw new Error('Datastore not set');
        }

        const newPoints = await this.datastore.getFullPointsWithinBounds(bounds);
        
        newPoints
            .forEach(point => {
                const latLngString = point.latlng;
                if (!this.pointStore[latLngString]) {
                    this.pointStore[latLngString] = {
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
        */
    }

    async removeMarkersOutsideBounds(bounds: L.LatLngBounds) {
        // We don't need to do anything here, as the marker cluster plugin handles this for us
        //const removeMarkers = this.markers.getLayers()
        //    .filter((layer: L.CircleMarker) => !bounds.contains(layer.getLatLng()))
        //;
        //this.markers.removeLayers(removeMarkers);
    }

    renderPoint(point: PointAndLocids): L.CircleMarker {
            
        const circleMarkerLayer = L.circleMarker([ point.lat, point.lng ], {
            radius: 5,
            fillColor: point.col ? point.col[0] : undefined, //this.getPlaceColour(place),
            color: "#000000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        });

        circleMarkerLayer.on('click', (event) => {
            console.log('click', event);
        });

        circleMarkerLayer.bindPopup(
            (layer) => {

                // Async render popup from placeStore data
                this.placeStore.getPlaces(point.ids).then((places) => {
                    const popup = this.renderPopup(places);
                    layer.setPopupContent(popup);
                });

                // Return loading popup content
                const loadingPopup = document.createElement('div');
                loadingPopup.innerHTML = '<div class="loading">Loading...</div>';

                return loadingPopup;

            },
            {
                autoPan: true,
                autoClose: false,
            }
        );

        circleMarkerLayer.bindTooltip(
            (layer) => {
                let label = point.add[0];
        
                if (point.add.length > 1) {
                    label += ' ( + ' + (point.add.length - 1) + ' more)';
                }
        
                return label;
            },
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

        places.sort((a, b) => {
            if (a.address1 < b.address1) {
                return -1;
            }
            if (a.address1 > b.address1) {
                return 1;
            }
            return 0;
        });

        for (let place of places) {

            const placeContainer = document.createElement('div');

            const placeColour = this.modeHandler.placeColour(place);

            // Create Accordion Button
            const button = document.createElement('button');
            button.classList.add('accordion');
            button.type = 'button';
            button.innerHTML = `<svg height="15" width="15" style="margin-right:3px">`
                + `<circle class="circle" cx="7.5" cy="9" r="5" stroke="#000" stroke-width="1" fill="${placeColour}" />`
                + `</svg>`
                + `<span>${place.address1}</span>`
            
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



    /**
     * Create the icon for the cluster
     * @param cluster 
     * @returns 
     */
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

}