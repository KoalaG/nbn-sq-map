(function() {

    const DEFAULT_OPTIONS = {
        mapContainerId: 'map',
    }

    const MIN_ZOOM_FOR_DATA_FETCH = 13;

    
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
    
    const COL_TECH_AVAIL            = '#1D7044';
    const COL_TECH_BUILDFINALISED   = '#75AD6F';
    const COL_TECH_DESIGN           = '#C8E3C5';
    const COL_TECH_COMMITTED        = '#FF7E01';

    const colourUnknown     = '#888888';

    class ControlZoomWarning {

        nbnTechMap = null;
        control = null;
        controlDiv = null;
        
        constructor (nbnTechMap) {
            this.nbnTechMap = nbnTechMap;
            this.control = L.control({ position: 'topright' });
            this.control.onAdd = this.addControlDiv;
        }

        addControlDiv(map) {

            if (!this.controlDiv) {
                this.controlDiv = L.DomUtil.create('div', 'info legend');
            }

            this.controlDiv.style.backgroundColor = "#ff0000";
            this.controlDiv.style.opacity = "0.8";
            this.controlDiv.style.padding = "5px";
            this.controlDiv.style.borderRadius = "5px";
            
            var legendHTML = '<b style="color:white">Zoom in to see details. Current Zoom: ' + map?.getZoom() || undefined + '</b>';
            this.controlDiv.innerHTML = legendHTML;

            return this.controlDiv;
        }

        show() {
            this.control.addTo(this.nbnTechMap.map);
        }

        remove() {
            this.control.remove();
        }

    }

    class ControDisplayMode {

        displayMode = 'all';

        nbnTechMap = null;
        control = null;
        controlDiv = null;

        allLabel = null;
        allRadio = null;
        allText = null;
        upgradeLabel = null;
        upgradeRadio = null;
        upgradeText = null;
        eeLabel = null;
        eeRadio = null;
        eeText = null;
        
        constructor (nbnTechMap) {
            this.nbnTechMap = nbnTechMap;
            this.control = L.control({ position: 'topright' });
            this.control.onAdd = () => this.addControlDiv();
            this.show();
        }
        

        changeMode(mode) {
            this.displayMode = mode;
            this.nbnTechMap.refreshMarkersFromStore();
            this.nbnTechMap.controls.legend.refresh();
        }

        show() {
            this.control.addTo(this.nbnTechMap.map);
        }

        remove() {
            this.control.remove();
        }

        addControlDiv() {

            if (!this.controlDiv) {
                this.controlDiv = L.DomUtil.create('div', 'info legend');
            }

            this.controlDiv.style.backgroundColor = "#ffffff";
            this.controlDiv.style.opacity = "0.8";
            this.controlDiv.style.padding = "5px";
            this.controlDiv.style.borderRadius = "5px";
            
            this.allLabel = L.DomUtil.create('label', 'control-label', this.controlDiv);
            this.allRadio = L.DomUtil.create('input', 'control-input', this.allLabel);
            this.allRadio.type = 'radio';
            this.allRadio.checked = true;
            this.allRadio.name = 'display-mode';
            this.allRadio.value = 'all';
            L.DomEvent.on(this.allRadio, 'change', (e) => this.changeMode('all'));
            this.allText = L.DomUtil.create('span', 'control-text', this.allLabel);
            this.allText.innerText = 'All';

            this.upgradeLabel = L.DomUtil.create('label', 'control-label', this.controlDiv);
            this.upgradeRadio = L.DomUtil.create('input', 'control-input', this.upgradeLabel);
            this.upgradeRadio.type = 'radio';
            this.upgradeRadio.name = 'display-mode';
            this.upgradeRadio.value = 'upgrade';
            L.DomEvent.on(this.upgradeRadio, 'change', () => this.changeMode('upgrade'));
            this.upgradeText = L.DomUtil.create('span', 'control-text', this.upgradeLabel);
            this.upgradeText.innerText = 'Tech Upgrade';

            this.eeLabel = L.DomUtil.create('label', 'control-label', this.controlDiv);
            this.eeRadio = L.DomUtil.create('input', 'control-input', this.eeLabel);
            this.eeRadio.type = 'radio';
            this.eeRadio.name = 'display-mode';
            this.eeRadio.value = 'ee';
            L.DomEvent.on(this.eeRadio, 'change', () => this.changeMode('ee'));
            this.eeText = L.DomUtil.create('span', 'control-text', this.eeLabel);
            this.eeText.innerText = 'EE';

            return this.controlDiv;

        }

    }

    class ControlLegend {

        nbnTechMap = null;
        control = null;
        controlDiv = null;
        
        constructor (nbnTechMap) {
            this.nbnTechMap = nbnTechMap;
            this.control = L.control({ position: 'bottomright' });
            this.control.onAdd = (map) => this.addControlDiv(map);
            this.show();
        }


        getLegendHTML() {
            if (this.nbnTechMap.controls.displayMode?.displayMode == 'ee') {
                return '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_CBD_ZBC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone CBD ($0 Build)<br>' + 
                    '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_CBD_BC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone CBD (Build POA)<br>' +
                    '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_Z123_ZBC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone 1/2/3 ($0 Build)<br>' +
                    '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_Z123_BC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone 1/2/3 (Build POA)<br>';

            }

            return '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTP+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTP<br>' + 
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTPAvail+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTP Upgrade<br>' +
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTPSoon+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTP Upgrade Soon<br>' +
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourHFC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> HFC<br>' + 
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTC<br>' +
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTNB+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTN/FTTB<br>' +
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFW+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FW<br>' +
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFWAvail+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FW Upgrade<br>' +
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourSat+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Satellite<br>' +
                '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourUnknown+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Unknown';
        }

        addControlDiv(map) {

            if (!this.controlDiv) {
                this.controlDiv = L.DomUtil.create('div', 'info legend');
            }

            this.controlDiv.style.backgroundColor = "#ffffff";
            this.controlDiv.style.opacity = "0.8";
            this.controlDiv.style.padding = "5px";
            this.controlDiv.style.borderRadius = "5px";
            this.controlDiv.style.width = "150px";

            this.controlDiv.innerHTML = this.getLegendHTML();

            return this.controlDiv;
        }

        refresh() {
            this.controlDiv.innerHTML = this.getLegendHTML();
        }

        show() {
            this.control.addTo(this.nbnTechMap.map);
        }

        remove() {
            this.control.remove();
        }

    }

    class MarkerGroup {

        nbnTechMap = null;
        
        markerGroup = null;
        
        constructor (nbnTechMap) {
            this.nbnTechMap = nbnTechMap;
            
            this.markerGroup = L.markerClusterGroup({
                showCoverageOnHover: false,
                zoomToBoundOnClick: false,
                singleMarkerMode: true,
                maxClusterRadius: 0,
                /*maxClusterRadius: (zoom) => {
                    if (zoom >= 15) return 0;
                    return 20;
                },*/
                removeOutsideVisibleBounds: true,
                iconCreateFunction: this.clusterIconCreate,
            });

        }

        show() {
            this.nbnTechMap.map.addLayer(this.markerGroup);
        }

        remove() {
            this.nbnTechMap.map.removeLayer(this.markerGroup);
        }

        clusterIconCreate(cluster) {
            return L.divIcon({
                html: '<div style="background-color: rgba(255,255,255,50)">' + cluster.getChildCount() + '</div>',
                className: 'marker-cluster'
            });
        }

    }

    class MemoryDatastore {
            
        nbnTechMap = null;

        placeMarkerStore = {};

        constructor(nbnTechMap) {
            this.nbnTechMap = nbnTechMap;
        }

        storePlaceMarker(placeMarker) {
            if (!this.placeMarkerStore[placeMarker.options.place.locid]) {
                this.placeMarkerStore[placeMarker.options.place.locid] = placeMarker;
            }
            this.placeMarkerStore[placeMarker.options.place.locid].options = placeMarker.options;
        }

        getPlaceMarker(locid) {
            return this.placeMarkerStore[locid];
        }

        getPlaceMarkers() {
            return Object.keys(this.placeMarkerStore).map(locid => this.placeMarkerStore[locid]);
        }

        getPlaceMarkersWithinBounds() {
            return this.getPlaceMarkers()
                .filter(marker => this.isLatLngWithinBounds(marker.options.place.latitude, marker.options.place.longitude))
            ;
        }

        getPlaceMarkersOutOfBounds() {
            return this.getPlaceMarkers()
                .filter(marker => !this.isLatLngWithinBounds(marker.options.place.latitude, marker.options.place.longitude))
            ;
        }

        isLatLngWithinBounds(lat, lng) {
            const mapBounds = this.nbnTechMap.map.getBounds();
            return lat > mapBounds.getSouth()
                && lat < mapBounds.getNorth()
                && lng > mapBounds.getWest()
                && lng < mapBounds.getEast()
            ;
        }

    }

    class LipApi {

        nbnTechMap = null;

        doingFetch = false;
        
        constructor(nbnTechMap) {
            this.nbnTechMap = nbnTechMap;
        }

        hasMapChanges(north, east, south, west) {
            return north != this.nbnTechMap.map.getBounds().getNorth()
            || east != this.nbnTechMap.map.getBounds().getEast()
            || south != this.nbnTechMap.map.getBounds().getSouth()
            || west != this.nbnTechMap.map.getBounds().getWest();
        }

        async fetchPage(north, east, south, west, page = 1) {

            north = Number(north);
            east = Number(east);
            south = Number(south);
            west = Number(west);

            // Prevent running when map has changed
            if (this.hasMapChanges(north, east, south, west)) {
                throw new Error('Map co-ordinates changed. Stopping fetch.');
                return;
            }

            if (this.doingFetch) {
                throw new Error('Already fetching data. Stopping fetch.');
                return;
            }

            this.doingFetch = true;

            page = Math.max(1, Number(page));
            
            return await new Promise((resolve, reject) => {

                fetch(`https://api.lip.net.au/nbn-bulk/map/${north}/${east}/${south}/${west}?page=${page}`, {
                    method: 'GET',
                    redirect: 'follow',
                })
                .then(response => response.text())
                .then(result => {
                    result = JSON.parse(result);
                    resolve(result.data);
                    this.doingFetch = false;
                })
                .catch(reject);

            });
            
        }
    }

    class NbnTechMap {

        map = null;
        mapTileLayer = null;

        // Stores API functions
        lipApi = null;

        // Stores map data
        datastore = null;

        // Stores marker group and functions
        markerGroup = null;

        // Stores map controls
        controls = {
            zoomWarning: null,
            legend: null,
            displayMode: null,
        }

        /**
         * 
         * @param {*} options 
         */
        constructor(options = {}) {
            Object.assign(DEFAULT_OPTIONS, options);


            this.createMap(options.mapContainerId);

            this.lipApi = new LipApi(this);
            this.datastore = new MemoryDatastore(this);
            this.markerGroup = new MarkerGroup(this);
            this.controls.zoomWarning = new ControlZoomWarning(this);
            this.controls.legend = new ControlLegend(this);
            this.controls.displayMode = new ControDisplayMode(this);

            this.initMap();
        }

        /**
         * Create Map
         */
        createMap(mapContainerId) {

            // Create the map
            this.map = L.map(mapContainerId, { preferCanvas: true });

            // Set up the OSM layer
            this.mapTileLayer = L.tileLayer(
                'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                });
                
            this.mapTileLayer.addTo(this.map);

        }

        /**
         * Initialise Map
         */
        initMap() {

            // Add event handlers
            this.map.on('locationerror', function(e) {
                console.error('Error getting location', e);
            });
            this.map.on('zoomend', (e) => this.mapChanged(e));
            this.map.on('moveend', (e) => this.mapChanged(e));

            // locate the user
            this.map.locate({ setView: true, maxZoom: 16 })

        }

        renderPopupContent(layer) {
            const place = layer.options.place;
    
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
            
            if (place.ee) {
                popup += '<b>Enterprise Ethernet</b></br>';
                popup += 'Price Zone: ' + ( place.cbdpricing ? 'CBD' : 'Zone 1/2/3' ) + '<br />'
                popup += 'Build Cost: ' + ( place.zeroBuildCost ? '$0' : 'POA' ) + '<br />'
                popup += '<br />';
            }
    
            return popup;
    
        }
    
        renderPoint(place) {
            return L.circleMarker([ place.latitude, place.longitude ], {
                radius: 5,
                fillColor: this.getPlaceColour(place),
                color: "#000000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
                place,
            })
            .bindPopup((layer) => this.renderPopupContent(layer));
        }

        processFetchResult(result, north, east, south, west) {

            // If more pages, start fetching next page
            if (result.next) {
                console.log("Next page: ", result.next, 'of', result.total);
                this.fetchData(north, east, south, west, result.next);
            }

            // Process places
            result.places.forEach(place => {
                this.datastore.storePlaceMarker(this.renderPoint(place));
            });

            this.refreshMarkersFromStore();

        }

        refreshMarkersFromStore() {

            const placeMarkersOutOfBounds = this.datastore.getPlaceMarkersOutOfBounds();
            this.markerGroup.markerGroup.removeLayers(placeMarkersOutOfBounds);

                
            const placeMarkersWithinBounds = this.datastore.getPlaceMarkersWithinBounds();
            
            if (this.controls.displayMode.displayMode == 'all') {
                this.markerGroup.markerGroup.addLayers(placeMarkersWithinBounds);
            }

            if (this.controls.displayMode.displayMode == 'upgrade') {
                this.markerGroup.markerGroup.removeLayers(
                    placeMarkersWithinBounds.filter(placeMarker => !isPlaceFTTPSoon(placeMarker.options.place))
                );
                this.markerGroup.markerGroup.addLayers(
                    placeMarkersWithinBounds.filter(placeMarker => isPlaceFTTPSoon(placeMarker.options.place))
                );
            }

            if (this.controls.displayMode.displayMode == 'ee') {
                this.markerGroup.markerGroup.removeLayers(
                    placeMarkersWithinBounds.filter(placeMarker => !placeMarker.options.place.ee)
                );
                this.markerGroup.markerGroup.addLayers(
                    placeMarkersWithinBounds.filter(placeMarker => placeMarker.options.place.ee)
                );
            }

            this.markerGroup.markerGroup.getLayers().forEach(marker => {
                marker.setStyle({
                    fillColor: this.getPlaceColour(marker.options.place),
                });
            });

        }

        fetchData(north, east, south, west, page = 1) {
            this.lipApi
                .fetchPage(north, east, south, west, page)
                .then(data => this.processFetchResult(data, north, east, south, west))
                .catch(error => console.error(error))
        }

        mapChanged(event) {

            if(this.map.getZoom() < MIN_ZOOM_FOR_DATA_FETCH) {
                this.markerGroup.remove();
                this.controls.zoomWarning.show();
                return;
            }

            this.markerGroup.show();
            this.controls.zoomWarning.remove();

            this.refreshMarkersFromStore();
                            
            const north = this.map.getBounds().getNorth();
            const east = this.map.getBounds().getEast();
            const south = this.map.getBounds().getSouth();
            const west = this.map.getBounds().getWest();
            
            console.log('Map changed', north, east, south, west);
            this.fetchData(north, east, south, west);
        
        }

        
        getPlaceColour(place) {

            /** CBD Pricing */
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

    const nbnTechMap = new NbnTechMap({
        mapContainerId: 'map',
    });



    function isPlaceFTTP(place) {
        return place.techType == 'FTTP';
    }

    function isPlaceFTTPAvail(place) {
        if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
            switch(place.techChangeStatus) {
                case 'Eligible To Order':
                    return true;
            }
        }
        return false;
    }

    function isPlaceFTTPSoon(place) {
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

    function isPlaceFTTPFar(place) {
        if (place.altReasonCode && place.altReasonCode.match(/^FTTP/)) {
            switch(place.techChangeStatus) {
                case 'Committed':
                    return true;
            }
        }
    }

    function isPlaceFTTC(place) {
        if(place.techType == "FTTC"
            && place.reasonCode && place.reasonCode.match(/^FTTC/)
            && place.techChangeStatus == 'New Tech Connected'
        ) {
            return true;
        }
        return false;
    }

    function isFWtoFTTC(place) {
        return place.techType == "FTTC"
            && place.reasonCode && place.reasonCode.match(/^FTTC/)
            && place.techChangeStatus == 'Eligible To Order'
        ;
    }

    function isFwtoFTTN(place) {
        return place.techType == "FTTN"
            && place.reasonCode == "FTTN_SA"
            && place.altReasonCode == "FW_CT"
            && place.techChangeStatus == 'Eligible To Order'
        ;
    }

    function isSatToFW(place) {
        return place.techType == "WIRELESS"
            && place.reasonCode == "FW_SA"
            && place.techChangeStatus == 'Eligible To Order'
        ;
    }

    function getTechColour(techType) {
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


})();