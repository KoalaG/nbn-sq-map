import IApi from "../interfaces/api.interface";
import { NbnPlaceApiResponse } from "../types";
import { isLocalhost } from "../utils";

const urlBase = isLocalhost() ? 'http://127.0.0.1:3000' : 'https://api.lip.net.au'
export default class LipApi implements IApi {

    async fetchPage(
        bounds: L.LatLngBounds,
        page: number = 1,
        proceed: () => boolean = () => true,
    ) : Promise<NbnPlaceApiResponse>
    {

        const north = bounds.getNorth().toFixed(2);
        const east = bounds.getEast().toFixed(2);
        const south = bounds.getSouth().toFixed(2);
        const west = bounds.getWest().toFixed(2);

        if (!proceed()) {
            throw new Error('Proceed function returned false. Stopping fetch.');
        }
        
        page = Math.max(1, Number(page));

        const pageUrl = `${urlBase}/nbn-bulk/map/${north}/${east}/${south}/${west}?page=${page}`;

        // Check if page has already been loaded this session.
        // const cache = sessionStorage.getItem(pageUrl);
        // const cachedTime = cache ? new Date(cache) : null;
        // if (cachedTime && cachedTime.getTime() > new Date().getTime() - 1000 * 60 * 60 * 24) {
        //     throw new Error('Page already loaded this session.');
        // }
        
        return await new Promise((resolve, reject) => {

            fetch(pageUrl, {
                method: 'GET',
                redirect: 'follow',
            })
            .then(response => response.text())
            .then(result => {
                const parsedResult = JSON.parse(result) as { data: NbnPlaceApiResponse};
                resolve(parsedResult.data);
                //sessionStorage.setItem(pageUrl, new Date().toISOString());
            })
            .catch(reject);

        });
        
    }
}