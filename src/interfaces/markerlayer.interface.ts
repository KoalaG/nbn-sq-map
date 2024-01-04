import * as L from "leaflet";
import { PointAndLocids } from "../types";
import IMode from "./mode.interface";
import IPlaceStore from "./placestore.interface";

export default interface IMarkerLayer {
    
    setModeHandler(
        modeHandler: IMode,
        placestore: IPlaceStore,
    ): ThisType<this>;

    getMarkersWithinBounds(bounds: L.LatLngBounds): L.Layer[];
    
    removeMarkersOutsideBounds(bounds: L.LatLngBounds): void;

    removeAllMarkers(): void;

    addPoints(
        points: Map<string, PointAndLocids>
    ): void;

}