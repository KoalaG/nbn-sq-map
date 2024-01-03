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
    const datastore = new MemoryDatastore();
    //const markerLayer = new MarkerLayerCluster();

    const modeAll = new AllMode();

    const nbnTechMap = new NbnTechMap({
        mapContainerId: 'map',
        api: mapApi,
        datastore: datastore,
        //markerLayer: markerLayer,
        defaultModeHandler: modeAll
    });


    /**
     * Add Controls to Map
     */

    // Display Mode Control
    const cDisplayMode = new ControDisplayMode();
    nbnTechMap.addControl('displaymode', cDisplayMode);

    // Legend Control
    const cLegend = new ControlLegend();
    cLegend.updateLegend(modeAll.getLegendItems());
    nbnTechMap.addControl('legend', cLegend);

    // Search Control

    // Progress Control

    // Add event Listeners
    cDisplayMode.on('change', (e) => {
        switch (e.state) {
            case 'all':
                nbnTechMap.setModeHandler(modeAll);
                break;
            case 'upgrade':
                break;
            case 'ee':
                break;
            default:
                break;
        }
    });

})