import { Component } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
//import { NavController, NavParams } from 'ionic-angular';
//import { IONIC_DIRECTIVES } from 'ionic-angular';
import { BoardComponent } from '../../components/board/board';
import { Homepage } from '../../pages/home/home';
//providers
import { MissionControl, IMissionCommand } from '../../providers/mission-control/mission-control';
import { DpPersistence } from '../../providers/dp-persistence/dp-persistence';
import { DpphotosSrvc, IdpPhoto } from '../../providers/dpphotos/dpphotos';
import { BoardService } from '../../providers/board/board';
import { DCFG } from '../../providers/dpconfig/dpconfig';

@Component({
  templateUrl: 'visualize.html',
  //directives: [IONIC_DIRECTIVES, BoardComponent], // makes all Ionic directives available to your component
  //providers: [BoardService, DpPersistence, DpphotosSrvc, MissionControl]
})
export class VisualizePage {
  missionCanceled = false; //set to true to prevent congratulations alert
  appTitle = 'Big Vision Board';
  subscription;
  showBoardTitleBottom = true; //shows board title at the bottom rather than top
  showBoardTimer = false; //hide/show board timer at the bottom of the board
  public domBoardID = 'visualizeCanvas';
  public boardWidth = 0;
  public boardHeight = 0;
  //component visibility on DOM
  showHeader = true;
  showLeftsidebar = true;
  showMiddle = true;
  showFoooter = true;
  isFullScreen = false;
  showReplayBtn = false; //set to true after animation

  //commands issued to child components
  missions: IMissionCommand[] = [
    { cmdStr: 'playBoard', payload: { board: {} } }
  ];

  constructor(private router: Router, private params: Params,
    private BoardService: BoardService,
    private DataStore: DpPersistence,
    private missionService: MissionControl) {

    //subscribe to inter-component communication confirmation bus
    this.subscription = missionService.missionAnnounced$.subscribe(
      mission => {
        this.carryOutMission(mission);
      })

    //calculate board height and width
    this.boardWidth = window.innerWidth;
    this.boardHeight = window.innerHeight - 100;
    console.log('inisde visualize page boardwidth,height->', this.boardWidth, this.boardHeight)
  }

  ngOnInit() {
    console.log('inside ngoninit in visualize');
  }
  replayBtnClickH() {
    console.log('inside visualizePage replayBtnClickH');
    this.getAndPlayBoard();
  }
  ngAfterViewInit() {
    console.log('inside ngAfterViewInit in visualize');
    //this.hideNavBar();
    this.getAndPlayBoard();
    //retrieve saved boards from DB in the background
  }

  getAndPlayBoard() {
    this.showReplayBtn = false;//set back to true in carryOutMission when play complete
    //if board passed in as params play it
    /* if (this.navParams && this.navParams.data && this.navParams.data.activeBoard) {
       this.playBoard({ board: this.navParams.data.activeBoard, properties: this.navParams.data.properties });
     } else {
       this.BoardService.getFeaturedBoard(DCFG.DF.userName).subscribe(
         fb => {
           if (!fb) {
             console.log('inside visualizepage.getAndPlayBoard container not found');
             this.BoardService.doAlert(this.nav, 'Warning!!', 'Board not found or empty. Create a board or select another', () => {
               this.nav.setRoot(Homepage);
             });
             return false;
           }
           this.playBoard({ board: fb.payLoad, properties: fb.properties })
         },
         error => {
           console.log(error)
           this.BoardService.doAlert(this.nav, 'Warning!!', 'Board not found or empty. Create a board or select another', () => {
             this.nav.setRoot(Homepage);
           });
         }
       );
     }*/
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
    console.log(`${mission} received in visualize page`);
    switch (mission.cmdStr) {
      case 'playBoardComplete':
        if (!this.missionCanceled) {
          //this.BoardService.doAlert(this.nav, 'Congratulations!!', 'Visualization complete!!');
          this.showReplayBtn = true;
          //this.nav.setRoot(ListPage);
        }
        break;
      default:
        break;
    }
    return true;
  }

  playBoard(boardObj) {
    //dispatch mission so child component will playback board
    this.missions[0].payload = boardObj; //{ board: boardObj };
    this.announce(this.missions[0]);
  }

  onThumbnailClick(evt) {
    let idx: number = 0;
    this.missions[idx].payload = evt;
    this.announce(this.missions[idx]);
    console.log(evt);
  }

  //to hide nav bar on enter, show on leave or hide on scroll see https://github.com/driftyco/ionic/issues/5556
  hideNavBar() {
    let elem = document.getElementsByTagName("ion-navbar")[0];
    let hidden = elem.classList.contains("hiddennav");

    if (!hidden) elem.classList.add('hiddennav');
  }

  showNavBar() {
    let elem = document.getElementsByTagName("ion-navbar")[0];
    let hidden = elem.classList.contains("hiddennav");

    if (hidden) elem.classList.remove('hiddennav');
  }

  /* //doing this here hides nav on previuos page do in ngViewInit
  //hide nav bar when we enter the page
    onPageDidEnter() {
        this.hideNavBar();
    }

//show nav bar when we leave the page
    

    ionViewDidEnter(){
      this.hideNavBar();
    }
*/

  //when leaving page make sure animation is stopped
  onPageDidLeave() {
    //this.showNavBar();
    this.announceSharedMission(this.missionService.missions.stopBoardAnim.cmdStr, {});
  }

  homeBtnClickH() {
    this.missionCanceled = true;
    this.announceSharedMission(this.missionService.missions.stopBoardAnim.cmdStr, {});
    //this.nav.setRoot(Homepage, {});
    this.router.navigate(['/Homepage']);
  }


}
