import { Injectable, EventEmitter } from '@angular/core';
import {CsTelemetryModule} from '@project-sunbird/client-services/telemetry';
import {  PlayerConfig } from './playerInterfaces';
import { PdfLoadedEvent } from 'ngx-extended-pdf-viewer';
@Injectable({
  providedIn: 'root'
})
export class SunbirdPdfPlayerService {

  private version = '1.0';
  public zoom = 'auto';
  public rotation = 0;
  public playerEvent = new EventEmitter<any>();
  public contentName: string;
  public loadingProgress: number;
  public showDownloadPopup: boolean;
  public src: string;
  public userName: string;
  private metaData: any;
  private contentSessionId: string;
  private playSessionId: string;
  private telemetryObject: any;
  currentPagePointer: number;
  totalNumberOfPages: number;
  pdfPlayerStartTime: number;
  pdfLastPageTime: number;

  defaultConfig = {
    showPropertiesButton: false,
    textLayer: true,
    showHandToolButton: false,
    useBrowserLocale: true,
    showBookmarkButton: false,
    showBorders: true,
    startFromPage: 1,
    contextMenuAllowed: false,
    showSidebarButton: false,
    showFindButton: false,
    showPagingButtons: false,
    showZoomButtons: false,
    showPresentationModeButton: false,
    showPrintButton: false,
    showDownloadButton: false,
    showSecondaryToolbarButton: false,
    showRotateButton: false,
    showScrollingButton: false,
    showSpreadButton: false,
    backgroundColor: '#FFFFFF',
    height: '100%',
    zoom: this.zoom,
    rotation: this.rotation
  };

  constructor() {
    this.contentSessionId = this.uniqueId();
  }

  init({ context, config, metadata}: PlayerConfig, replay= false) {
    this.playSessionId = this.uniqueId();
    let cdata = context.cdata;
    if (!replay) {
      cdata = [...cdata, ...[{id: this.contentSessionId, type: 'ContentSession'},
      {id: this.playSessionId, type: 'PlaySession'}]];
    }
    if (!CsTelemetryModule.instance.isInitialised) {
      CsTelemetryModule.instance.init({});
      CsTelemetryModule.instance.telemetryService.initTelemetry(
        {
          config: {
            pdata: context.pdata,
            env: 'ContentPlayer',
            channel: context.channel,
            did: context.did,
            authtoken: context.authToken || '',
            uid: context.uid || '',
            sid: context.sid,
            batchsize: 20,
            mode: context.mode,
            host: context.host || '',
            endpoint: context.endpoint || 'data/v3/telemetry',
            tags: context.tags,
            cdata
          },
          userOrgDetails: {}
        }
      );
    }
    this.pdfPlayerStartTime = this.pdfLastPageTime = new Date().getTime();
    this.totalNumberOfPages = 0;
    this.currentPagePointer = (config && config.startFromPage ) || 1;
    this.contentName = metadata.name;
    this.src = metadata.artifactUrl;
    this.userName = context.userData ? `${context.userData.firstName} ${context.userData.lastName}` : '';
    this.metaData = {
      pagesHistory: [],
      totalPages: 0,
      duration: [],
      zoom: [],
      rotation: []
    };
    this.loadingProgress = 0;
    this.showDownloadPopup = false;
    this.rotation = 0;
    this.zoom = 'auto';
    this.telemetryObject = {
        id: metadata.identifier,
        type: 'Content', ver: metadata.pkgVersion + '',
        rollup: context.objectRollup || {}
      };
  }

  public pageSessionUpdate() {
    this.metaData.pagesHistory.push(this.currentPagePointer);
    this.metaData.duration.push(new Date().getTime() - this.pdfLastPageTime);
    this.metaData.zoom.push(this.zoom);
    this.metaData.rotation.push(this.rotation);
    this.pdfLastPageTime = new Date().getTime();
  }

  raiseStartEvent(event: PdfLoadedEvent) {
    this.currentPagePointer = this.currentPagePointer > event.pagesCount ? 1 : this.currentPagePointer,
    this.metaData.totalPages = event.pagesCount;
    const duration = new Date().getTime() - this.pdfPlayerStartTime;
    const startEvent =  {
      eid: 'START',
      ver: this.version,
      edata: {
        type: 'START',
        currentPage: this.currentPagePointer,
        duration
      },
      metaData: this.metaData
    };
    this.playerEvent.emit(startEvent);
    CsTelemetryModule.instance.telemetryService.raiseStartTelemetry(
      { options: {
        object: this.telemetryObject
      }, edata: {type: 'content', mode: 'play', pageid: '', duration}}
      );
    this.pdfLastPageTime = this.pdfPlayerStartTime = new Date().getTime();
  }

  raiseEndEvent() {
   const endEvent =  {
      eid: 'END',
      ver: this.version,
      edata: {
        type: 'END',
        currentPage: this.currentPagePointer,
        totalPages: this.totalNumberOfPages,
        duration: new Date().getTime() - this.pdfPlayerStartTime
      },
      metaData: this.metaData
    };
   const summery = {}; // TODO: add the summery info here
   this.playerEvent.emit(endEvent);
   CsTelemetryModule.instance.playerTelemetryService.onEndEvent(endEvent, summery);
  }

  raiseErrorEvent(error: Error) {
    const errorEvent =       {
      eid: 'ERROR',
      ver: this.version,
      edata: {
        type: 'ERROR',
        stacktrace: error ? error.toString() : undefined
      },
      metaData: this.metaData
    };
    this.playerEvent.emit(errorEvent);
    CsTelemetryModule.instance.playerTelemetryService.onErrorEvent(errorEvent, {});
  }

  raiseHeartBeatEvent(type: string) {
    const hearBeatEvent =  {
      eid: 'HEARTBEAT',
      ver: this.version,
      edata: {
        type,
        currentPage: this.currentPagePointer
      },
      metaData: this.metaData
    };
    this.playerEvent.emit(hearBeatEvent);
    CsTelemetryModule.instance.playerTelemetryService.onHeartBeatEvent(hearBeatEvent, {});

  }

  public getTimeSpentForUI() {
    const duration = new Date().getTime() - this.pdfPlayerStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Number(((duration % 60000) / 1000).toFixed(0));
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }

  private  uniqueId(length = 32 ) {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
}
