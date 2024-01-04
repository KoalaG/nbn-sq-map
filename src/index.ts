/**
 * @file Main entry point for map scripts.
 * @module index.ts
 * @version 1.0.0
 * @author KoalaG
 * @license MIT
 */

import LipApi from "./api/lip_api.class";
import NbnTechMap from "./nbn_tech_map.class";
import ControDisplayMode from "./controls/control_display_mode.class";
import { MemoryDatastore } from "./datastore/datastore.memory.class";
import AllMode from "./modes/mode.all";
import ControlLegend from "./controls/control_legend.class";

import './assets/Screenshot1.png';
import './assets/Screenshot2.png';
import './assets/Screenshot3.png';

import { Logger } from "./utils";
import { NbnPlace } from "./types";
import { IndexDBPlaceStore } from "./placestore/indexdb.placestore";
import TechUpgradeMode from "./modes/techupgrade.mode";
import EEMode from "./modes/ee.mode";
const logger = new Logger('index.ts');

const isDevelopment = (() => {
    try {
        return process.env.NODE_ENV === 'development' || process.argv.includes('development');
    } catch (e) {
        return false;
    }
})();
logger.debug('isDevelopment', isDevelopment);

if ('serviceWorker' in navigator && !isDevelopment) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(registration => {
            logger.info('SW registered: ', registration);
        }).catch(registrationError => {
            logger.warn('SW registration failed: ', registrationError);
        });
    });
}


/**
 * @function ready
 * @description Executes a function when the DOM is ready.
 * @param {function} fn - Function to execute.
 * @returns {void}
 * @see {@link https://stackoverflow.com/a/9899701/1293256}
 */
function ready(fn: () => void) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

// Execute when DOM is ready.
ready(function() {

    const mapApi = new LipApi();
    //const datastore = new IndexDBDatastore();
    // const datastore = new MemoryDatastore();
    //const markerLayer = new MarkerLayerCluster();

    const modeAll = new AllMode();
    const modeTechUpgrade = new TechUpgradeMode();
    const modeEE = new EEMode();

    const getDefaultModeString = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const modeFromUrl = urlParams.get('mode');

        if (modeFromUrl) {
            return modeFromUrl;
        }

        const modeFromStorage = localStorage.getItem('mode');
        if (modeFromStorage) {
            return modeFromStorage;
        }

        return 'all';
    };
    const getMode = (mode?: string) => {

        if (!mode) {
            mode = getDefaultModeString();
        }

        switch (mode) {
            case 'all':
                return modeAll;
            case 'upgrade':
                return modeTechUpgrade;
            case 'ee':
                return modeEE;
            default:
                return modeAll;
        }
    }

    const defaultMode = getMode();

    const placeStore = new IndexDBPlaceStore();

    const nbnTechMap = new NbnTechMap({
        mapContainerId: 'map',
        api: mapApi,
        //datastore: datastore,
        //markerLayer: markerLayer,
        defaultModeHandler: defaultMode,
        placestore: placeStore,
    });

    /**
     * Add Controls to Map
     */

    // Display Mode Control
    const cDisplayMode = new ControDisplayMode();
    nbnTechMap.addControl('displaymode', cDisplayMode);

    // Legend Control
    const cLegend = new ControlLegend();
    cLegend.updateLegend(defaultMode.getLegendItems(), nbnTechMap.getMap());
    nbnTechMap.addControl('legend', cLegend);

    // Search Control

    // Progress Control

    // Add event Listeners
    cDisplayMode.on('change', (e) => {
        const mode = getMode(e.state);
        if (!mode) {
            return;
        }
        
        nbnTechMap.setModeHandler(mode);
        cLegend.updateLegend(mode.getLegendItems(), nbnTechMap.getMap());

        localStorage.setItem('mode', e.state);

        // Add mode param to existing url
        const url = new URL(window.location.href);
        url.searchParams.set('mode', e.state);
        window.history.pushState({}, '', url.toString());
        
    });

})