import { latLng } from "leaflet";
import IApi from "./interfaces/api.interface";
import IDatastore from "./interfaces/datastore.interface";
import NbnTechMap from "./nbn_tech_map.class";
import IMarkerLayer from "./interfaces/markerlayer.interface";
import IMode from "./interfaces/mode.interface";

export type NbnTechMapOptions = {
    mapContainerId: string;
    api: IApi;
    datastore: IDatastore;
    //markerLayer: IMarkerLayer;
    defaultModeHandler: IMode;
}

export type PointAndLocids = {
    latlng: string;
    latitude: number;
    longitude: number;
    locids: string[];
}

export type PointAndPlaces = {
    latlng: string;
    latitude: number;
    longitude: number;
    places: NbnPlace[];
}

export type LatLngWithPlaces = {
    latitude: number;
    longitude: number;
    places: NbnPlace[];
}

export type LatLngLocidStorage = {
    [latLng: string]: string[];
}

export type NbnPlaceStore = {
    [locid: string]: NbnPlace;
}

export type NbnPlace = {
    locid: string;

    latitude: number;
    longitude: number;
    address1: string;
    address2: string;

    techType: string;
    reasonCode: string;
    altReasonCode: string;
    techChangeStatus: string;
    programType: string;
    targetEligibilityQuarter: string;

    ee: boolean;
    cbdpricing: boolean;
    zeroBuildCost: boolean;
    businessFibre: boolean;
}

export type NbnPlaceApiResponse = {
    next: number;
    total: number;
    places: NbnPlace[];
}

export type LayerWithPlace<T> = Partial<T>
& { place?: NbnPlace }

export type ControlEvent = {
    name: string;
    //map: NbnTechMap;
    state: any;
    data: any;
}