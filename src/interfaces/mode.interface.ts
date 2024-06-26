import { LegendItem, NbnPlace, PointAndPlaces } from "../types";

export default interface IMode {

    readonly id: string;
    readonly name: string;

    filter: (place: NbnPlace) => boolean;

    pointColour: (point: PointAndPlaces) => string;

    placeColour: (place: NbnPlace) => string;

    renderPopupContent: (place: NbnPlace) => HTMLElement;

    renderTooltip: (places: NbnPlace[]) => string;

    getLegendItems: () => LegendItem[];

}