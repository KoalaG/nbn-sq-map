import IApi from "../interfaces/api.interface";
import { NbnPlaceApiResponse } from "../types";

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
            return;
        }
        
        page = Math.max(1, Number(page));

        const pageUrl = `https://api.lip.net.au/nbn-bulk/map/${north}/${east}/${south}/${west}?page=${page}`;

        // Check if page has already been loaded this session.
        const cache = sessionStorage.getItem(pageUrl);
        if (cache) {
            throw new Error('Page already loaded this session.');
        }
        
        return await new Promise((resolve, reject) => {

            fetch(`https://api.lip.net.au/nbn-bulk/map/${north}/${east}/${south}/${west}?page=${page}`, {
                method: 'GET',
                redirect: 'follow',
            })
            .then(response => response.text())
            .then(result => {
                const parsedResult = JSON.parse(result) as { data: NbnPlaceApiResponse};
                resolve(parsedResult.data);
                sessionStorage.setItem(pageUrl, '1');
            })
            .catch(reject);

        });
        
    }
}