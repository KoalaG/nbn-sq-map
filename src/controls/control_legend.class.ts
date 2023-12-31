import IMode from "../interfaces/mode.interface";
import { LegendItem } from "../types";
import AControl from "./control.abstract";

export default class ControlLegend extends AControl {

    private elControlDiv: HTMLDivElement = document.createElement('div');
    
    constructor () {
        super();

        this.control.setPosition('bottomright');

        this.elControlDiv.classList.add('info', 'legend');
        this.elControlDiv.style.backgroundColor = "#ffffff";
        this.elControlDiv.style.opacity = "0.8";
        this.elControlDiv.style.padding = "5px";
        this.elControlDiv.style.borderRadius = "5px";

        this.control.onAdd = (map: L.Map) => {
            return this.elControlDiv;
        }
        
    }

    getState() {
        return undefined;
    }

    updateLegend(items: LegendItem[]) {

        let html = '';
        items.forEach(item => {
            html += '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ item.colour +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> ' + item.label;
            if (item.count) {
                html += ' (' + item.count + ')';
            }
            html += '<br>';
        });

        this.elControlDiv.innerHTML = html;

    }




    /*

    getLegendHTML() {

        if (this.nbnTechMap.controls.displayMode?.displayMode == 'ee') {
            return '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_CBD_ZBC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone CBD ($0 Build)<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_CBD_BC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone CBD (Build POA)<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_Z123_ZBC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone 1/2/3 ($0 Build)<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourEE_Z123_BC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Zone 1/2/3 (Build POA)<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourUnknown+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Unknown';
        }

        if (this.nbnTechMap.controls.displayMode?.displayMode == 'upgrade') {
            return '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ COL_TECH_COMPLETE +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Completed<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ COL_TECH_AVAIL +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Available<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ COL_TECH_BUILDFINALISED +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Build Finalised<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ COL_TECH_DESIGN +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> In Design<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ COL_TECH_COMMITTED +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Committed<br>'
            + '<b>Multi Dwelling Units</b><br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ COL_TECH_MDU_INBUILD +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> In Build<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+ COL_TECH_MDU_ELIGIBLE +'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Elligible<br>'
            + '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourUnknown+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Unknown';
        }

        return '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTP+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTP<br>' + 
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTPAvail+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTP Upgrade<br>' +
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTPSoon+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTP Upgrade Soon<br>' +
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourHFC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> HFC<br>' + 
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTC+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTC<br>' +
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFTTNB+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FTTN/FTTB<br>' +
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFW+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FW<br>' +
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourFWAvail+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> FW Upgrade<br>' +
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourSat+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Satellite<br>' +
            '<svg height="10" width="10"><circle cx="5" cy="5" r="5" fill="'+colourUnknown+'" stroke="#000000" stroke-width="1" opacity="1" fill-opacity="0.8" /></svg> Unknown';
    }

    addControlDiv(map) {

        if (!this.controlDiv) {
            this.controlDiv = L.DomUtil.create('div', 'info legend');
        }

        this.controlDiv.style.backgroundColor = "#ffffff";
        this.controlDiv.style.opacity = "0.8";
        this.controlDiv.style.padding = "5px";
        this.controlDiv.style.borderRadius = "5px";
        this.controlDiv.style.width = "150px";

        this.controlDiv.innerHTML = this.getLegendHTML();

        return this.controlDiv;
    }

    refresh() {
        this.controlDiv.innerHTML = this.getLegendHTML();
    }

    show() {
        this.control.addTo(this.nbnTechMap.map);
    }

    remove() {
        this.control.remove();
    }

    */
}