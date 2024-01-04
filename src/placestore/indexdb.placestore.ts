import IPlaceStore from '../interfaces/placestore.interface';
import { NbnPlace } from "../types";
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Logger } from '../utils';

export interface NBNTechMapDB extends DBSchema {
    nbnPlaceStore: {
        key: string;
        value: NbnPlace;
        indexes: {
            //locid: string;
            //latlng: [number, number];
        }
    };
}

export class IndexDBPlaceStore implements IPlaceStore {

    private DB_NAME = 'nsm-placestore';

    private logger = new Logger('IndexDBPlaceStore');

    /**
     * The database.
     */
    private db?: IDBPDatabase<NBNTechMapDB>;

    /**
     * Setup database.
     */
    constructor() {
        
        this.logger.info('Setting up database...');

        openDB<NBNTechMapDB>(this.DB_NAME, 1, {

            upgrade(db, oldVersion, newVersion, transaction, event) {

                const objectStoreNames = db.objectStoreNames;

                // Create nbn place store if it doesn't exist
                if (!objectStoreNames.contains('nbnPlaceStore')) {
                    db.createObjectStore('nbnPlaceStore', { keyPath: 'locid' });
                }

            },

            blocked: (currentVersion, blockedVersion, event) => {
                this.logger.warn('Database blocked!', {
                    currentVersion, blockedVersion, event,
                });
            },

            blocking: (currentVersion, blockedVersion, event) => {
                this.logger.warn('Database blocking!', {
                    currentVersion, blockedVersion, event
                });
            },

            terminated: () => {
                this.logger.warn('Database terminated!');
            }

        })
        
        .then((db) => {
            this.db = db;
            this.logger.info('Database ready!');
        })
        
        .catch((err) => {
            this.logger.error('Failed to open database: ', err);
        })

        .finally(() => {
            this.logger.info('Database setup complete.');
        });

    }

    /**
     * Check if the database is ready.
     * @returns 
     */
    isReady() : boolean {
        return !!this.db;
    }

    /**
     * Wait until the database is ready.
     * @param timeoutSeconds 
     * @returns 
     */
    async waitUntilReady(timeoutSeconds: number) : Promise<void> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const timeElapsed = Date.now() - startTime;
                if (this.isReady()) {
                    clearInterval(interval);
                    resolve();
                } else if (timeElapsed > timeoutSeconds * 1000) {
                    clearInterval(interval);
                    reject(new Error(`Database not ready after ${timeoutSeconds} seconds.`));
                }
            }, 100);
        });
    }

    /**
     * Store a single place.
     * @param place 
     */
    async storePlace(place: NbnPlace): Promise<void> {
        const db = await this.getDb();
        await db.put('nbnPlaceStore', place);
    }

    /**
     * Store a batch of places.
     * Uses a transaction to provide better performance.
     * @param places 
     */
    async storePlaces(places: NbnPlace[]) : Promise<void> {

        // Get the database
        const db = await this.getDb();

        // Create a transaction
        const tx = db.transaction(['nbnPlaceStore'], 'readwrite', {
            'durability': 'relaxed',
        });

        // Get the object store
        const placeStore = tx.objectStore('nbnPlaceStore');

        // Put each place into the store
        await places.map(place => placeStore.put(place))
        
        // Wait for the transaction to complete
        await tx.done;

    }

    /**
     * Get a single place.
     * @param locid 
     * @returns 
     */
    async getPlace(locid: string) : Promise<NbnPlace | undefined> {

        // Get the database
        const db = await this.getDb();

        // Get the place
        return await db.get('nbnPlaceStore', locid);

    }

    /**
     * Get a batch of places.
     * Uses a transaction to provide better performance.
     * @param locids 
     * @returns 
     */
    async getPlaces(locids: string[]): Promise<NbnPlace[]> {

        // Get the database
        const db = await this.getDb();
        
        // Open a transaction
        const tx = db.transaction(['nbnPlaceStore'], 'readonly');

        // Get the object store
        const placeStore = tx.objectStore('nbnPlaceStore');

        // Get the places
        const places = await Promise.all(locids.map(locid => placeStore.get(locid)));

        // Wait for the transaction to complete
        await tx.done;

        // Return the places
        return places.filter(place => !!place) as NbnPlace[];

    }

    /**
     * Get the database.
     * @param timeout 
     * @returns Promise<IDBPDatabase<NBNTechMapDB>>
     */
    private async getDb(timeout = 5) : Promise<IDBPDatabase<NBNTechMapDB>> {
        await this.waitUntilReady(timeout);
        if (!this.db) {
            throw new Error('Database not ready.');
        }
        return this.db;
    }

}