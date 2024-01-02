import { NbnPlace, PointAndPlaces } from "../types";

export default interface IMode {

    filter: (place: NbnPlace) => boolean;

    pointColour: (point: PointAndPlaces) => string;

    renderPopupContent: (place: NbnPlace) => HTMLElement;

    renderTooltip: (places: NbnPlace[]) => string;

}