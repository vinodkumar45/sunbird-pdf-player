import { Component, OnInit } from '@angular/core';
import { SunbirdPdfPlayerService } from '../sunbird-pdf-player.service';

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  constructor(public pdfPlayerService: SunbirdPdfPlayerService) { }

  ngOnInit() {
  }

  OpenCloseNav() {
    const inputChecked = document.getElementById('overlay-input') as HTMLInputElement;
    if (inputChecked.checked === true) {
      document.getElementById('pdfPlayerSideMenu').style.width = '100%';
      document.getElementById('pdfPlayerSideMenu').style.marginLeft = '0';
      this.pdfPlayerService.raiseHeartBeatEvent('OPEN_MENU');
    } else {
      document.getElementById('pdfPlayerSideMenu').style.marginLeft = '-100%';
      this.pdfPlayerService.raiseHeartBeatEvent('CLOSE_MENU');
    }
    // document.getElementById('pdfPlayerSideMenu').style.marginLeft = '-100%';
    // document.getElementById('pdfPlayerSideMenu').style.width = '0';
    // document.getElementById('sbPdfPlayerContainer').style.backgroundColor = 'white';
    // this.pdfPlayerService.raiseHeartBeatEvent('CLOSE_MENU');
  }

  openPdfDownloadPopup() {
    this.pdfPlayerService.showDownloadPopup = true;
    this.pdfPlayerService.raiseHeartBeatEvent('DOWNLOAD_MENU');
  }

}
