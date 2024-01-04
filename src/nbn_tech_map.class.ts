
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'leaflet.locatecontrol';

import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import { Geocoder, geocoder, geocoders } from 'leaflet-control-geocoder';

import { NbnPlace, NbnPlaceApiResponse, NbnTechMapOptions, PointAndLocids } from './types';
//import MarkerGroup from './marker_group.class.ts.dev';
//import ControlZoomWarning from './control_zoom_warning.class';
//import ControlFilter from './control_filter.class';

import IApi from './interfaces/api.interface';
import IMarkerLayer from './interfaces/markerlayer.interface';
import MarkerLayerCluster from './markerlayer/markerlayer.cluster.class';
import IControl from './interfaces/control.interface';
import { isDebugMode } from './utils';
import IMode from './interfaces/mode.interface';

import { Logger } from "./utils";
import IPlaceStore from './interfaces/placestore.interface';
import ControlLegend from './controls/control_legend.class';

export function roundBounds(bounds: L.LatLngBounds): L.LatLngBounds {
    const north = Math.ceil(bounds.getNorth() * 50) / 50;
    const west = Math.floor(bounds.getWest() * 25) / 25;
    const south = Math.floor(bounds.getSouth() * 50) / 50;
    const east = Math.ceil(bounds.getEast() * 25) / 25;
    return L.latLngBounds([south, west], [north, east]);
}


export default class NbnTechMap {

    private MAX_UNFETCHED_BOXES = 100;

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
    private mapSearch: Geocoder;

    /**
     * @Property {placeStore} - Place store nbn places.
     */
    private placeStore: IPlaceStore;

    /**
     * @Property {markerLayer} - Layer to hold markers
     */
    private markerLayer: IMarkerLayer;

    private modeHandler: IMode;

    private legendControl?: L.Control.Legend;

    public getMap() {
        return this.map;
    }

    /**
     * 
     * @param {*} options 
     */
    constructor(options: NbnTechMapOptions) {

        options = { ...NbnTechMap.DEFAULT_OPTIONS, ...options };

        this.api = options.api;
        this.placeStore = options.placestore;
        this.modeHandler = options.defaultModeHandler;

        // Create the map
        this.map = L.map(options.mapContainerId, { preferCanvas: true });

        // Set up the marker layer
        this.markerLayer = new MarkerLayerCluster(
            this.map, this.modeHandler, this.placeStore
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

        console.log({ L, Geocoder, geocoder });

        // Add geocoder control
        const mapGeocoder = new geocoders.ArcGis({
            apiKey: 'AAPKa97b8a5374db4fa9b0fdd8e55361cba4Z9fEuw3ckAOIFHK1CP_VbzTv3OTeUz3ggrFAzVPzjyn3Q7bQFzbwkDMvDxaJ-JzG',
            geocodingQueryParams: {
                countryCode: 'AU',
                category: 'Address,LatLong,Neighborhood,District,City,Metro Area',
            }
        });
        this.mapSearch = (L.Control as unknown as { geocoder: typeof geocoder }).geocoder({
            position: 'topleft',
            collapsed: true,
            defaultMarkGeocode: false,
            geocoder: mapGeocoder,
            suggestMinLength: 5,
            suggestTimeout: 1000,
        });

        this.mapSearch.on('markgeocode', (event: any) => {
            const bbox = event.geocode.bbox;
            this.map.fitBounds(bbox, {
                'maxZoom': 16,
            });
        });

        this.mapSearch.addTo(this.map);


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
            this.pushBrowserHistory();

            if (mapGeocoder.options.geocodingQueryParams) {
                mapGeocoder.options.geocodingQueryParams.location = `${center.lng},${center.lat}`;
            }

            //await this.displayMarkersInCurrentView();
            this.fetchDataForCurrentView();
        });

