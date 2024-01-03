
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'leaflet.locatecontrol';

import "esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css";
import "esri-leaflet-geocoder/dist/esri-leaflet-geocoder";
import * as ELG from "esri-leaflet-geocoder";


import { NbnPlace, NbnPlaceApiResponse, NbnTechMapOptions } from './types';
//import MarkerGroup from './marker_group.class.ts.dev';
//import ControlZoomWarning from './control_zoom_warning.class';
//import ControlFilter from './control_filter.class';

//import 'leaflet-google-places-autocomplete';
//import * as MarkerCluster from 'leaflet.markercluster';

import IApi from './interfaces/api.interface';
import IDatastore from './interfaces/datastore.interface';
import IMarkerLayer from './interfaces/markerlayer.interface';
import MarkerLayerCluster from './markerlayer/markerlayer.cluster.class';
import IControl from './interfaces/control.interface';
import { chunkArray, isDebugMode } from './utils';
import IMode from './interfaces/mode.interface';

import { Logger } from "./utils";

export function roundBounds(bounds: L.LatLngBounds): L.LatLngBounds {
    const north = Math.ceil(bounds.getNorth() * 50) / 50;
    const west = Math.floor(bounds.getWest() * 25) / 25;
    const south = Math.floor(bounds.getSouth() * 50) / 50;
    const east = Math.ceil(bounds.getEast() * 25) / 25;
    return L.latLngBounds([south, west], [north, east]);
}

const MAX_BOXES_IN_VIEW = 1000;

export default class NbnTechMap {

    private logger = new Logger('NbnTechMap');

    static readonly DEFAULT_OPTIONS: Partial<NbnTechMapOptions> = {
        mapContainerId: 'map',
    }

    /**
     * @Property {map} - Leaflet map object.
     */
    private map: L.Map;

    /**
     * @Property {mapTileLayer} - Leaflet map tile layer.
     */
    private mapTileLayer: L.TileLayer;

    /**
     * @Property {api} - API object.
     */
    private api: IApi;


    private mapLocate: L.Control.Locate;
    //private mapSearch: L.esri.Geocoding.Geosearch;

    /**
     * @Property {datastore} - Datastore object.
     */
    private datastore: IDatastore;

    /**
     * @Property {markerLayer} - Layer to hold markers
     */
    private markerLayer: IMarkerLayer;

    /**
     * @Property {markerFilter} - Function to filter markers
     */
    private markerFilter: (place: NbnPlace) => boolean = (place: NbnPlace) => true;

    private modeHandler: IMode;

    // Stores map controls
    /*controls: {[key: string]: any} = {
        zoomWarning: null,
        legend: null,
        displayMode: null,
        filter: null,
    }*/

