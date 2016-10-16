import { Component, Output, EventEmitter } from '@angular/core';
//import {IONIC_DIRECTIVES} from 'ionic-angular';
// custom providers
import { MissionControl, IMissionCommand } from '../../providers/mission-control/mission-control';

@Component({
  selector: 'app-leftsidebar',
  templateUrl: 'app-leftsidebar.html',
  //directives: [IONIC_DIRECTIVES] // makes all Ionic directives available to your component
})
export class AppLeftsidebar {
  @Output() modeChangeEvt = new EventEmitter<string>();
  text;
  subscription;
  showSearch = false;
  tools = [
    { id: 0, label: 'How To', action: 'home', icon: 'ios-help-circle', show: true, active: false },
    { id: 1, label: 'Step 1 - Photos', action: 'addPhoto', icon: 'easel', show: true, active: false },
    { id: 2, label: 'Step 2 - Save', action: 'save', icon: 'checkmark-circle', show: false, active: false },
    { id: 3, label: 'Step 3 - Preview', action: 'playEditMode', icon: 'logo-youtube', show: false, active: false },
    /*{ id: 0, label: 'Stats', action: 'stats', icon: 'stats', show: true },
    { id: 0, label: 'Settings', action: 'settings', icon: 'settings', show: true },
    { id: 0, label: 'Goals', action: 'goals', icon: 'home', show: true },*/
  ];
  //commands issued to child components
  missions: IMissionCommand[] = [
    //{ cmdStr: 'showHome', payload: {} },
    { cmdStr: 'showHowTo', payload: {} },
    { cmdStr: 'showPhotoTools', payload: {} },
    { cmdStr: 'saveBoard', payload: {} },
    { cmdStr: 'playBoardEditMode', payload: { pageNum: 2 } }
  ];

  constructor(private missionService: MissionControl) {

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

  ngAfterViewInit() {
    //select step 1- Photos by default
    this.toolBtnClickH(this.tools[1]);
  }

  carryOutMission(mission: IMissionCommand) {
    console.log(`${mission} received in sideaux component`);
    return true;
  }

  announce(mission) {
    this.missionService.announceMission(mission);
  }

  toolBtnClickH(toolsItm) {
    //make all tools inactive
    this.tools.map((itm) => itm.active = false);

    //make clicked tool active
    toolsItm.active = true;

    //create mission for clicked tool and announce it
    this.missions[toolsItm.id].payload = toolsItm;
    this.announce(this.missions[toolsItm.id]);
    console.log(toolsItm);
  }
}
