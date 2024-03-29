import * as L from 'leaflet';
import { LatLngLocidStorage, NbnPlace, NbnPlaceStore, PointAndLocids, PointAndPlaces } from "../types";
import IDatastore from '../interfaces/datastore.interface';


export class MemoryDatastore implements IDatastore {

    private latLngIndex: LatLngLocidStorage = {};
    private nbnPlaceStore: NbnPlaceStore = {};

    isReady() : boolean {
        return true;
    }

    /**
     * Store place markers 
     * @param placeMarker 
     */
    async storePlace(place: NbnPlace) : Promise<void> {

        const latitude = place.latitude;
        const longitude = place.longitude;
        const latLng = `${latitude},${longitude}`;
        const locid = place.id;

        // Store LOCID into index
        if (!this.latLngIndex[latLng]) {
            this.latLngIndex[latLng] = [ locid ];
        }
        else {
            if (!this.latLngIndex[latLng].includes(locid)) {
                this.latLngIndex[latLng].push(locid);
            }
        }

        // Store place
        this.nbnPlaceStore[locid] = place;

    }

    async storePlaces(places: NbnPlace[]) : Promise<void> {
        places.forEach(place => this.storePlace(place));
    }

    async getPlace(locid: string) : Promise<NbnPlace> {
        return this.nbnPlaceStore[locid];
    }

    async getPlaces(): Promise<NbnPlace[]> {
        return Object.keys(this.nbnPlaceStore)
            .map(locid => this.nbnPlaceStore[locid]);
    }

    async getPoints() : Promise<PointAndLocids[]> {
        return Object.keys(this.latLngIndex)
            .map((latLng) => {
                const [ latitude, longitude ] = latLng.split(',').map(Number);
                return {
                    lat: latitude,
                    lng: longitude,
                    ids: this.latLngIndex[latLng],
                    add: [],
                    col: [],
                };
            })
        ;
    }

    async getPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndLocids[]> {
        const points = (await this.getPoints())
            .filter(({ lat, lng }) => this.isLatLngWithinBounds(lat, lng, bounds))
        return points;
    }

    async getFullPointsWithinBounds(bounds: L.LatLngBounds) : Promise<PointAndPlaces[]> {
        const points = (await this.getPoints())
            .filter(({ lat, lng }) => this.isLatLngWithinBounds(lat, lng, bounds))
            .map(({ lat, lng, ids }) => ({
                latlng: `${lat},${lng}`, latitude: lat, longitude: lng,
                places: ids.map(locid => this.nbnPlaceStore[locid]),
            }))
        return points;
    }

    async getPlacesAtLatLng(latitude: number, longitude: number) : Promise<NbnPlace[]> {
        const latLng = `${latitude},${longitude}`;
        return this.latLngIndex[latLng]
            .map(locid => this.nbnPlaceStore[locid])
        ;
    }

    private isLatLngWithinBounds(latitude: number, longitude: number, bounds: L.LatLngBounds) {
        return latitude > bounds.getSouth()
            && latitude < bounds.getNorth()
            && longitude > bounds.getWest()
            && longitude < bounds.getEast()
        ;
    }

}