import {
    Component,
    ViewChild,
    ElementRef,
    OnInit
} from '@angular/core';
import { SerialService } from '../serial.service';
import { EventsService } from '../events.service';
import { GlobalsService } from '../globals.service';
import * as gIF from '../gIF';

import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-ssr-009',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './ssr-009.component.html',
    styleUrls: ['./ssr-009.component.scss']
})
export class SSR_009_Component implements OnInit {

    @ViewChild('repInt') repIntRef!: ElementRef;
    @ViewChild('repLabel') repLabelRef!: ElementRef;

    minInt = 10;
    maxInt = 60;

    repInt = 0;
    savedRepInt = 0;

    txBuf = new Uint8Array(256);
    rwBuf = new gIF.rwBuf_t();

    constructor(
        private serial: SerialService,
        private events: EventsService,
        private globals: GlobalsService
    ) {
        this.rwBuf.wrBuf = new DataView(this.txBuf.buffer);
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit(): void {

        this.events.subscribe('rdNodeDataRsp', (msg: Uint8Array)=>{
            this.rwBuf.rdBuf = new DataView(msg.buffer);
            this.rwBuf.rdIdx = 0;
            const partNum = this.rwBuf.read_uint32_LE();
            if(partNum == this.globals.SSR_009) {
                this.repInt = this.rwBuf.read_uint8();
                this.savedRepInt = this.repInt;
                this.repIntRef.nativeElement.value = `${this.repInt}`;
                this.repLabelRef.nativeElement.style.color = 'gray';
            }
        });
    }

    /***********************************************************************************************
     * fn          rdNodeData_0
     *
     * brief
     *
     */
    rdNodeData_0() {
        setTimeout(()=>{
            this.serial.rdNodeData_0();
        }, 10);
    }

    /***********************************************************************************************
     * fn          wrNodeData_0
     *
     * brief
     *
     */
    wrNodeData_0() {

        this.rwBuf.wrIdx = 0;

        this.rwBuf.write_uint32_LE(this.globals.SSR_009);
        this.rwBuf.write_uint8(this.repInt);

        let len = this.rwBuf.wrIdx
        let nodeData = this.txBuf.slice(0, len);

        this.serial.wrNodeData_0(nodeData);
        setTimeout(()=>{
            this.serial.rdNodeData_0();
        }, 100);
    }

    /***********************************************************************************************
     * fn          onIntChange
     *
     * brief
     *
     */
    onIntChange(newVal: string){

        let rep_int = parseInt(newVal);

        if(Number.isNaN(rep_int) || (rep_int < this.minInt)){
            return;
        }
        if(rep_int > this.maxInt){
            rep_int = this.maxInt;
        }
        console.log(`new rep interval: ${rep_int}`);

        this.repInt = rep_int;
        this.repIntRef.nativeElement.value = `${rep_int}`;
        if(this.repInt != this.savedRepInt){
            this.repLabelRef.nativeElement.style.color = 'red';
        }
        else {
            this.repLabelRef.nativeElement.style.color = 'gray';
        }
    }

    /***********************************************************************************************
     * fn          onIntBlur
     *
     * brief
     *
     */
    onIntBlur(newVal: string){

        let rep_int = parseInt(newVal);

        if(Number.isNaN(rep_int) || (rep_int < this.minInt)){
            this.repIntRef.nativeElement.value = `${this.repInt}`;
        }
    }

}
