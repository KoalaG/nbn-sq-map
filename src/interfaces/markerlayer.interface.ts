import * as L from "leaflet";
import IDatastore from "./datastore.interface";
import { NbnPlace } from "../types";

export default interface IMarkerLayer {

    setMap(map: L.Map): ThisType<this>;
    
    setDatastore(datastore: IDatastore): ThisType<this>;

    refreshMarkersInsideBounds(bounds: L.LatLngBounds, mFilter?: (place: NbnPlace) => boolean): void;

    removeMarkersOutsideBounds(bounds: L.LatLngBounds): void;

    removeAllMarkers(): void;

}