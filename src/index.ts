/**
 * @file Main entry point for map scripts.
 * @module index.ts
 * @version 1.0.0
 * @author KoalaG
 * @license MIT
 */

import { IndexDBDatastore } from "./classes/datastore.indexdb.class";
import LipApi from "./classes/lip_api.class";
import NbnTechMap from "./classes/nbn_tech_map.class";

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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Execute when DOM is ready.
ready(function() {

    const mapApi = new LipApi();
    const datastore = new IndexDBDatastore();

    const nbnTechMap = new NbnTechMap({
        mapContainerId: 'map',
        api: mapApi,
        datastore: datastore,
    });





})