        this.fetchDataForCurrentView();

        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const lat = urlParams.get('lat');
            const lng = urlParams.get('lng');
            const zoom = urlParams.get('zoom');
            if (lat && lng && zoom) {
                this.map.setView([ Number(lat), Number(lng) ], parseInt(zoom));
                this.initialViewSet = true;
            }
        });
        
    }

    private pushBrowserHistory() {

        // Update existing URL with lat,lng,zoom
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();

        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('lat', center.lat.toString());
        urlParams.set('lng', center.lng.toString());
        urlParams.set('zoom', zoom.toString());
        const newUrl = window.location.pathname + '?' + urlParams.toString();

        window.history.pushState({}, '', newUrl);
        
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

        // If lat,lng,zoom are in URL, set map to that
        const urlParams = new URLSearchParams(window.location.search);
        const lat = urlParams.get('lat');
        const lng = urlParams.get('lng');
        const zoom = urlParams.get('zoom');
        if (lat && lng && zoom) {
            this.map.setView([ Number(lat), Number(lng) ], parseInt(zoom));
            this.initialViewSet = true;
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
    async DEP_displayMarkersInCurrentView(attempt: number = 1) {

        /*
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
        // this.refreshPointsFromStore(mapBounds);
        */
    }

    private zoomInWarningControl?: L.Control;

    showZoomInWarning() {
        if(!this.zoomInWarningControl) {
            this.zoomInWarningControl = new L.Control({ position: 'topright' });
            this.zoomInWarningControl.onAdd = () => {
                const div = L.DomUtil.create('div', 'info legend');
                div.innerHTML = '<h4 style="margin:0">Area Too Big!</h4>';
                div.innerHTML += '<p style="margin:0">Location loading is paused until you zoom in.</p>';
                div.style.backgroundColor = '#ff9800';
                div.style.opacity = '0.8';
                div.style.padding = '10px 20px';
                div.style.color = '#ffffff';
                return div;
            }
        }
        const zoomInWarningControl = this.zoomInWarningControl;
        setTimeout(() => this.map.addControl(zoomInWarningControl), 1000);
    }
    hideZoomInWarning() {
        if (this.zoomInWarningControl) {
            this.map.removeControl(this.zoomInWarningControl);
        }
    }

    private fetchedBoxes: Set<string> = new Set();

    /**
     * Fetch data for current map view
     */
    async fetchDataForCurrentView() {

        const logger = this.logger.sub('fetchDataForCurrentView');

        //this.hideMarkersOutsideCurrentView();
        //this.displayMarkersInCurrentView();

        if (this.map.getZoom() < 11) {
            logger.warn('Zoom level too low. Skipping.');
            this.showZoomInWarning();
            return;
        }

        // Get boxes that are currently visible
        const boxes = this.getCurrentViewBoxes();
        logger.debug('Current view boxes', boxes);

        // Filter out boxes that have already been fetched
        const unfetchedBoxes = boxes.filter(box => !this.fetchedBoxes.has(box.getCenter().toString()));

        // If no boxes to fetch, return
        if (unfetchedBoxes.length == 0) {
            this.hideZoomInWarning();
            return;
        }

        // Don't fetch boxes if more than 50
        if (unfetchedBoxes.length > this.MAX_UNFETCHED_BOXES) {
            logger.warn('Too many boxes to fetch. Skipping.');
            this.showZoomInWarning();
            return;
        }

        // Hide zoom in warning
        this.hideZoomInWarning();

        // Set update key
        const updateKey = this.map.getCenter().toString() + this.map.getZoom();

        // Create progress item
        const progressItem = this.createProgress(updateKey, unfetchedBoxes.length, 'Fetching sections...');
        this.renderProgress();

        let boxesProcessed = 0;

        // For each box, fetch data
        for (const box of unfetchedBoxes) {

            if (this.map.getCenter().toString() + this.map.getZoom() != updateKey) {
                logger.debug('Map moved. Fetch stopped.');
                progressItem.text = 'Map moved. Fetch stopped.';
                this.updateProgress(updateKey, boxesProcessed, true);
                return;
            }

            await this.fetchData(box);
            this.fetchedBoxes.add(box.getCenter().toString());
            boxesProcessed++;
            this.updateProgress(updateKey, boxesProcessed, false);

        }

        this.updateProgress(updateKey, boxesProcessed, true);
        logger.debug('All boxes fetched');

        this.updateLegend();

    }

    private progressControl = new L.Control({ position: 'bottomleft' });
    private progressItems: {
        [key: string]: {
            started: Date,
            finished?: Date,
            text: string,
            complete: boolean,
            progress: number,
            total: number,
        }
    } = {};

    private createProgress(key: string, total: number, text: string) {
        // Create new item
        this.progressItems[key] = {
            started: new Date(),
            finished: undefined,
            complete: false,
            progress: 0,
            total, text
        }
        return this.progressItems[key];
    }

    private updateProgress(key: string, progress: number, complete: boolean) {
        if (!this.progressItems[key]) {
            throw new Error(`Progress item with key ${key} does not exist`);
        }
        this.progressItems[key].finished = complete ? new Date() : undefined;
        this.progressItems[key].complete = complete;
        this.progressItems[key].progress = progress;
        this.renderProgress();
    }

    private renderProgress() {

        // Delete items finished more than 5 seconds ago
        const now = new Date();
        const keys = Object.keys(this.progressItems);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!this.progressItems[key]) continue;
            const finished = this.progressItems[key].finished;
            if (finished) {
                if ((now.getTime() - finished.getTime()) > 5000) {
                    delete this.progressItems[key];
                }
            }
        }

        // If no items, hide progress
        if (Object.keys(this.progressItems).length == 0) {
            this.hideProgress();
            return;
        }

        // Render progress
        this.progressControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = '<h4 style="margin:0">Loading...</h4>';
            const items = Object.values(this.progressItems);
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                // skip item if finished more than 10 seconds ago
                if (item.finished && (new Date().getTime() - item.finished.getTime() > 10000)) {
                    continue;
                }
                const progress = item.progress / item.total * 100;
                const progressText = item.complete ? 'Complete' : `${item.progress} of ${item.total}`;
                div.innerHTML += `<p style="margin:0">${item.text} (${progressText})</p>`;
                div.innerHTML += `<progress value="${progress}" max="100"></progress>`;
            }
            div.style.backgroundColor = '#000000';
            div.style.opacity = '0.8';
            div.style.padding = '10px 20px';
            div.style.color = '#ffffff';
            return div;
        }

        // Add progress to map
        this.map.addControl(this.progressControl);

        // Hide progress after 5 seconds if all complete
        setTimeout(() => {
            if (Object.values(this.progressItems).every(item => item.complete)) {
                this.hideProgress();
            }
        }, 5000);
    }

    private hideProgress() {
        this.map.removeControl(this.progressControl);
    }

    async fetchData(
        bounds: L.LatLngBounds, page: number = 1
    ) : Promise<void>
    {
        const logger = this.logger.sub('fetchData');

        logger.debug('Fetching Box', bounds.getCenter().toString(), page);

        try {
            
            const data = await this.api.fetchPage(bounds, page, false);
            
            this.processFetchResult(data, bounds);

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

    /**
     * Process Results Fetched from API
     * Stores places in place store
     * Sends points to marker layer
     * @param result 
     * @param bounds 
     */
    processFetchResult(result: NbnPlaceApiResponse, bounds: L.LatLngBounds) {

        const logger = this.logger.sub('processFetchResult');

        logger.debug('Processing Fetch Result', result, bounds);

        // Store places
        this.placeStore.storePlaces(result.places);

        // Create temp storage for points
        const points: Map<string, PointAndLocids> = new Map();

        // Add place locids to points
        for (let i = 0; i < result.places.length; i++) {

            const place = result.places[i];

            if (!this.modeHandler.filter(place)) {
                continue;
            }

            const latLng = `${place.latitude},${place.longitude}`;

            const placeColour = this.modeHandler.placeColour(place);

            // Create point if not already there
            const existingPoint = points.get(latLng);
            if (!existingPoint) {
                points.set(latLng, {
                    lat: place.latitude,
                    lng: place.longitude,
                    col: [ placeColour ],
                    add: [ place.address1 ],
                    ids: [ place.locid ],
                })
            }

            else {
                // Add locid to point if not already there
                if (!existingPoint.ids.includes(place.locid)) {
                    existingPoint.ids.push(place.locid);
                    existingPoint.add.push(place.address1);
                    existingPoint.col.push(placeColour);
                }
            }

        }

        // Send points to marker layer
        logger.debug('Adding points to marker layer', points);
        this.markerLayer.addPoints(points);

    }

    async DEPR_refreshPointsFromStore(bounds?: L.LatLngBounds) {

        if (!this.markerLayer) {
            throw new Error('Marker Layer not set');
        }

        // If bounds are not passed, use map bounds
        if (!bounds) {
            console.log('Bounds not passed. Using map bounds.');
            bounds = this.map.getBounds();
        }

        bounds = roundBounds(bounds);
        //this.markerLayer.refreshMarkersInsideBounds(bounds, this.markerFilter);

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

    setModeHandler(modeHandler: IMode) {
        this.modeHandler = modeHandler;

        this.markerLayer?.removeAllMarkers();
        console.log('Current Fetched Boxes', this.fetchedBoxes);
        this.fetchedBoxes.clear();
        console.log('Fetched Boxes Cleared', this.fetchedBoxes);
        this.markerLayer?.setModeHandler(modeHandler, this.placeStore);
        this.fetchDataForCurrentView();

    }

    updateLegend() {

        if (!this.controls.legend) {
            return;
        }

        const bounds = this.map.getBounds();
        const markers = this.markerLayer.getMarkersWithinBounds(bounds);

        const legendItems = this.modeHandler.getLegendItems();
        legendItems.forEach((item) => {
            item.layers = markers.filter(marker => (marker as L.CircleMarker).options.fillColor == item.colour)
        });

        (this.controls.legend as ControlLegend).updateLegend(legendItems, this.map);

    }


}