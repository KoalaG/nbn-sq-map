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

    address1: string;
    address2: string;

    altReasonCode: string;
    programType: string;
    reasonCode: string;
    targetEligibilityQuarter: string;
    techChangeStatus: string;
    techType: string;

    hstStatus: string;
    hstSpeedTier: string;

    coatChangeReason: string;
    forecastedRTC: boolean;

    businessFibre: boolean;
    cbdpricing: boolean;
    ee: boolean;
    zeroBuildCost: boolean;

    latitude: number;
    longitude: number;

    hoursSinceLastUpdate: number;
}

export type NbnPlaceApiResponse = {
    places: NbnPlace[];
    page: number;
    records: number;
    totalPages: number;
    totalRecords: number;
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