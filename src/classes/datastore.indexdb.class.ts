import * as L from 'leaflet';
import { NbnPlace, PointAndLocids } from "../types";
import IDatastore from '../interfaces/datastore.interface';

import { IDBPDatabase, openDB } from 'idb'; // You need to install idb package


export class IndexDBDatastore implements IDatastore {

    private dbPromise: Promise<IDBPDatabase>;

    // Setup database
    constructor() {
        this.dbPromise = openDB('nbn-tech-map', 1, {
            upgrade(db) {

                const nbnPlaceStore = db.createObjectStore('nbnPlaceStore', { keyPath: 'locid' });
                nbnPlaceStore.createIndex('locid', 'locid', { unique: true });
                nbnPlaceStore.createIndex('latlng', ['latitude', 'longitude'], { unique: false });

                const pointsStore = db.createObjectStore('pointsStore', { keyPath: 'latlng' });
                pointsStore.createIndex('latlng', 'latlng', { unique: true });
                pointsStore.createIndex('latitude', 'latitude', { unique: false });
                pointsStore.createIndex('longitude', 'longitude', { unique: false });

            },
        });
    }

    async storePlace(place: NbnPlace): Promise<void> {

        const db = await this.dbPromise;
        const tx = db.transaction(['nbnPlaceStore', 'pointsStore'], 'readwrite', {
            'durability': 'relaxed',
        });

        tx.objectStore('nbnPlaceStore').put(place);

        const store = tx.objectStore('pointsStore');
        const key = `${place.latitude},${place.longitude}`;
        let record = await store.get(key);
        if (record) {
            // If the record exists, add the new locid to the 'locids' array
            record.locids.push(place.locid);
        } else {
            // If the record doesn't exist, create a new one with 'locids' as an array containing the new locid
            record = {
                latlng: key,
                latitude: place.latitude,
                longitude: place.longitude,
                locids: [place.locid],
            };
        }

        tx.objectStore('pointsStore').put(record);

        await tx.done;
        
    }

    async storePlaces(places: NbnPlace[]) : Promise<void> {

        const db = await this.dbPromise;
        const tx = db.transaction('nbnPlaceStore', 'readwrite', {
            'durability': 'relaxed',
        });

        places.forEach(place => tx.store.put(place));

        await tx.done;

    }

    async getPlace(locid: string) : Promise<NbnPlace> {
            
        const db = await this.dbPromise;
        const tx = db.transaction('nbnPlaceStore', 'readonly', {
            'durability': 'relaxed',
        });

        return tx.store.get(locid);

    }

    async getPlaces(): Promise<NbnPlace[]> {
        
        const db = await this.dbPromise;
        const tx = db.transaction('nbnPlaceStore', 'readonly', {
            'durability': 'relaxed',
        });

        return tx.store.getAll();

    }

    async getPoints() : Promise<PointAndLocids[]> {
        const db = await this.dbPromise;
        const tx = db.transaction('pointsStore', 'readonly');
        return tx.store.getAll();
    }

    async getPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndLocids[]> {
        const db = await this.dbPromise;
        const tx = db.transaction('pointsStore', 'readonly');
    
        const latitudeRange = IDBKeyRange.bound(bounds.getSouth(), bounds.getNorth());
        const longitudeRange = IDBKeyRange.bound(bounds.getWest(), bounds.getEast());
    
        const placesByLatitude = await tx.store.index('latitude').getAll(latitudeRange) as PointAndLocids[];
        const keysByLongitude = await tx.store.index('longitude').getAllKeys(longitudeRange) as string[];
    
        const placesWithinBounds = placesByLatitude.filter(place => keysByLongitude
            .map(key=>key.split(',')[1]).includes(place.longitude.toString())
        );

        return placesWithinBounds;
    }

    async getPlacesAtLatLng(latitude: number, longitude: number) : Promise<NbnPlace[]> {

        const db = await this.dbPromise;

        const tx = db.transaction('nbnPlaceStore', 'readonly');
        const index = tx.store.index('latlng');
        const key = IDBKeyRange.only([latitude, longitude]);

        const places = await index.getAll(key) as NbnPlace[];

        return places;

    }

}