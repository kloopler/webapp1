// TODO
// allow users to enter name and description for the board they are saving then store the YMD so can display on disc
// show popup to that allows users to enter name and description of board when they hit save
import { Component } from '@angular/core';
//import {NavController, NavParams} from 'ionic-angular';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { VisualizePage } from '../../pages/visualize/visualize';
import { Homepage } from '../../pages/home/home';

//providers
import { MissionControl, IMissionCommand } from '../../providers/mission-control/mission-control';
import { DpPersistence } from '../../providers/dp-persistence/dp-persistence';
import { DpphotosSrvc, IdpPhoto } from '../../providers/dpphotos/dpphotos';

//main layout components
import { AppHeader } from '../../components/app-header/app-header';
import { AppLeftsidebar } from '../../components/app-leftsidebar/app-leftsidebar';
import { AppLeftsideaux } from '../../components/app-leftsideaux/app-leftsideaux';
import { AppMiddle } from '../../components/app-middle/app-middle';
import { AppFooter } from '../../components/app-footer/app-footer';
//import {TestDelete} from '../../components/test-delete/test-delete';

@Component({
  templateUrl: 'create.html',
  //directives: [AppHeader, AppLeftsidebar, AppLeftsideaux, AppMiddle, AppFooter, TestDelete],
  //providers: [DpPersistence, DpphotosSrvc, MissionControl]
})

export class CreatePage {
  appTitle = 'Big Vision Board';
  subscription;
  //component visibility on DOM
  showHeader = true;
  showLeftsidebar = true;
  showMiddle = true;
  showFoooter = true;
  isFullScreen = false;

  constructor(private router: Router, private params: Params,
    private missionService: MissionControl) {
    //subscribe to inter-component communication confirmation bus
    missionService.missionConfirmed$.subscribe(
      responder => {
        console.log(`${responder} confirmed the mission`);
      });

    //subscribe to inter-component communication confirmation bus
    this.subscription = missionService.missionAnnounced$.subscribe(
      mission => {
        this.carryOutMission(mission);
      });
  }

  announceSharedMission(missionStr, payload) {
    this.missionService.announceSharedMission(missionStr, payload);
  }

  ngAfterViewInit() {
    console.log('inside ngAfterViewInit in create page');
    //this.viewerMode();
    /*if (this.navParams && this.navParams.data && this.navParams.data.activeBoard) {
      let payLoad = { board: this.navParams.data.activeBoard, properties: this.navParams.data.properties };
      if (this.navParams.data.action === 'edit') {
        this.missionService.announceSharedMission('editBoard', payLoad);
      }
    }*/
  }


  //TODO wanted to present user with save confirmation when they leave page with unsaved changes
  //settling on partial implementation instead where save confirmation comes up when home fab button used 
  //but not hamburger menu because can't figure out how to deley/cancel page lifecycle events'
  ionViewWillLeave() {
    console.log('inside create page ionViewWillLeave');
    //since no direct handle on the board just allways tell it to save
    this.announceSharedMission(this.missionService.missions.saveBoard, { reason: 'pageChange' });

  }

  viewerMode() {
    this.uiModeChanger([false, false, false, false, true]);
  }

  creatorMode() {
    this.uiModeChanger([true, true, true, true, false]);
  }

  uiModeChanger(opts: Array<boolean>) {
    this.showHeader = opts[0];
    this.showLeftsidebar = opts[0];;
    this.showMiddle = opts[0];;
    this.showFoooter = opts[0];;
    this.isFullScreen = opts[0];;
  }

  announce(mission) {
    this.missionService.announceMission(mission);
  }

  //only carries out missions it is capable of and ignores the rest
  carryOutMission(mission: IMissionCommand) {
    let that = this;
    console.log(`${mission} received in create page`);
    switch (mission.cmdStr) {
      case 'playBoardEditMode':
        //this.viewerMode();
        break;
      case 'playBoardComplete':
        //this.ngAfterViewInit();
        break;
      case 'playBoard':
        //this.nav.setRoot(VisualizePage, { activeBoard: 'TODO' });
        this.router.navigate(['/VisualizePage']);
        break;
      default:
        break;
    }
    return true;
  }

  onThumbnailClick(evt) {
    this.missionService.announceSharedMission('thumbnailClicked', evt);
    console.log(evt);
  }

  //when leaving page make sure animation is stopped
  onPageDidLeave() {
    //this.showNavBar();
    this.announceSharedMission(this.missionService.missions.stopBoardAnim.cmdStr, {});
  }
}
