import * as L from "leaflet";
import IDatastore from "./datastore.interface";
import { NbnPlace } from "../types";
import IMode from "./mode.interface";

export default interface IMarkerLayer {
    
    setModeHandler(modeHandler: IMode): ThisType<this>;

    refreshMarkersInsideBounds(bounds: L.LatLngBounds, mFilter?: (place: NbnPlace) => boolean): void;

    removeMarkersOutsideBounds(bounds: L.LatLngBounds): void;

    removeAllMarkers(): void;

}