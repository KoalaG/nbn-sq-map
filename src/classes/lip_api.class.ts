import IApi from "../interfaces/api.interface";
import { NbnPlaceApiResponse } from "../types";

export default class LipApi implements IApi {

    /**
     * @property {doingFetch} - Whether the API is currently fetching data.
     */
    private doingFetch = false;

    async fetchPage(
        bounds: L.LatLngBounds,
        page: number = 1,
        proceed: () => boolean = () => true,
    ) : Promise<NbnPlaceApiResponse>
    {

        const north = bounds.getNorth();
        const east = bounds.getEast();
        const south = bounds.getSouth();
        const west = bounds.getWest();

        if (!proceed()) {
            throw new Error('Proceed function returned false. Stopping fetch.');
            return;
        }
        
        if (this.doingFetch) {
            throw new Error('Already fetching data. Stopping fetch.');
            return;
        }

        this.doingFetch = true;

        page = Math.max(1, Number(page));
        
        return await new Promise((resolve, reject) => {

            fetch(`https://api.lip.net.au/nbn-bulk/map/${north}/${east}/${south}/${west}?page=${page}`, {
                method: 'GET',
                redirect: 'follow',
            })
            .then(response => response.text())
            .then(result => {
                const parsedResult = JSON.parse(result) as { data: NbnPlaceApiResponse};
                resolve(parsedResult.data);
                this.doingFetch = false;
            })
            .catch(reject);

        });
        
    }
}