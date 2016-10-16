import { Component, Output, EventEmitter } from '@angular/core';
import { AlertController, NavController, NavParams } from 'ionic-angular';
//import {IONIC_DIRECTIVES} from 'ionic-angular';
import { BoardComponent } from '../board/board';
import { Dropzone } from '../dropzone/dropzone';
import { ListPage } from '../../pages/list/list';

//providers
import { MissionControl, IMissionCommand } from '../../providers/mission-control/mission-control';

@Component({
  selector: 'app-middle',
  templateUrl: 'app-middle.html',
  //directives: [IONIC_DIRECTIVES, BoardComponent, Dropzone], // makes all Ionic directives available to your component
  //providers: [DpPersistence,DpphotosSrvc,MissionControl]
})
export class AppMiddle {
  subscription;
  @Output() modeChangeEvt = new EventEmitter<string>();
  text;
  inPreviewMode = false;
  public domBoardID = 'fabriccanvas';
  public boardWidth = 0;
  public boardHeight = 0;
  public showBoardTimer = false;

  constructor(private nav: NavController,
    private alertCtrlr: AlertController,
    private navParams: NavParams,
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
      }
    );

    //calculate board height and width
    this.boardWidth = 680; //window.innerWidth;
    this.boardHeight = 500; //window.innerHeight - 180;
  }

  announceSharedMission(missionStr, payload) {
    this.missionService.announceSharedMission(missionStr, payload);
  }

  //only carries out missions it is capable of and ignores the rest
  carryOutMission(mission: IMissionCommand) {
    let that = this;
    switch (mission.cmdStr) {
      case 'playBoardEditMode':
        that.inPreviewMode = true;
        break;
      default:
        break;
    }
    return true;
  }

  changeMode(newMode) {
    this.modeChangeEvt.next(newMode);
    console.log(this, newMode);
  };

  homeBtnClickH() {
    //this.nav.setRoot(ListPage, {});
    //if(board)
    let flag = this.missionService.getGlobal('isBoardDirty');
    if (flag) {
      this.showSaveConfirmationPrompt()
    } else {
      this.nav.setRoot(ListPage, {});
    }
  }

  abortAnimBtnClickH() {
    this.announceSharedMission(this.missionService.missions.stopBoardAnim.cmdStr, {});
    this.inPreviewMode = false;
  }


  showSaveConfirmationPrompt() {
    let that = this;
    let prompt = this.alertCtrlr.create({
      title: 'Save Changes',
      message: "Do you want to save your changes?",

      buttons: [
        {
          text: 'Yes, Save',
          handler: data => {
            console.log('Saved clicked');
            let navTransition = prompt.dismiss();
            navTransition.then(
              () => that.announceSharedMission('saveBoardAndExit', {}),//transition success function
              () => console.log('dimiss actionsheet transition failed')//transition fail fxn
            );
            /*//TODO replace sleep hack 
            setTimeout(function () {
              that.nav.setRoot(ListPage, {});
            }, 1000)*/
          }
        },
        {
          text: "No, Don't Save",
          handler: data => {
            console.log('Cancel clicked');
            that.nav.setRoot(ListPage, {});
          }
        }

      ]
    });
    prompt.present();
  }

}
