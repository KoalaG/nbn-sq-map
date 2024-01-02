import { NbnPlace, PointAndLocids, PointAndPlaces } from "../types";

export default interface IDatastore {

    isReady() : boolean;
    
    storePlace(place: NbnPlace) : Promise<void>;
    storePlaces(places: NbnPlace[]) : Promise<void>;
    
    getPlace(locid: string) : Promise<NbnPlace | undefined>;
    getPlaces(): Promise<NbnPlace[]>;

    getPoints() : Promise<PointAndLocids[]>;
    getPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndLocids[]>;
    getFullPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndPlaces[]>;

    getPlacesAtLatLng(latitude: number, longitude: number) : Promise<NbnPlace[]>;

}
