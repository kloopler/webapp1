import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import { Subject }    from 'rxjs/Subject';
// Explicit import of 'Observable' so that '.d.ts' files
// can be generated correctly.
//ref - http://stackoverflow.com/questions/35193072/typescript-errors-when-setting-declaration-to-true
import { Observable } from "rxjs/Observable";


export interface IMissionCommand {
  cmdStr: string,
  payload: any
};

@Injectable()
export class MissionControl {
  globals:any={
    isBoardDirty:false
  };
  data: any = null;
  public missions = {
    thumbnailClicked:{ cmdStr: 'thumbnailClicked', payload: {} },
    showHome: { cmdStr: 'showHome', payload: {} },
    showHowTo: { cmdStr: 'showHowTo', payload: {} },
    showPhotoTools: { cmdStr: 'showPhotoTools', payload: {} },
    saveBoard: { cmdStr: 'saveBoard', payload: {} },
    editBoard: { cmdStr: 'editBoard', payload: {} },
    deleteBoard: { cmdStr: 'deleteBoard', payload: {} },
    playBoard: { cmdStr: 'playBoard', payload: {} },
    playBoardComplete: { cmdStr: 'playBoardComplete', payload: {} },
    stopBoardAnim: { cmdStr: 'stopBoardAnim', payload: {} },
    addUserFileViaDialog:{ cmdStr: 'addUserFileViaDialog', payload: {} },
    saveBoardAndExit:{ cmdStr: 'saveBoardAndExit', payload: {} }
  };


  // Observable string sources
  private missionAnnouncedSource = new Subject<IMissionCommand>(); //for requesting actions
  private missionConfirmedSource = new Subject<IMissionCommand>(); //for confirm when requested action completed

  // Observable string streams
  missionAnnounced$ = this.missionAnnouncedSource.asObservable();
  missionConfirmed$ = this.missionConfirmedSource.asObservable();

  // Service message commands
  announceMission(mission: IMissionCommand) {
    this.missionAnnouncedSource.next(mission)
  }
  announceSharedMission(missionStr, payload) {
    let mission = this.missions[missionStr];
    mission.payload = payload;
    this.announceMission(mission);
  }
  confirmMission(responder: IMissionCommand) {
    this.missionConfirmedSource.next(responder);
  }
  setGlobal(key,value){
    this.globals[key]=value;
  }
  getGlobal(key){
    if(this.globals[key] !== undefined){
      return this.globals[key]
    }else{
      return undefined
    }
  }

  constructor(public http: Http) {

  }
}

