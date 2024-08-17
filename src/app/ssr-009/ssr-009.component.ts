import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { SerialService } from '../serial.service';
import { EventsService } from '../events.service';
import { GlobalsService } from '../globals.service';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import * as gIF from '../gIF';

import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
    selector: 'app-ssr-009',
    standalone: true,
    imports: [
        CommonModule,
        AngularMaterialModule,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './ssr-009.component.html',
    styleUrls: ['./ssr-009.component.scss']
})
export class SSR_009_Component implements OnInit, OnDestroy {

    minInt = 10;
    maxInt = 60;

    repIntFormCtrl!: FormControl;

    txBuf = new Uint8Array(256);
    rwBuf = new gIF.rwBuf_t();

    constructor(private serial: SerialService,
                private events: EventsService,
                private globals: GlobalsService,
                private ngZone: NgZone,
                public cdRef: ChangeDetectorRef) {
        this.rwBuf.wrBuf = new DataView(this.txBuf.buffer);
    }

    ngOnDestroy(): void {
        // ---
    }

    ngOnInit(): void {

        this.events.subscribe('rdNodeDataRsp', (msg: Uint8Array)=>{
            this.rwBuf.rdBuf = new DataView(msg.buffer);
            this.rwBuf.rdIdx = 0;
            const partNum = this.rwBuf.read_uint32_LE();
            if(partNum == this.globals.SSR_009) {
                this.repIntFormCtrl.setValue(this.rwBuf.read_uint8());
            }
        });
        this.events.subscribe('rdNodeData_0', ()=>{
            this.rdNodeData_0();
        });

        this.repIntFormCtrl = new FormControl(
            this.minInt,
            [
                Validators.required,
                Validators.min(this.minInt),
                Validators.max(this.maxInt),
            ]
        );
        this.repIntFormCtrl.markAsTouched();
    }

    /***********************************************************************************************
     * fn          rdNodeData_0
     *
     * brief
     *
     */
    rdNodeData_0() {

        this.ngZone.run(()=>{
            this.repIntFormCtrl.setValue(this.minInt);
        });

        setTimeout(()=>{
            this.serial.rdNodeData_0();
        }, 200);
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
        this.rwBuf.write_uint8(this.repIntFormCtrl.value);

        let len = this.rwBuf.wrIdx
        let nodeData = this.txBuf.slice(0, len);

        this.serial.wrNodeData_0(nodeData);
    }

    /***********************************************************************************************
     * fn          repIntErr
     *
     * brief
     *
     */
    repIntErr() {

        if(this.repIntFormCtrl.hasError('required')) {
            return 'You must enter a value';
        }
        if(this.repIntFormCtrl.hasError('min')) {
            return `rep interval must be ${this.minInt} - ${this.maxInt}`;
        }
        if(this.repIntFormCtrl.hasError('max')) {
            return `rep interval must be ${this.minInt} - ${this.maxInt}`;
        }

        return `unhandled err`;
    }

    /***********************************************************************************************
     * fn          isInvalid
     *
     * brief
     *
     */
    isInvalid() {
        if(this.repIntFormCtrl.invalid){
            return true;
        }
        return false;
    }

}
