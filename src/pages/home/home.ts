//import { NavController, NavParams, ActionSheetController, Platform } from 'ionic-angular';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Component, ChangeDetectorRef } from '@angular/core';
//import * as _ from 'lodash';
import { VisualizePage } from '../../pages/visualize/visualize';
import { CreatePage } from '../../pages/create/create';
import { BoardListcard } from '../../components/board-listcard/board-listcard';
//providers
import { Login } from '../../pages/login/login';
import { Authservice } from '../../providers/authservice';
import { BoardService } from '../../providers/board/board';
import { DpDataModel } from '../../providers/dp-persistence/dp-datamodel';
import { DCFG } from '../../providers/dpconfig/dpconfig';
import { MissionControl, IMissionCommand } from '../../providers/mission-control/mission-control';

//declare var lodash: any;

interface Quote {
  text: string,
  attrib?: string,
  author?: string,
  citeLink?: string,
  authorImg?: string
}

@Component({
  selector: 'page-homepage',
  templateUrl: 'home.html'
})
export class Homepage {
  appTitle = 'Big Vision Board';
  logoSrc = 'assets/img/logo.png'
  private quote: Quote = {
    text: 'What the mind can conceive and believe, the mind can achieve',
    attrib: 'Napolean Hill',
    author: 'Napolean Hill',
    authorImg: 'img/2.jpg'
  };

  subscription;

  //TODO refactor below and send to BoardService
  boardCount = 0;
  userBoardCount = 0;
  sampleBoardCount = 0;
  logs: Array<DpDataModel>; //holds all boards
  userBoards: Array<DpDataModel>; //holds all user boards
  sampleBoards: Array<DpDataModel>;//holds all sample boards
  //end TODO

  selectedItem: any;
  icons: string[];
  items: Array<{ title: string, note: string, icon: string }>;

  constructor(
    public authData: Authservice,
    private ChngDetector: ChangeDetectorRef, private router: Router, private params: Params,
    private BoardService: BoardService,
    private missionService: MissionControl) {
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

  }
  announce(mission) {
    this.missionService.announceMission(mission);
  }
  announceSharedMission(missionStr, payload) {
    this.missionService.announceSharedMission(missionStr, payload);
  }

  //only carries out missions it is capable of and ignores the rest
  carryOutMission(mission: IMissionCommand) {
    let that = this;
    console.log(`${mission} received in list page`);
    switch (mission.cmdStr) {
      case 'playBoard':
        console.log('playBoard received in ListPage and ignored');
        break;
      default:
        break;
    }

    return true;
  }
  createFirstBoard() {
    //alert('createFirstBoard clicked');
    this.router.navigate(['/CreatePage']);
    //this.nav.setRoot(CreatePage, { activeBoard: {}, action: 'createFirstBoard', properties: {} });
  }
  viewItem(itm) {
    this.router.navigate(['/VisualizePage']);
    //this.nav.setRoot(VisualizePage, { activeBoard: itm.payLoad, properties: itm.properties });
  }
  editItem(itm) {
    this.router.navigate(['/CreatePage']);
    //this.nav.setRoot(CreatePage, { activeBoard: itm.payLoad, action: 'edit', properties: itm.properties });
  }
  deleteItm(itm) {
    let that = this;
    /*this.BoardService.showConfirmAlert(this.nav,
      'Are You Sure?',
      'Do you really want to delete this board? This action cannot be undone',
      'Yes Delete',
      "No",
      () => {
        let obs = this.BoardService.deleteItem(itm);
        obs.subscribe(
          success => {
            console.log('sucess');
            //TODO use lodash to delete itm from logs instead of reloading all boards
            this.getSavedBoards()
          },
          err => console.log('err'),
          () => console.log('complete')
        );
      },
      () => console.log('delete confirmation canceled')
    )*/
  }

  openMenu(itm) {
    let that = this;
    /*let actionSheet = this.actionSheetCtrl.create({
      title: 'What do you want to do with this board?',
      cssClass: 'action-sheets-basic-page',
      buttons: [
        {
          text: 'Play',
          icon: !this.platform.is('ios') ? 'arrow-dropright-circle' : null,
          handler: () => {
            console.log('Play clicked');
            this.viewItem(itm);
          }
        },
        {
          text: 'Edit',
          //role: 'destructive',
          icon: !this.platform.is('ios') ? 'create' : null,
          handler: () => {

            console.log('Edit clicked');
            let navTransition = actionSheet.dismiss();
            navTransition.then(
              () => {
                //that.nav.pop();
                that.editItem(itm)
                //that.nav.pop();
              },//transition success function
              () => console.log('dimiss actionsheet transition failed')
            );
            //this.editItem(itm);
          }
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: !this.platform.is('ios') ? 'trash' : null,
          handler: () => {
            console.log('Delete clicked');
            let navTransition = actionSheet.dismiss();
            navTransition.then(
              () => this.deleteItm(itm),//transition success function
              () => console.log('dimiss actionsheet transition failed'));//transition fail fxn
          }
        },
        {
          text: 'Cancel',
          role: 'cancel', // will always sort to be on the bottom
          icon: !this.platform.is('ios') ? 'close' : null,
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });

    actionSheet.present(actionSheet);*/
  }

  //important to sort boards by last used cause home page displays last used as logs[0]
  ngAfterViewInit() {
    console.log('inside listPage ngAfterViewInit');
    //1. create default boards if already created will return quickly
    let defBoardObs = this.BoardService.createDefaultBoards();
    defBoardObs.subscribe(
      success => {
        console.log('inside listPage ngAfterViewInit createDefaultBoards 1 board created')
      },
      err => {
        console.log('inside listPage ngAfterViewInit createDefaultBoards error')
        this.getSavedBoards();
      },
      () => {
        console.log('inside listPage ngAfterViewInit createDefaultBoards completed: all boards created ')
        this.BoardService.defaultBoardsCreated = true;
        this.getSavedBoards()
      }
    );

  }

  ionViewDidLoad() {
    console.log('Hello Homepage Page');
  }

  ionViewWillLeave() {
    console.log('inside list component ionViewWillLeave');

  }

  getSavedBoards() {
    let obs = this.BoardService.getBoards(DCFG.DF.userName);
    obs.subscribe(
      success => {
        console.log('inside listPage getBoards success');
        this.logs = success.logs
        this.boardCount = success.logs.length;
        this.sampleBoards = success.sampleBoards
        this.sampleBoardCount = success.sampleBoards.length;
        this.userBoards = success.userBoards
        this.userBoardCount = success.userBoards.length
        this.ChngDetector.detectChanges();
      },
      err => console.log('inside listPage getBoards error'),
      () => console.log('inside listPage getBoards  completed')
    );
  }

  itemTapped(event, item) {
    this.openMenu(item);
    /*this.nav.push(ListPage, {
      item: item
    });*/
  }
}

