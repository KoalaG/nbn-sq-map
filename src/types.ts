import IApi from "./interfaces/api.interface";
import IMode from "./interfaces/mode.interface";
import IPlaceStore from "./interfaces/placestore.interface";

export type NbnTechMapOptions = {
    mapContainerId: string;
    api: IApi;
    placestore: IPlaceStore;
    //markerLayer: IMarkerLayer;
    defaultModeHandler: IMode;
}

export type PointAndLocids = {
    lat: number;
    lng: number;
    ids: string[];
    col: string[];
    add: string[];
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
    id: string;

    latitude: number;
    longitude: number;
    
    reasonCode: string;
    altReasonCode: string;
    techChangeStatus: string;
    programType: string;
    targetEligibilityQuarter: string;
    techType: string;

    address1: string;
    address2: string;

    zeroBuildCost: boolean;
    forecastedRTC: boolean;
    coatChangeReason: string;
    
    cbdpricing: boolean;
    ee: boolean;
    businessFibre: boolean;
}

export type NbnPlaceApiResponse = {
    nextPage: number;
    totalPages: number;
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

export type LegendItem = {
    label: string;
    colour: string;
    count?: number;
}