import * as L from 'leaflet';

import { NbnPlace, PointAndLocids, NbnPlaceApiResponse, NbnTechMapOptions } from './types';
//import MarkerGroup from './marker_group.class.ts.dev';
//import ControlZoomWarning from './control_zoom_warning.class';
//import ControlFilter from './control_filter.class';

//import 'leaflet-google-places-autocomplete';
//import * as MarkerCluster from 'leaflet.markercluster';

//import * as LocateControl from 'leaflet.locatecontrol';
//import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import IApi from './interfaces/api.interface';
import IDatastore from './interfaces/datastore.interface';
import IMarkerLayer from './interfaces/markerlayer.interface';
import MarkerLayerCluster from './classes/markerlayer.cluster.class';
import IControl from './interfaces/control.interface';
import { isDebugMode } from './utils';

export function roundBounds(bounds: L.LatLngBounds): L.LatLngBounds {
    const north = Math.ceil(bounds.getNorth() * 50) / 50;
    const west = Math.floor(bounds.getWest() * 25) / 25;
    const south = Math.floor(bounds.getSouth() * 50) / 50;
    const east = Math.ceil(bounds.getEast() * 25) / 25;
    return L.latLngBounds([south, west], [north, east]);
}

export default class NbnTechMap {

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


    private mapLocate: any;
    private mapSearch: any;

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

        // Create the map
        this.map = L.map(options.mapContainerId, { preferCanvas: true });

        // Set up the OSM layer
        this.mapTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            crossOrigin: true,
            maxZoom: 20
        });

        // Add the layer to the map
        this.mapTileLayer.addTo(this.map);

        // Create and add marker layer
        this.markerLayer = new MarkerLayerCluster();
        this.markerLayer.setMap(this.map);
        this.markerLayer.setDatastore(this.datastore);

        // Set default view (Centred over Australia)
        // Get the last map position from local storage
        // If no position is found, default to Australia
        const startPos = JSON.parse(localStorage.getItem('startpos') || '');
        if (startPos) {
            this.map.setView([ startPos.lat, startPos.lng ], startPos.zoom);
        }
        else {
            this.map.setView([ -26.1772288, 133.4170119 ], 4);
        }
        
        // store map position when moved or zoomed
        this.map.on('moveend', async () => {
            const center = this.map.getCenter();
            const zoom = this.map.getZoom();
            localStorage.setItem('startpos', JSON.stringify({ lat: center.lat, lng: center.lng, zoom }));

            //await this.displayMarkersInCurrentView();
            this.fetchDataForCurrentView();
        });

        this.fetchDataForCurrentView();
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
        // Hide markers that are outside the map bounds
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

        this.hideMarkersOutsideCurrentView();
        this.displayMarkersInCurrentView();

        // Get boxes that are currently visible
        const boxes = this.getCurrentViewBoxes();

        if (isDebugMode()) {
            console.log('Current view boxes', boxes);
        }

        // Don't fetch boxes if more than 80
        if (boxes.length > 80) {
            console.warn('Too many boxes to fetch. Skipping.');
            return;
        }
        
        if (isDebugMode()) {
            console.log('Fetching boxes');
        }
        
        const fetchPromises = boxes.map(box => this.fetchData(box));

        if (isDebugMode()) {
            console.log('Waiting for boxes to be fetched');
        }

        await Promise.all(fetchPromises);

        if (isDebugMode()) {
            console.log('All boxes fetched');
        }

        await this.refreshPointsFromStore(this.map.getBounds().pad(0.5));
        
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
        this.markerFilter = filter;
        this.markerLayer.refreshMarkersInsideBounds(this.map.getBounds(), this.markerFilter);
    }

}