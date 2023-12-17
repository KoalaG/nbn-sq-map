import * as L from 'leaflet';

import { NbnPlaceApiResponse, NbnTechMapOptions } from '../types';
//import MarkerGroup from './marker_group.class.ts.dev';
//import ControlZoomWarning from './control_zoom_warning.class';
//import ControlFilter from './control_filter.class';

//import 'leaflet-google-places-autocomplete';
//import * as MarkerCluster from 'leaflet.markercluster';

//import * as LocateControl from 'leaflet.locatecontrol';
//import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import IApi from '../interfaces/api.interface';
import IDatastore from '../interfaces/datastore.interface';

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

    // Stores map data
    private datastore: IDatastore;

    // Stores marker group and functions
    //markerGroup: MarkerGroup = null;

    // Stores map controls
    controls: {[key: string]: any} = {
        zoomWarning: null,
        legend: null,
        displayMode: null,
        filter: null,
    }

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

        // Set default view (Centred over Australia)
        // Get the last map position from local storage
        // If no position is found, default to Australia
        const startPos = JSON.parse(localStorage.getItem('startpos'));
        if (startPos) {
            this.map.setView([ startPos.lat, startPos.lng ], startPos.zoom);
        }
        else {
            this.map.setView([ -26.1772288, 133.4170119 ], 4);
        }
        
        // store map position when moved or zoomed
        this.map.on('moveend zoomend', () => {
            const center = this.map.getCenter();
            const zoom = this.map.getZoom();
            localStorage.setItem('startpos', JSON.stringify({ lat: center.lat, lng: center.lng, zoom }));
        });


        this.fetchDataForCurrentView();

        //this.createMap(options.mapContainerId);
        //this.datastore = new MemoryDatastore(this);
        //this.markerGroup = new MarkerGroup(this);
        //this.controls.zoomWarning = new ControlZoomWarning(this);
        //this.controls.displayMode = new ControDisplayMode(this);
        //this.controls.legend = new ControlLegend(this);
        //this.controls.filter = new ControlFilter(this);

        //this.initMap();
    }

    /**
     * Initialise Map
     */
    initMap() {

        // Add event handlers
        /*
        this.map.on('locationerror', function(e) {
            console.error('Error getting location', e);
        });
        this.map.on('zoomend', (e) => this.mapChanged(e));
        this.map.on('moveend', (e) => this.mapChanged(e));

        const locateOnOpen = localStorage.getItem('locate') == 'true';
        const startPos = JSON.parse(localStorage.getItem('startpos'));
        */

        /** Setup geocoder */
        /*
        this.mapSearch = new L.Control.GPlaceAutocomplete({
            position: 'topleft',
            prepend: true,
            collapsed_mode: true,
            callback: (place) => {
                var loc = place.geometry.location;
                this.map.setView( [loc.lat(), loc.lng()], 18);
            }
        }).addTo(this.map);
        */

        // locate the user
        /*
        this.mapLocate = L.control.locate({
            position: 'topleft',
            setView: '0untilPan',
            initialZoomLevel: startPos.zoom || 16,
        }).addTo(this.map);

        this.map.on('locateactivate', () => localStorage.setItem('locate', 'true'));
        this.map.on('locatedeactivate', () => localStorage.setItem('locate', 'false'));

        if (locateOnOpen || !startPos) {
            this.mapLocate.start();
        }
        else if( startPos ) {
            this.map.setView([ startPos.lat, startPos.lng ], startPos.zoom);
        }
        else {
            this.map.setView([ -33.865143, 151.209900 ], 13);
        }
        */

    }

    fetchDataForCurrentView() {

        const bounds = this.map.getBounds();
        console.log('Map Bounds:', bounds.toBBoxString());

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

        // Fetch each box
        boxBounds.forEach((box, index) => {
            this.fetchData(box, index+1);
        });
        
    }

    fetchData(bounds: L.LatLngBounds, page: number = 1) {

        console.log('Fetching page', page, 'of centrepoint', bounds.getCenter().toString());

        this.api
            .fetchPage(bounds, page)
            .then(data => this.processFetchResult(data, bounds))
            .catch(error => console.error(error))
        ;
    }

    async processFetchResult(result: NbnPlaceApiResponse, bounds: L.LatLngBounds) {

        console.log('Processing page', (result.next || 2)-1, 'of', result.total, 'with', result.places.length, 'places.');

        // If more pages, start fetching next page
        //if (result.next) {
        //    console.log("Next page: ", result.next, 'of', result.total);
        //    this.fetchData(bounds, result.next);
        //}

        // Process places
        const processPromises = result.places.map(place => {
            return this.datastore.storePlace(place);
        });

        await Promise.all(processPromises);

        this.refreshPointsFromStore();
        //this.controls.filter.refresh();

    }

    async refreshPointsFromStore() {

        const points = await this.datastore.getPointsWithinBounds(this.map.getBounds());
        console.log('Refreshing points from store. Found', points.length, 'points.');

        console.log(points);

        //this.markerGroup.clearLayers();

        //points.forEach(point => this.markerGroup.addPoint(point));

        //this.markerGroup.refresh();

    }

}