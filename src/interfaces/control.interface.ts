import NbnTechMap from "../nbn_tech_map.class";
import { ControlEvent } from "../types";

export default interface IControl {


    /**
     * Get the current state of the control
     */
    getState() : any;

    /**
     * Get the Leaflet control object
     */
    getControl() : L.Control;


    on(eventName: string, callback: (e: ControlEvent) => void) : void;

}