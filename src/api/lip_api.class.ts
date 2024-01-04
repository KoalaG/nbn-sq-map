import IApi from "../interfaces/api.interface";
import { NbnPlaceApiResponse } from "../types";
import { isDebugMode } from "../utils";

export default class LipApi implements IApi {

    async fetchPage(
        bounds: L.LatLngBounds,
        page: number = 1,
        bustCache: boolean = false
    ) : Promise<NbnPlaceApiResponse>
    {

        // Extract Bounds
        const north = bounds.getNorth().toFixed(2);
        const east = bounds.getEast().toFixed(2);
        const south = bounds.getSouth().toFixed(2);
        const west = bounds.getWest().toFixed(2);

        // Make sure page is a positive integer
        page = Math.max(1, Number(page));

        // Set the URL and headers
        const pageUrl = `https://api.lip.net.au/nbn-bulk/map/${north}/${east}/${south}/${west}?page=${page}`;
        const headers: any = {};
        if (bustCache) {
            headers['sw-network-first'] = '1';
        }

        // Fetch the page
        const response = await fetch(pageUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: headers
        });

        // Parse the response
        const result = await response.text();
        const parsedResult = JSON.parse(result) as { data: NbnPlaceApiResponse };

        return parsedResult.data;

    }
}