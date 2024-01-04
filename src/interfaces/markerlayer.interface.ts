import * as L from "leaflet";
import IDatastore from "./datastore.interface";
import { NbnPlace, PointAndLocids } from "../types";
import IMode from "./mode.interface";
import IPlaceStore from "./placestore.interface";

export default interface IMarkerLayer {
    
    setModeHandler(
        modeHandler: IMode,
        placestore: IPlaceStore,
    ): ThisType<this>;

    //refreshMarkersInsideBounds(bounds: L.LatLngBounds, mFilter?: (place: NbnPlace) => boolean): void;

    removeMarkersOutsideBounds(bounds: L.LatLngBounds): void;

    removeAllMarkers(): void;

    addPoints(
        points: Map<string, PointAndLocids>
    ): void;

}