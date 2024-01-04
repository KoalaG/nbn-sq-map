/**
 * API Interface
 * @export IApi
 * @interface IApi
 * @description Interface for the API class.
 * @version 1.0.0
 */

import { NbnPlaceApiResponse } from "../types.js";

export default interface IApi {

    fetchPage(
        bounds: L.LatLngBounds,
        page?: number,
        bustCache?: boolean,
    ): Promise<NbnPlaceApiResponse>;

}