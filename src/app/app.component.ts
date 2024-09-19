import {
    Component,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    ElementRef,
    AfterViewInit
} from '@angular/core';
import { GlobalsService } from './globals.service';
import { EventsService } from './events.service';
import { SerialService } from './serial.service';

//import { HTU21D_005_Component } from './htu21d-005/htu21d-005.component';
//import { SHT40_018_Component } from './sht40-018/sht40-018.component';
//import { SSR_009_Component } from './ssr-009/ssr-009.component';
//import { Actuator_010_Component } from './actuator-010/actuator-010.component';
//import { RKR_SW_012_Component } from './rkr-sw-012/rkr-sw-012';
//import { ZB_Bridge_Component } from './zb-bridge/zb-bridge.component';
//import { AQ_015_Component } from './aq-015/aq-015.component';
//import { SI7021_027_Component } from './si7021-027/SI7021-027.component';
//import { PB_SW_023_Component } from './pb-sw-023/pb-sw-023';

import { CommonModule } from '@angular/common';

import * as gIF from './gIF';
import * as gConst from './gConst';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild('dynamic', {read: ViewContainerRef}) viewRef!: ViewContainerRef;

    @ViewChild('keyLabel') keyLabelRef!: ElementRef;
    @ViewChild('nwkKey') nwkKeyRef!: ElementRef;

    @ViewChild('panLabel') panLabelRef!: ElementRef;
    @ViewChild('pan') panRef!: ElementRef;

    @ViewChild('chLabel') chLabelRef!: ElementRef;
    @ViewChild('channel') channelRef!: ElementRef;

    @ViewChild('cbScroll') cbScroll!: ElementRef;
    @ViewChild('logList') logList!: ElementRef;

    maxKeyLen = 16;
    minKeyLen = 16;
    minId = 1;
    maxId = 0xFFFE;
    minCh = 11;
    maxCh = 26;

    logs = [] as (gIF.msgLogs_t[]);
    scrollFlag = false;

    partNum = 0;
    prevPartNum = -1;
    startFlag = true;

    trash = 0;

    nwkKey = '';
    savedKey = '';
    pan = 0;
    savedPan = 0;
    channel = 0;
    savedCh = 0;

    constructor(public serial: SerialService,
                public globals: GlobalsService,
                private events: EventsService,
                private ngZone: NgZone) {
        // ---
    }

    /***********************************************************************************************
     * fn          ngAfterViewInit
     *
     * brief
     *
     */
    ngAfterViewInit() {
        this.events.subscribe('readPartNumRsp', async (msg: number)=>{
            this.partNum = msg;
            if(this.viewRef){
                if(this.partNum != this.prevPartNum) {
                    this.prevPartNum = this.partNum;
                    this.viewRef.clear();
                    switch(this.partNum) {
                        /*
                        case this.globals.ZB_BRIDGE: {
                            this.viewRef.createComponent(ZB_Bridge_Component);
                            break;
                        }
                        case this.globals.HTU21D_005: {
                            this.viewRef.createComponent(HTU21D_005_Component);
                            break;
                        }
                        case this.globals.SHT40_018: {
                            this.viewRef.createComponent(SHT40_018_Component);
                            break;
                        }
                        case this.globals.SI7021_027: {
                            this.viewRef.createComponent(SI7021_027_Component);
                            break;
                        }
                        case this.globals.RKR_SW_012: {
                            this.viewRef.createComponent(RKR_SW_012_Component);
                            break;
                        }
                        case this.globals.PB_SW_023: {
                            this.viewRef.createComponent(PB_SW_023_Component);
                            break;
                        }
                        case this.globals.ACTUATOR_010: {
                            this.viewRef.createComponent(Actuator_010_Component);
                            break;
                        }
                        */
                        case this.globals.SSR_009: {
                            console.log('ssr');
                            const { SSR_009_Component } = await import('./ssr-009/ssr-009.component');
                            this.viewRef.createComponent(SSR_009_Component);
                            break;
                        }
                        /*
                        case this.globals.AQ_015: {
                            this.viewRef.createComponent(AQ_015_Component);
                            break;
                        }
                        */
                        default:
                            break;
                    }
                }
                console.log(`part number: ${this.partNum}`);
                if(this.startFlag == true) {
                    this.startFlag = false;
                    setTimeout(()=>{
                        this.readKeys();
                    }, 300);
                    setTimeout(()=>{
                        this.serial.rdNodeData_0();
                    }, 1000);
                }
            }
        });
    }

    /***********************************************************************************************
     * fn          ngOnDestroy
     *
     * brief
     *
     */
    ngOnDestroy() {
        this.serial.closeComPort();
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit() {
        window.onbeforeunload = ()=>{
            this.ngOnDestroy();
        };

        this.events.subscribe('closePort', (msg: string)=>{
            if(msg == 'close'){
                this.prevPartNum = -1;
                this.startFlag = true;
            }
        });

        this.events.subscribe('rdKeysRsp', (msg)=>{
            this.rdKeysMsg(msg);
        });

        this.events.subscribe('logMsg', (msg: gIF.msgLogs_t)=>{
            const logsLen = this.logs.length;
            const last = this.logs[logsLen - 1];
            if(logsLen && (last.id === 7) && (msg.id === 7)){
                this.ngZone.run(()=>{
                    this.logs[logsLen - 1] = msg;
                });
            }
            else {
                while(logsLen >= 20) {
                    this.logs.shift();
                }
                this.ngZone.run(()=>{
                    this.logs.push(msg);
                });
            }
            if(this.scrollFlag == true) {
                this.logList.nativeElement.scrollTop = this.logList.nativeElement.scrollHeight;
            }
        });
    }

    /***********************************************************************************************
     * fn          autoScroll
     *
     * brief
     *
     */
    autoScrollChange() {

        if(this.cbScroll.nativeElement.checked) {
            this.scrollFlag = true;
            this.logList.nativeElement.scrollTop = this.logList.nativeElement.scrollHeight;
        }
        else {
            this.scrollFlag = false;
        }
    }
    /***********************************************************************************************
     * fn          readKeys
     *
     * brief
     *
     */
    readKeys() {
        setTimeout(()=>{
            this.serial.rdKeys();
        }, 10);
    }
    /***********************************************************************************************
     * fn          rdKeysMsg
     *
     * brief
     *
     */
    rdKeysMsg(msg: gIF.rdKeys_t) {

        if(msg.status == gConst.USB_CMD_STATUS_OK) {
            console.log(`msg: ${JSON.stringify(msg)}`);

            this.nwkKey = msg.nwkKey;
            this.savedKey = this.nwkKey;
            this.nwkKeyRef.nativeElement.value = this.nwkKey;
            this.keyLabelRef.nativeElement.style.color = 'gray';

            this.pan = msg.panId;
            this.savedPan = this.pan;
            this.panRef.nativeElement.value = `${this.pan}`;
            this.panLabelRef.nativeElement.style.color = 'gray';

            this.channel = msg.nwkCh;
            this.savedCh = this.channel;
            this.channelRef.nativeElement.value = `${this.channel}`;
            this.chLabelRef.nativeElement.style.color = 'gray';
        }
    }

    /***********************************************************************************************
     * fn          openSerial
     *
     * brief
     *
     */
    openSerial() {
        this.serial.listComPorts();
    }

    /***********************************************************************************************
     * fn          closeSerial
     *
     * brief
     *
     */
    closeSerial() {
        this.serial.closeComPort();
        this.startFlag = true;
    }

    /***********************************************************************************************
     * fn          wrKeys
     *
     * brief
     *
     */
    wrKeys() {
        this.serial.wrKeys(this.nwkKey, this.pan, this.channel);
        setTimeout(()=>{
            this.serial.rdKeys();
        }, 100);
    }

    /***********************************************************************************************
     * fn          clearLogs
     *
     * brief
     *
     */
    clearLogs() {
        this.logs = [];
    }


    /***********************************************************************************************
     * @fn          onKeyChange
     *
     * @brief
     *
     */
    onKeyChange(newKey: string){

        console.log(`new key: ${newKey}`);

        const keyLen = newKey.length;
        if(newKey == '' || keyLen < this.minKeyLen) {
            return;
        }
        if(keyLen > this.maxKeyLen){
            this.nwkKeyRef.nativeElement.value = this.nwkKey;
            return;
        }
        this.nwkKey = newKey;

        if(this.nwkKey != this.savedKey){
            this.keyLabelRef.nativeElement.style.color = 'red';
        }
        else {
            this.keyLabelRef.nativeElement.style.color = 'gray';
        }
    }

    /***********************************************************************************************
     * @fn          onKeyBlur
     *
     * @brief
     *
     */
    onKeyBlur(newKey: string){

        console.log(`key blur: ${newKey}`);

        const keyLen = newKey.length;
        if(newKey == '' || (keyLen < this.minKeyLen)) {
            this.nwkKeyRef.nativeElement.value = this.nwkKey;
        }
    }

    /***********************************************************************************************
     * fn          onPanChange
     *
     * brief
     *
     */
    onPanChange(newPan: string){

        let pan = parseInt(newPan);

        if(Number.isNaN(pan) || (pan < this.minId)){
            return;
        }
        if(pan > this.maxId){
            this.panRef.nativeElement.value = `${this.pan}`;
            return;
        }
        console.log(`new pan: ${pan}`);

        this.pan = pan;
        this.panRef.nativeElement.value = `${pan}`;
        if(this.pan != this.savedPan){
            this.panLabelRef.nativeElement.style.color = 'red';
        }
        else {
            this.panLabelRef.nativeElement.style.color = 'gray';
        }
    }

    /***********************************************************************************************
     * fn          onPanBlur
     *
     * brief
     *
     */
    onPanBlur(newPan: string){

        let pan = parseInt(newPan);

        if(Number.isNaN(pan) || (pan < this.minId)){
            this.panRef.nativeElement.value = `${this.pan}`;
        }
    }
    /***********************************************************************************************
     * fn          onChChange
     *
     * brief
     *
     */
    onChChange(newCh: string){

        let ch = parseInt(newCh);

        if(Number.isNaN(ch) || (ch < this.minCh)){
            return;
        }
        if(ch > this.maxCh){
            this.channelRef.nativeElement.value = `${this.channel}`;
            return;
        }
        console.log(`new ch: ${ch}`);

        this.channel = ch;
        this.channelRef.nativeElement.value = `${ch}`;
        if(this.channel != this.savedCh){
            this.chLabelRef.nativeElement.style.color = 'red';
        }
        else {
            this.chLabelRef.nativeElement.style.color = 'gray';
        }
    }

    /***********************************************************************************************
     * fn          onChBlur
     *
     * brief
     *
     */
    onChBlur(newCh: string){

        let ch = parseInt(newCh);

        if(Number.isNaN(ch) || (ch < this.minCh)){
            this.channelRef.nativeElement.value = `${this.channel}`;
        }
    }
}
