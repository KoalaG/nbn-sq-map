import * as L from 'leaflet';
import { LatLngLocidStorage, NbnPlace, PointAndLocids, PointAndPlaces } from "../types";
import IDatastore from '../interfaces/datastore.interface';

import { DBSchema, IDBPDatabase, openDB } from 'idb'; // You need to install idb package

export interface NBNTechMapDB extends DBSchema {
    nbnPlaceStore: {
        key: string;
        value: NbnPlace;
        indexes: {
            //locid: string;
            latlng: [number, number];
        }
    };
    pointsStore: {
        key: string;
        value: PointAndLocids;
        indexes: {
            latitude: number;
            longitude: number;
        };
    };
}

export class IndexDBDatastore implements IDatastore {

    private db?: IDBPDatabase<NBNTechMapDB>;

    // Setup database
    constructor() {
        console.log('Setting up database...');
        openDB<NBNTechMapDB>('nbn-tech-map', 2, {
            upgrade(db, oldVersion, newVersion, transaction, event) {

                // Changes since version 1
                if (oldVersion === 1) {
                    // V2 changes
                    transaction.objectStore('nbnPlaceStore').deleteIndex('locid');
                    transaction.objectStore('pointsStore').deleteIndex('latlng');
                }

                // Current version
                else {

                    const nbnPlaceStore = db.createObjectStore('nbnPlaceStore', { keyPath: 'locid' });
                    nbnPlaceStore.createIndex('latlng', ['latitude', 'longitude'], { unique: false });

                    const pointsStore = db.createObjectStore('pointsStore', { keyPath: 'latlng' });
                    pointsStore.createIndex('latitude', 'latitude', { unique: false });
                    pointsStore.createIndex('longitude', 'longitude', { unique: false });
                
                }

            },
            blocked(currentVersion, blockedVersion, event) {
                console.warn('Database blocked!', {
                    currentVersion, blockedVersion, event,
                });
            },
            blocking(currentVersion, blockedVersion, event) {
                console.warn('Database blocking!', {
                    currentVersion, blockedVersion, event
                });
            },
            terminated() {
                console.warn('Database terminated!');
            }
        }).then((db) => {
            console.log('Database ready!');
            this.db = db;
        }).catch((err) => {
            console.error('Failed to open database: ', err);
        })
        .finally(() => {
            console.log('Database setup complete.');
        });
    }

    isReady() : boolean {
        return !!this.db;
    }

    async storePlace(place: NbnPlace): Promise<void> {

        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }

        const tx = db.transaction(['nbnPlaceStore', 'pointsStore'], 'readwrite', {
            'durability': 'relaxed',
        });

        tx.objectStore('nbnPlaceStore').put(place);

        const store = tx.objectStore('pointsStore');
        const key = `${place.latitude},${place.longitude}`;
        let record = await store.get(key);
        if (record) {
            record.locids.push(place.locid);
            record.locids = [...new Set(record.locids)];
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

        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }
        const tx = db.transaction(['nbnPlaceStore', 'pointsStore'], 'readwrite', {
            'durability': 'relaxed',
        });

        const placeStore = tx.objectStore('nbnPlaceStore');
        const pointStore = tx.objectStore('pointsStore');

        const placesPromise = places.map(place => placeStore.put(place))
        
        const pointsPromise = places.map(async place => {

            const key = `${place.latitude},${place.longitude}`;
            let record = await pointStore.get(key);

            if (record) {
                if ( (record.locids as string[]).includes(place.locid)) {
                    return;
                } else {
                    record.locids.push(place.locid);
                    record.locids = [...new Set(record.locids)];
                }
            } else {
                // If the record doesn't exist, create a new one with 'locids' as an array containing the new locid
                record = {
                    latlng: key,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    locids: [place.locid],
                };
            }
            pointStore.put(record);
        });

        await Promise.all([...placesPromise, ...pointsPromise]);

        await tx.done;

    }

    async getPlace(locid: string) : Promise<NbnPlace | undefined> {
        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }
        return await db.get('nbnPlaceStore', locid);
    }

    async getPlaces(): Promise<NbnPlace[]> {
        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }
        return await db.getAll('nbnPlaceStore');
    }

    async getPoints() : Promise<PointAndLocids[]> {
        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }
        return await db.getAll('pointsStore');
    }

    async getPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndLocids[]> {
        
        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }
        const tx = db.transaction('pointsStore', 'readonly');
    
        const latitudeRange = IDBKeyRange.bound(bounds.getSouth(), bounds.getNorth());
        const longitudeRange = IDBKeyRange.bound(bounds.getWest(), bounds.getEast());
    
        const pointsByLatitude = await tx.store.index('latitude').getAll(latitudeRange) as ({ latlng: string } & PointAndLocids)[];
        const keysByLongitude = await tx.store.index('longitude').getAllKeys(longitudeRange) as string[];
     
        await tx.done;

        return pointsByLatitude.filter(point => keysByLongitude.indexOf(point.latlng) !== -1);
    }

    async getFullPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndPlaces[]> {
        
        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }
        const tx = db.transaction(['pointsStore', 'nbnPlaceStore'], 'readonly');

        const pointStore = tx.objectStore('pointsStore');
        const placeStore = tx.objectStore('nbnPlaceStore');
    
        const latitudeRange = IDBKeyRange.bound(bounds.getSouth(), bounds.getNorth());
        const longitudeRange = IDBKeyRange.bound(bounds.getWest(), bounds.getEast());
    
        const pointsByLatitude = pointStore.index('latitude').getAll(latitudeRange) as Promise<({ latlng: string } & PointAndLocids)[]>;
        const keysByLongitude = pointStore.index('longitude').getAllKeys(longitudeRange) as Promise<string[]>;
     
        const points = (await pointsByLatitude).filter(async (point) => (await keysByLongitude).indexOf(point.latlng) !== -1);

        const pointsWithPlaces = await Promise.all(points.map(async point => {
            const places = await Promise.all(point.locids.map(async locid => await placeStore.get(locid)));
            return {
                ...point,
                places: places.filter(place => !!place) as NbnPlace[],
            };
        }));

        await tx.done;

        return pointsWithPlaces;
    }

    async getPlacesAtLatLng(latitude: number, longitude: number) : Promise<NbnPlace[]> {

        const db = await this.db;
        if (!db) {
            throw new Error('Database not ready.');
        }

        const tx = db.transaction('nbnPlaceStore', 'readonly');
        const index = tx.store.index('latlng');
        const key = IDBKeyRange.only([latitude, longitude]);

        const places = await index.getAll(key) as NbnPlace[];

        return places;

    }

}