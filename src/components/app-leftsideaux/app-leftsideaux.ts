import { Component, Input, Output, EventEmitter } from '@angular/core';
//import {IONIC_DIRECTIVES} from 'ionic-angular';
import { DpphotosSrvc, IdpPhoto } from '../../providers/dpphotos/dpphotos';
import { MissionControl, IMissionCommand } from '../../providers/mission-control/mission-control';
//import {Dragula, DragulaService} from "../../../node_modules/ng2-dragula/ng2-dragula"
//import {Fileupload} from '../fileupload/fileupload';
//import {IdpPhoto} from "../../providers/dpphotos/dpphotos"

@Component({
  selector: 'app-leftsideaux',
  templateUrl: 'app-leftsideaux.html',
  /*directives: [IONIC_DIRECTIVES, Dragula], // makes all Ionic directives available to your component
  viewProviders: [DragulaService],
  providers: [DpphotosSrvc, DragulaService]*/
  //directives: [IONIC_DIRECTIVES], // makes all Ionic directives available to your component
  //providers: [DpphotosSrvc]
})


export class AppLeftsideaux {
  @Input() showSearch;
  @Output() thumbnailClickEvt = new EventEmitter<IdpPhoto>();
  text;
  subscription;
  showHowTo = true;
  showPhotosTools = false;
  showTextTools = false;
  thumbs: IdpPhoto[] = [];
  tools = [
    { id: 0, label: 'Home', action: 'home', icon: 'home', show: true },
    { id: 0, label: 'Show', action: 'show', icon: 'easel', show: true },
    { id: 1, label: 'Create', action: 'create', icon: 'list', show: true },
    { id: 2, label: 'Edit', action: 'edit', icon: 'checkmark-circle', show: true },
    { id: 0, label: 'Stats', action: 'stats', icon: 'stats', show: true },
    { id: 0, label: 'Settings', action: 'settings', icon: 'settings', show: true },
    { id: 0, label: 'Goals', action: 'goals', icon: 'home', show: true },
  ];

  constructor(
    private PhotoSrvc: DpphotosSrvc,
    private missionService: MissionControl) {
    this.text = 'Hello World from leftsidebar';

    /*PhotoSrvc.getData().then(
      x=>this.thumbs = x,
      err=>console.log('an error occured')
    );*/
    PhotoSrvc.getAppBundledImgDataFromJSON().subscribe(
      x => {
        this.thumbs = x
      },
      err => {
        console.log('An error occured while trying to fetch photos')
      }
    )

    //subscribe to inter-component communication confirmation bus
    this.subscription = missionService.missionAnnounced$.subscribe(
      mission => {
        this.carryOutMission(mission);
      })
  }

  private onDropModel(args) {
    let [el, target, source] = args;
    // do something else
  }

  private onRemoveModel(args) {
    let [el, source] = args;
    // do something else
  }

  private loadImages() {
    console.log('inside loadImages');
    //announce mission to call electron render to show file dialog and allow person to load images
    this.announce(this.missionService.missions.addUserFileViaDialog);
  }

  private announce(mission) {
    this.missionService.announceMission(mission);
  }

  private carryOutMission(mission: IMissionCommand) {
    let that = this;
    console.log(`${mission} received in sideaux component`);
    switch (mission.cmdStr) {
      case 'showHowTo':
        this.showHowToH();
        break;
      case 'showPhotoTools':
        this.showPhotosToolsH();
        break;
      case 'showTextTools':
        this.showTextToolsH();
        break;
      /*case 'saveBoard':
        //this.saveBoardH();
        break;*/
      case 'playBoard':
        this.showTextToolsH();
        break;
      default:
        break;
    }
    return true;
  }

  //handler for when thumbnail clicked. Starts process of 
  //placining clicked image on the boards canvas
  thumbnailClickEvtH(thumb: IdpPhoto) {
    this.thumbnailClickEvt.next(thumb);
    console.log(thumb);
  }
  showHowToH() {
    console.log('inside showHowToH');
    this.showHowTo = true;
    this.showPhotosTools = false;
    this.showTextTools = false;
  }

  showTextToolsH() {
    this.showHowTo = false;
    this.showPhotosTools = false;
    this.showTextTools = !this.showPhotosTools;
  }
  showPhotosToolsH() {
    console.log('inside showPhotosToolsH');
    this.showHowTo = false;
    this.showPhotosTools = true;
    this.showTextTools = !this.showPhotosTools;
  }

  toolBtnClickH(toolsItm) {
    if (toolsItm && toolsItm.action === 'show') {
      this.changeMode('fullScreen');
    }
    console.log('in leftsidebar toolBtnClickH->', toolsItm);
  };
  changeMode(newMode) {
    this.thumbnailClickEvt.next(newMode);
    console.log(this, newMode);
  };

}