    /**
     * 
     * @param {*} options 
     */
    constructor(options: NbnTechMapOptions) {

        options = { ...NbnTechMap.DEFAULT_OPTIONS, ...options };

        this.api = options.api;
        this.datastore = options.datastore;
        this.modeHandler = options.defaultModeHandler;

        // Create the map
        this.map = L.map(options.mapContainerId, { preferCanvas: true });

        // Set up the marker layer
        this.markerLayer = new MarkerLayerCluster(
            this.map, this.datastore, this.modeHandler
        )

        // Set up the OSM layer
        this.mapTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            crossOrigin: true,
            minZoom: 5,
            maxZoom: 20
        });

        // Add the layer to the map
        this.mapTileLayer.addTo(this.map);

        // Add search control
        //this.mapSearch = new ELG.
        /*
        
        this.mapSearch = L.esri.Geocoding.geosearch({
            position: 'topleft',
            providers: [
                L.esri.Geocoding.arcgisOnlineProvider({
                    countries: ['AU'],
                    token: 'AAPKa97b8a5374db4fa9b0fdd8e55361cba4Z9fEuw3ckAOIFHK1CP_VbzTv3OTeUz3ggrFAzVPzjyn3Q7bQFzbwkDMvDxaJ-JzG'
                })
            ]
        });
        this.mapSearch.addTo(this.map)
        */

        // Add locate control
        this.mapLocate = L.control.locate({
            position: 'topleft',
            locateOptions: {
                maxZoom: 16
            },
            setView: 'untilPan',
            keepCurrentZoomLevel: true,
            initialZoomLevel: 17,
            cacheLocation: true,
        });
        this.mapLocate.addTo(this.map);
        this.map.on('locateactivate', () => { localStorage.setItem('geolocate', '1'); });
        this.map.on('locatedeactivate', () => { localStorage.removeItem('geolocate'); });

        this.setInitialMapView();
        
        // store map position when moved or zoomed
        this.map.on('moveend', async () => {
            const center = this.map.getCenter();
            const zoom = this.map.getZoom();
            localStorage.setItem('startpos', JSON.stringify({ lat: center.lat, lng: center.lng, zoom }));

            //await this.displayMarkersInCurrentView();
            this.fetchDataForCurrentView();
        });

        //this.fetchDataForCurrentView();
        /*this.displayMarkersInCurrentView()
            .then(() => this.fetchDataForCurrentView())*/

        //this.createMap(options.mapContainerId);
        //this.datastore = new MemoryDatastore(this);
        //this.markerGroup = new MarkerGroup(this);
        //this.controls.zoomWarning = new ControlZoomWarning(this);
        //this.controls.displayMode = new ControDisplayMode(this);
        //this.controls.legend = new ControlLegend(this);
        //this.controls.filter = new ControlFilter(this);

        //this.initMap();
    }

    private getStartPos() : { lat: number, lng: number, zoom: number } | null {
        const startPosString = localStorage.getItem('startpos');
        if (!startPosString) {
            return null;
        }
        try {
            return JSON.parse(startPosString) as { lat: number, lng: number, zoom: number };
        } catch (error) {
            return null;
        }
    }

    private initialViewSet = false;
    private setInitialMapView() {

        const logger = this.logger.sub('setInitialMapView');

        if (this.initialViewSet) {
            logger.warn('Initial map view already set');
            return;
        }

        const geoFlag = localStorage.getItem('geolocate');
        const startPos = this.getStartPos();

        // If local storage contains last map position, set map to that
        if (startPos) {
            this.map.setView([ startPos.lat, startPos.lng ], startPos.zoom);
            this.initialViewSet = true;
        }

        // Set to Australia if no start position
        if (!startPos) {
            this.map.setView([ -26.1772288, 133.4170119 ], 10);
            this.initialViewSet = true;
        }

        // If local storage contains geolocate flag
        // or, if no start position, start geolocation
        if (geoFlag || !startPos) {
            this.mapLocate.start();
            this.map.setZoom(17);
            this.initialViewSet = true;
        }

        if (!this.initialViewSet) {
            logger.error('Could not set initial map view');
        }

    }

    getBoxesInBounds(bounds: L.LatLngBounds): L.LatLngBounds[] {
            
        // Starting point should be the north-west corner of the map rounded beyond the map bounds
        // Latitude is rounded to 2 decimal places multiple of 0.02
        // Longitude is rounded to 2 decimal places multiple of 0.04
        const northmost = Math.ceil(bounds.getNorth() * 50) / 50;
        const westmmost = Math.floor(bounds.getWest() * 25) / 25;

        // split map into boxes starting from north-west corner
        // each box should be 0.02 degrees latitude by 0.04 degrees longitude
        const boxes = [];
        for (let latitude = northmost; latitude > bounds.getSouth(); latitude -= 0.02) {
            for (let longitude = westmmost; longitude < bounds.getEast(); longitude += 0.04) {
                boxes.push([latitude, longitude]);
            }
        }

        // Map each box into a bounds object
        const boxBounds = boxes.map(box => {
            const north = box[0];
            const west = box[1];
            const south = north - 0.02;
            const east = west + 0.04;
            return L.latLngBounds([south, west], [north, east]);
        });

        return boxBounds;

    }

    /**
     * Fetch boxes that are visible on the map
     */
    getCurrentViewBoxes(): L.LatLngBounds[]
    {
        return this.getBoxesInBounds(this.map.getBounds());
    }

    /**
     * Hide markers that are outside the map bounds
     */
    hideMarkersOutsideCurrentView() {
        const mapBounds = this.map.getBounds().pad(0.5);
        this.markerLayer.removeMarkersOutsideBounds(mapBounds);
    }

    /**
     * Display markers that are inside the map bounds
     */
    async displayMarkersInCurrentView(attempt: number = 1) {

        if (this.datastore.isReady() === false) {
            
            if (attempt > 10) {
                console.error('Could not get datastore ready. Giving up.');
                return;
            }

            console.warn('Datastore is not ready. Delaying displayMarkersInCurrentView()');
            setTimeout(() => this.displayMarkersInCurrentView(attempt+1), 1000);
            return;
        }

        console.log('Displaying markers in current view');
        const mapBounds = roundBounds(this.map.getBounds());
        
        console.log('Fetching from Datastore', mapBounds);
        this.refreshPointsFromStore(mapBounds);
        
    }

    /**
     * Fetch data for current map view
     */
    async fetchDataForCurrentView() {

        const logger = this.logger.sub('fetchDataForCurrentView');

        this.hideMarkersOutsideCurrentView();
        this.displayMarkersInCurrentView();

        if (this.map.getZoom() < 11) {
            logger.warn('Zoom level too low. Skipping.');
            return;
        }

        // Get boxes that are currently visible
        const boxes = this.getCurrentViewBoxes();

        logger.debug('Current view boxes', boxes);

        // Don't fetch boxes if more than 80
        if (boxes.length > MAX_BOXES_IN_VIEW) {
            logger.warn('Too many boxes to fetch. Skipping.');
            return;
        }

        logger.debug('Fetching boxes', boxes.length);
        
        // Chunk boxes into groups of 10
        const boxChunks = chunkArray(boxes, 10);

        logger.debug('Box chunks', boxChunks.length, boxChunks);

        for (let i = 0; i < boxChunks.length; i++) {
            const fetchPromises = boxChunks[i].map(box => this.fetchData(box));
            logger.debug('Fetch promises', fetchPromises.length, fetchPromises);
            await Promise.all(fetchPromises);
            this.refreshPointsFromStore(this.map.getBounds().pad(0.5));
        }

        logger.debug('All boxes fetched');

    }

    async fetchData(
        bounds: L.LatLngBounds, page: number = 1
    ) : Promise<void>
    {

        if (isDebugMode()) {
            console.log('Fetching Box', bounds.getCenter().toString(), page);
        }

        try {
            
            const data = await this.api.fetchPage(bounds, page, () => this.map.getBounds().intersects(bounds));
            
            await this.processFetchResult(data, bounds);

            if (data.next) {
                return await this.fetchData(bounds, data.next);
            }

            return;

        } catch (error: any) {
            if (error.message == 'Page already loaded this session.') {
                return;
            }
            console.error(error)
        }

    }

    async processFetchResult(result: NbnPlaceApiResponse, bounds: L.LatLngBounds) {

        //console.log('Processing page', (result.next || 2)-1, 'of', result.total, 'with', result.places.length, 'places.');

        // If more pages, start fetching next page
        /*if (result.next) {
            this.fetchData(bounds, result.next);
        }*/

        // Process places
        console.log('Storing places.')
        const processPromise = this.datastore.storePlaces(result.places);
        console.log('Waiting for place storing to finish');
        await processPromise;

        // Refresh points inside bounds
        //console.log('Refreshing points inside bounds.');
        //await this.refreshPointsFromStore(bounds);

    }

    async refreshPointsFromStore(bounds?: L.LatLngBounds) {

        if (!this.markerLayer) {
            throw new Error('Marker Layer not set');
        }

        // If bounds are not passed, use map bounds
        if (!bounds) {
            console.log('Bounds not passed. Using map bounds.');
            bounds = this.map.getBounds();
        }

        bounds = roundBounds(bounds);
        this.markerLayer.refreshMarkersInsideBounds(bounds, this.markerFilter);

        /*
        // Get the boxes
        console.log('Refreshing points within bounds', bounds.toBBoxString());
        const points = await this.datastore.getPointsWithinBounds(bounds);
            
        // add points to map that don't already exist in layer
        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            const marker = L.circleMarker([point.latitude, point.longitude], {
                radius: 5,
                //fillColor: this.getPlaceColour(place),
                //color: "#000000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
            });

            // Add popup
            marker.bindPopup(point.locids.join('<br />'));
            marker.on('popupopen', (event) => {
                this.renderPopupContent(point)
                    .then(content => event.popup.setContent(content));
            })

            this.markerLayer.addLayer(marker);

        }
        */

    }

    private controls: {
        [key: string]: IControl;
    } = {};

    addControl(key: string, control: IControl) {
        if (this.controls[key]) {
            throw new Error(`Control with key ${key} already exists`);
        }

        this.controls[key] = control;

        this.map.addControl(control.getControl())

        console.log('Added control', key);
    }

    setMarkerFilter(filter: (place: NbnPlace) => boolean) {

        if (!this.markerLayer) {
            throw new Error('Marker Layer not set');
        }

        this.markerFilter = filter;
        this.markerLayer.refreshMarkersInsideBounds(this.map.getBounds(), this.markerFilter);
    }

    /*private setMarkerLayer(markerLayer: IMarkerLayer) {

        if (this.markerLayer) {
            this.markerLayer.removeAllMarkers();
        }

        this.markerLayer = markerLayer;
        this.markerLayer.setMap(this.map);
        this.markerLayer.setDatastore(this.datastore);

        this.markerLayer.refreshMarkersInsideBounds(
            this.map.getBounds(), this.markerFilter
        );
    }*/

    setModeHandler(modeHandler: IMode) {
        this.modeHandler = modeHandler;
        this.markerLayer?.setModeHandler(modeHandler);
    }

}