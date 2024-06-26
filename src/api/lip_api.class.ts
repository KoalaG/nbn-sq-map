import IApi from "../interfaces/api.interface";
import { NbnPlaceApiResponse } from "../types";
import { isDebugMode } from "../utils";

export default class LipApi implements IApi {

    async fetchPage(
        bounds: L.LatLngBounds,
        page: number = 1,
        proceed: () => boolean = () => true,
    ) : Promise<NbnPlaceApiResponse>
    {

        const north = bounds.getNorth().toFixed(2);
        const east = bounds.getEast().toFixed(2);

        if (!proceed()) {
            throw new Error('Proceed function returned false. Stopping fetch.');
        }

        // Get url parameter apiServer
        const urlParams = new URLSearchParams(window.location.search);
        const apiServer = urlParams.get('apiServer') || 'https://nbn.api.lip.net.au';
        
        page = Math.max(1, Number(page));

        const pageUrl = `${apiServer}/places/map/${north}/${east}?page=${page}`;
        
        return await new Promise((resolve, reject) => {

            fetch(pageUrl, {
                method: 'GET',
                redirect: 'follow',
            })
            .then(response => response.text())
            .then(result => {
                const parsedResult = JSON.parse(result) as NbnPlaceApiResponse;
                resolve(parsedResult);
            })
            .catch(reject);

        });
        
    }
}