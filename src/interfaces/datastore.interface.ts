import { NbnPlace, PointAndLocids } from "../types";

export default interface IDatastore {

    isReady() : boolean;
    
    storePlace(place: NbnPlace) : Promise<void>;
    storePlaces(places: NbnPlace[]) : Promise<void>;
    
    getPlace(locid: string) : Promise<NbnPlace>;
    getPlaces(): Promise<NbnPlace[]>;

    getPoints() : Promise<PointAndLocids[]>;
    getPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndLocids[]>;

    getPlacesAtLatLng(latitude: number, longitude: number) : Promise<NbnPlace[]>;

}
