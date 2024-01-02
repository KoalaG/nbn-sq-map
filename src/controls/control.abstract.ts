import * as L from 'leaflet';
import IControl from "../interfaces/control.interface";
import NbnTechMap from "../nbn_tech_map.class";
import { ControlEvent } from "../types";


export default abstract class AControl implements IControl {

    //protected map: NbnTechMap;
    protected control: L.Control;
    //protected key: string;


    protected eventHandlers: {
        [eventName: string]: ((e: ControlEvent) => void)[]
    } = {};

    constructor(/*key: string/*, nbnTechMap: NbnTechMap*/) {
        //this.key = key;
        //this.map = nbnTechMap;
        this.control = new L.Control();
    }

    on(eventName: string, callback: (e: ControlEvent) => void) : void {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(callback);
    }

    protected emit(eventName: string, data: any) : void {
        console.debug(`Emitting event: ${eventName}`, {
            data: data,
            handlers: this.eventHandlers[eventName]
        });
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName].forEach(callback => callback({
                name: eventName,
                state: this.getState(),
                data: data
            }));
        }
    }

    abstract getState() : any;

    public getControl() : L.Control {
        return this.control;
    }

}