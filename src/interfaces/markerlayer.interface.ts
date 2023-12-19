import * as L from "leaflet";
import IDatastore from "./datastore.interface";

export default interface IMarkerLayer {

    constructor(map: L.Map, datastore: IDatastore): void;

    refreshMarkersInsideBounds(bounds: L.LatLngBounds): void;

    removeMarkersOutsideBounds(bounds: L.LatLngBounds): void;

    removeAllMarkers(): void;

}