import * as L from 'leaflet';
//import NbnTechMap from "../nbn_tech_map.class";
import AControl from "./control.abstract";

export default class ControDisplayMode extends AControl {

    private displayMode = 'all';
    private elControlDiv: HTMLDivElement = document.createElement('div');
    private elDropdown: HTMLSelectElement = document.createElement('select');

    constructor () {
        super();

        this.generateControlDiv();
        this.control.onAdd = (map: L.Map) => {
            this.generateDropdown();
            return this.elControlDiv;
        }

        //this.control.onAdd = () => this.addControlDiv();
        //this.show();
    }

    getState() : string {
        return this.displayMode;
    }


    private allLabel: any = null;
    private allRadio: any = null;
    private allText: any = null;
    private upgradeLabel: any = null;
    private upgradeRadio: any = null;
    private upgradeText: any = null;
    private eeLabel: any = null;
    private eeRadio: any = null;
    private eeText: any = null;
    
    changeMode(mode: string) {
        this.displayMode = mode;
        this.emit('change', mode);
    }

    private generateControlDiv() : void {
        if(this.elControlDiv) {
            console.warn('ControlDiv already exists');
        }

        this.elControlDiv.classList.add('info', 'legend');
        this.elControlDiv.style.backgroundColor = "#ffffff";
        this.elControlDiv.style.opacity = "0.8";
        this.elControlDiv.style.padding = "5px";
        this.elControlDiv.style.borderRadius = "5px";

    }

    private generateDropdown() : void {
        if (this.elDropdown) {
            console.warn('Dropdown already exists');
        }

        const dropdown = this.elDropdown;
        dropdown.classList.add('control-select');

        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.innerText = 'Show All Locations';
        dropdown.appendChild(allOption);

        /*
        const upgradeOption = document.createElement('option');
        upgradeOption.value = 'upgrade';
        upgradeOption.innerText = 'Tech Upgrades';
        dropdown.appendChild(upgradeOption);

        const eeOption = document.createElement('option');
        eeOption.value = 'ee';
        eeOption.innerText = 'Enterprise Ethernet';
        dropdown.appendChild(eeOption);
        */

        dropdown.addEventListener('change', (e) => this.changeMode((e.target as HTMLSelectElement).value));

        this.elDropdown = dropdown;
        this.elControlDiv.appendChild(dropdown);

    }

    /*addControlDiv() {

        this.allLabel = L.DomUtil.create('label', 'control-label', this.controlDiv);
        this.allRadio = L.DomUtil.create('input', 'control-input', this.allLabel);
        this.allRadio.type = 'radio';
        this.allRadio.name = 'display-mode';
        this.allRadio.value = 'all';
        this.allRadio.checked = true;
        L.DomEvent.on(this.allRadio, 'change', (e) => this.changeMode('all'));
        this.allText = L.DomUtil.create('span', 'control-text', this.allLabel);
        this.allText.innerText = 'All';

        this.upgradeLabel = L.DomUtil.create('label', 'control-label', this.controlDiv);
        this.upgradeRadio = L.DomUtil.create('input', 'control-input', this.upgradeLabel);
        this.upgradeRadio.type = 'radio';
        this.upgradeRadio.name = 'display-mode';
        this.upgradeRadio.value = 'upgrade';
        L.DomEvent.on(this.upgradeRadio, 'change', () => this.changeMode('upgrade'));
        this.upgradeText = L.DomUtil.create('span', 'control-text', this.upgradeLabel);
        this.upgradeText.innerText = 'Tech Upgrade';

        this.eeLabel = L.DomUtil.create('label', 'control-label', this.controlDiv);
        this.eeRadio = L.DomUtil.create('input', 'control-input', this.eeLabel);
        this.eeRadio.type = 'radio';
        this.eeRadio.name = 'display-mode';
        this.eeRadio.value = 'ee';
        L.DomEvent.on(this.eeRadio, 'change', () => this.changeMode('ee'));
        this.eeText = L.DomUtil.create('span', 'control-text', this.eeLabel);
        this.eeText.innerText = 'EE';

    }*/

}