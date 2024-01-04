import { NbnPlace } from "../types";

/**
 * The interface for a place store.
 * -
 * The map component uses this interface to store and retrieve places on demand.
 * Ideally a place store should use a local database to store places as there could be millions of them.
 * Places would be retrieved from the database either individually or in batches.
 */
export default interface IPlaceStore {

    isReady() : boolean;
    waitUntilReady(timeoutSeconds: Number) : Promise<void>;
    
    storePlace(place: NbnPlace) : Promise<void>;
    storePlaces(places: NbnPlace[]) : Promise<void>;
    
    getPlace(locid: string) : Promise<NbnPlace | undefined>;
    getPlaces(locids: string[]): Promise<NbnPlace[]>;

}
