

//drag drop libs and tuts
//http://ng2-uploader.com
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { ViewChild, ElementRef } from "@angular/core";
import { AfterViewInit } from "@angular/core";
//import {IONIC_DIRECTIVES} from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { BoardService } from '../../providers/board/board';
import { TileComponent } from '../tile-component/tile-component';
import { Homepage } from '../../pages/home/home';

//providers
import { DCFG } from '../../providers/dpconfig/dpconfig';
import { DpphotosSrvc, IdpPhoto } from '../../providers/dpphotos/dpphotos';
import { MissionControl, IMissionCommand } from '../../providers/mission-control/mission-control';
//import { AlertController, NavController } from 'ionic-angular';
import * as moment from 'moment';
//electron render code
import { ElectronRenderer } from '../../providers/electron-renderer/electron-renderer'
//let canvas;

declare var fabric: any;



let defaultBoadTitle = 'Untitled Board';
@Component({
    selector: 'board',
    templateUrl: 'board.html',
    //directives: [IONIC_DIRECTIVES, TileComponent], // makes all Ionic directives available to your component
    //providers: [BoardService]
})

export class BoardComponent {
    @ViewChild('myFabricCanvasRef') myFabricCanvasRef: ElementRef;
    dragdropimages: Array<Object> = [];
    clsDragOverActive = false;
    boardTBInterval = 0; //handle for settimeout used to autohide boardTB
    boardTBAutoHideDelaySecs = 4; //delay for clearing board item selection to autohide board toolbar
    /* begin TODO settings */
    secondsPerTile = 30;
    boardTimer = 0;
    boardTimerStr = '';
    //showBoardTimer = false;

    shouldExitAfterOp = false; //TODO hack replace later
    /* end settings */
    text;
    isEditMode;
    subscription;
    userName;
    //boardProps;
    @Input() domBoardID: string;
    @Input() boardWidth: number;
    @Input() boardHeight: number;
    @Input() tileText: string;
    @Input() showBoardTimer: string;
    hideTBTextarea: boolean = true; //toggles tb textarea

    boardCanvas;
    prevBboardCanvas;
    boardTB = {
        left: 0,
        top: 200,
        hmargin: -40,
        vmargin: 50,
        show: false,
        activeObject: null
    };
    properties = {
        dateTimeCreated: new Date,
        dateTimeUsed: new Date,
        createdBy: '',
        title: defaultBoadTitle,
        boardDescription: '',
        tileTitles: '',
        lastModified: new Date,
        lastViewed: new Date,
        userName: DCFG.DF.userName,
        countViews: 0,
        defaultCanvasImgWidth: 200
    };

    defaultCanvasOptions = {
        backgroundColor: 'rgb(200,200,200,0)',
        selectionColor: 'blue',
        selectionLineWidth: 2
    };

    // @ViewChild("fabriccanvas") myCanvas;


    constructor(private router: Router, private params: Params,
        private er: ElectronRenderer,
        private engine: BoardService,
        private missionService: MissionControl,
        private cdr: ChangeDetectorRef) {

        this.shouldExitAfterOp = false;

        console.log('Hello World from Board Component');
        this.userName = DCFG.DF.userName;

        //subscribe to inter-component communication confirmation bus
        this.subscription = missionService.missionAnnounced$.subscribe(
            mission => {
                this.carryOutMission(mission);
            })
    }

    //add user files to the board either via dragdrop or file dialog
    addUserFileViaDialog() {
        let that = this;
        let obs = this.er.showDialogToLoadUserFile();
        obs.subscribe(
            x => {
                console.log('inside board component addUserFileViaDialog success about to call addUserFile')
                that.addUserFile(x).subscribe(
                    y => console.log('inside board component addUserFileViaDialog success addUserFile also success'),
                    err => console.log('inside board component addUserFileViaDialog err=>', err),
                    () => console.log('inside board component addUserFileViaDialog complete')
                )
            },
            err => console.log('inside board component addUserFileViaDialog err=>', err),
            () => console.log('inside board component addUserFileViaDialog complete')
        )
    }

    //add user files to the board either via dragdrop or file dialog
    addUserFile(files, pos = {}) {
        let that = this;
        let obs = this.er.onDragDropImage(files, pos);
        obs.subscribe(
            x => {
                console.log('inside board component handleDrop success')
                let photo: IdpPhoto = { id: 0, url: '' };
                photo.url = x;
                that.addImageToCanvas(photo);
                this.clsDragOverActive = false;
                return false;
            },
            err => console.log('inside board component handleDrop err=>', err),
            () => console.log('inside board component handleDrop complete')
        )
        return obs;
    }

    handleDrop(e, pos) {
        console.log('inside board component handleDrop');
        var files: File = e.dataTransfer.files;

        this.missionService.setGlobal('isBoardDirty', true);
        this.addUserFile(files);
        /*
                var that = this;
                let obs = this.er.onDragDropImage(files, pos)
                obs.subscribe(
                    x => {
                        console.log('inside board component handleDrop success')
                        let photo: IdpPhoto = { id: 0, url: '' };
                        photo.url = x;
                        that.addImageToCanvas(photo);
                        this.clsDragOverActive = false;
                        return false;
                    },
                    err => console.log('inside board component handleDrop err=>', err),
                    () => console.log('inside board component handleDrop complete')
                )*/
    }

    dragover() {
        this.clsDragOverActive = true;
    }
    dragenter() {
        //this.clsDragOverActive = true;
    }
    dragleave() {
        this.clsDragOverActive = false;
    }

    imageStats() {
        let sizes: Array<number> = [];
        let totalSize: number = 0;
        this.dragdropimages.forEach((image: File) => sizes.push(image.size));

        sizes.forEach((size: number) => totalSize += size);

        return {
            size: totalSize,
            count: this.dragdropimages.length
        }

    }

    resetBoardTBAutoHide(delaySecs: number = this.boardTBAutoHideDelaySecs) {

        clearTimeout(this.boardTBInterval);
        this.boardTBInterval = setTimeout(() => {
            this.boardTB.show = false;
            this.hideTBTextarea = true;
            this.boardCanvas.deactivateAll().renderAll();
        }, delaySecs * 1000);
    }

    moveBoardToolBarIntoPlace(activeObject) {
        this.boardTB.show = true;
        this.boardTB.left = activeObject.get('left') + this.boardTB.vmargin;
        this.boardTB.top = activeObject.get('top') + this.boardTB.hmargin;
        activeObject.setOpacity(1);
        console.log(this.boardTB.left, this.boardTB.top);
        this.resetBoardTBAutoHide()
    }

    ngAfterViewInit() {
        console.log('inside boardComponent ngAfterViewInit');
        this.shouldExitAfterOp = false;

        //setup fabric
        this.boardCanvas = new fabric.Canvas(this.domBoardID, this.defaultCanvasOptions);
        let canvas = this.boardCanvas; //easier to type and paste code
        this.boardCanvas.backgroundColor = 'rgba(200,200,200,0)';

        //DO NOT DELETE
        //set height and width
        let cw = this.boardWidth || this.myFabricCanvasRef.nativeElement.offsetHeight;
        let ch = this.boardHeight || this.myFabricCanvasRef.nativeElement.offsetWidth;
        canvas.setHeight(ch);
        canvas.setWidth(cw);
        canvas.renderAll();

        //this.cdr.detectChanges();
        //this.defaultCanvasOptions.animationOptions.canvas = this.boardCanvas

        //set up fabric events
        canvas.on('object:moving', (e) => {
            this.boardTB.activeObject = e.target;
            this.moveBoardToolBarIntoPlace(this.boardTB.activeObject);
            this.missionService.setGlobal('isBoardDirty', true);
        });

        canvas.on('object:selected', (e) => {
            this.boardTB.activeObject = e.target;
            this.hideTBTextarea = true;
            this.moveBoardToolBarIntoPlace(this.boardTB.activeObject);
            this.resetBoardTBAutoHide()
        });

        canvas.on('selection:cleared', (e) => {
            console.log('selection cleared');
            this.boardTB.show = false;
            this.boardTB.activeObject = null;
        });

    }
    announce(mission) {
        this.missionService.announceMission(mission);
    }

    carryOutMission(mission: IMissionCommand) {
        let that = this;
        console.log(`${mission} received in boad component`);
        switch (mission.cmdStr) {
            case 'thumbnailClicked':
                that.addImageToCanvas(mission.payload);
                break;
            case 'saveBoard':
                this.saveActiveBoard();
                break;
            case 'saveBoardAndExit':
                this.shouldExitAfterOp = true;
                this.saveActiveBoard();
                break;
            case 'playBoard':
                this.playBoard(mission.payload.board, mission.payload.properties);
                break;
            case 'playBoardEditMode':
                this.playBoard(mission.payload.board, mission.payload.properties);
                break;
            case 'editBoard':
                this.editBoard(mission.payload.board, mission.payload.properties);
                break;
            case 'stopBoardAnim':
                this.stopBoardAnim();
                break;
            case 'addUserFileViaDialog':
                this.addUserFileViaDialog();
                break;
            default:
                break;
        }

        return true;
    }

    stopBoardAnim() {
        this.engine.stopBoardAnim();
    }

    restoreBoard(board, properties, callback): boolean {
        console.log('iniside board component - restoreBoard');
        if (board) {
            let jsonStr = JSON.stringify(board);
            this.prevBboardCanvas = this.boardCanvas;
            this.boardCanvas = this.boardCanvas.loadFromJSON(jsonStr, () => {
                this.boardCanvas.backgroundColor = 'rgba(200,200,200,0)';
                this.boardCanvas.renderAll();
                callback();
            });
            Object.assign(this.properties, properties);
            //this.cdr.detectChanges();
            //poor mans change detection
            return true;
        }
        return false;
    }

    editBoard(board, properties) {
        console.log('iniside board component - editBoard');
        if (this.restoreBoard(board, properties, () => console.log('no callback'))) {
            // do not popup title change dialog this.boardTitleClickH();
        } else {
            //TODO alert user
        }
    }

    //TODO elminiate else and test
    playBoard(board, properties) {
        this.engine.allowBoardAnim();
        console.log('inside board component - playBoard');
        if (board) {
            this.restoreBoard(board, properties, () => {
                this.playBoardBtnH(board, properties)
            })
        } else {
            this.playBoardBtnH(board, properties);
        }
        return true;
    }

    startTimer() {
        //this.showBoardTimer = true;
        let timer = Observable.timer(0, 1000);
        return timer.subscribe(t => {
            this.boardTimer = t;
            this.boardTimerStr = moment('2000-01-01 00:00:00').add(moment.duration(t * 1000)).format('HH:mm:ss');
        });
    }

    playBoardBtnH(board, properties) {
        let that = this;
        this.engine.allowBoardAnim();
        //hide board toolbar whether shown or not
        this.boardTB.show = false;
        //this.showBoardTimer = true;
        this.boardTimer = 0;

        //check for empty board
        let cvObjs = this.boardCanvas.getObjects();
        if (cvObjs && cvObjs.length < 1) {
            //this.engine.doAlert(this.nav, 'Warning!!', 'Board is Empty. Add some photos first and then save');
            return false;
        }

        //start board timer - note unsubscribe called when animation done
        let timerObsrv = this.startTimer();

        //this.engine.animateMacro1(cvObjs, this.boardCanvas, this.secondsPerTile, () => {
        this.engine.animateGroupMacro1(cvObjs, this.boardCanvas, this.secondsPerTile, () => {
            that.announce(that.missionService.missions.playBoardComplete);
            timerObsrv.unsubscribe();
            //this.showBoardTimer = false;

            //TODO unable to retore pics to orig locs so reloading whole board
            this.restoreBoard(board, properties, () => console.log('no callback'))

        });
        console.log(cvObjs);
    }

    saveActiveBoard(isEdit: boolean = false, isRecentlyUsed: boolean = false) {
        let that = this;
        console.log('inside board component - saveActiveBoard');

        //check for empty board
        let cvObjs = this.boardCanvas.getObjects();
        if (cvObjs && cvObjs.length < 1) {
            //this.engine.doAlert(this.nav, 'Warning!!', 'Board is Empty. Add some photos first and then save');
            return false;
        }

        //check for empty or default title
        if (!this.properties || this.properties.title === '' || this.properties.title === defaultBoadTitle) {
            this.boardTitleClickH();
            return false;
        }


        let cvObj = this.boardCanvas.toObject();
        if (!isEdit) {
            this.properties.dateTimeCreated = new Date();
            this.properties.dateTimeUsed = new Date();
        } else {
            this.properties.lastModified = new Date();
        }

        //TODO test below recently added untested code
        //saving because just visualized and need to update last used time
        if (isRecentlyUsed) {
            this.properties.dateTimeUsed = new Date();
        }

        let obs = this.engine.saveBoard(this.userName, this.properties, cvObj);
        obs.subscribe(
            success => {
                this.missionService.setGlobal('isBoardDirty', false);
                console.log('inside boardcomponent saveActiveBoard success')
                if (that.shouldExitAfterOp) {
                    //that.nav.setRoot(ListPage, {});
                    this.router.navigate(['/Homepage']);
                }
            },
            err => console.log('inside boardcomponent saveActiveBoard error'),
            () => console.log('inside boardcomponent saveActiveBoard  completed')
        );
    }

    addImageToCanvas(photo: IdpPhoto) {
        this.missionService.setGlobal('isBoardDirty', true);
        this.engine.addImageToCanvas(this.boardCanvas, photo.url, {}).subscribe(
            x => {
                console.log('1 img added')
                this.missionService.setGlobal('isBoardDirty', true);
            },
            err => console.log('an error occured'),
            () => console.log('completed - all imgs added')
        )
    }

    //not yet tested from http://stackoverflow.com/questions/15215494/fabric-js-canvas-with-100-width-possible
    resizeCanvas(canvas) {
        canvas.setHeight(window.innerHeight);
        canvas.setWidth(window.innerWidth);
        canvas.renderAll();
    }

    //handler for textarea revealed when toolbar text button clicked.
    //called by textarea change event and updates tile group's text to entered value
    tileTextChangeH() {

    }

    saveTextToolBtnH() {
        if (this.tileText && this.tileText !== '') {
            if (this.boardTB.activeObject) {
                this.boardTB.activeObject.item(1).set({
                    text: this.tileText
                });
                this.boardCanvas.deactivateAll().renderAll();
                this.boardTB.show = false;
                this.boardTB.activeObject = null;
            }
        }
        this.hideTBTextarea = true;
    }

    tbEditTextBtnH() {
        console.log('inside board component addTextAndGroupH');
        //get handle on active image
        if (this.boardTB.activeObject) {
            let tempTxt = this.boardTB.activeObject.item(1).text
            this.tileText = ''
            if (tempTxt && tempTxt !== '') {
                this.tileText = tempTxt
            }
            this.hideTBTextarea = false;
            this.resetBoardTBAutoHide(400) //TODO remove dangerous hack that only allows 2 minutes for folks to write aff
        }
    }

    deleteCanvasItemH() {
        console.log('inside deleteCanvasItemH');
        /* this.engine.showConfirmAlert(this.nav,
             'Are You Sure?',
             'Do you really want to delete this item from your board? This action cannot be undone',
             'Yes Delete',
             "No",
             () => {
                 if (this.boardTB.activeObject) {
 
                     // not sufficient for deleting groups this.boardTB.activeObject.remove();
                     this.missionService.setGlobal('isBoardDirty', true);
                     console.log('Item delete');
                     //this.boardCanvas.renderAll();
 
                     //added to handle deletion of groups ref http://stackoverflow.com/questions/11829786/delete-multiple-objects-at-once-on-a-fabric-js-canvas-in-html5
                     if (this.boardCanvas.getActiveGroup()) {
                         this.boardCanvas.getActiveGroup().forEachObject(o => { this.boardCanvas.remove(o) });
                         this.boardCanvas.discardActiveGroup().renderAll();
                     } else {
                         this.boardCanvas.remove(this.boardCanvas.getActiveObject());
                     }
                 }
             },
             () => console.log('delete board item confirmation canceled')
         )*/

    }

    boardTitleClickH() {
        let that = this;
        let frmTitile = '';
        console.log('inside boardTitleClickH');
        var prevTitle = this.properties.title;
        /*if (this.properties.title === defaultBoadTitle) {
            //this.properties.title = '';
           // this.cdr.detectChanges();
           frmTitile = '';
        }else{
            frmTitile = this.properties.title;
        }*/
        /* let prompt = this.alertCtrlr.create({
             title: 'Board Title',
             message: "Enter a title this new board you're so keen on adding",
             inputs: [
                 {
                     name: 'title',
                     //value: frmTitile,//this.properties.title,
                     value: this.properties.title,
                     placeholder: 'Title'
                 }, {
                     name: 'boardDescription',
                     value: this.properties.boardDescription,
                     placeholder: 'Optional Description'
                 },
             ],
             buttons: [
                 {
                     text: 'Cancel',
                     handler: data => {
                         console.log('Cancel clicked');
                         this.properties.title = prevTitle;
                         if (that.shouldExitAfterOp) {
                             that.nav.setRoot(ListPage, {});
                         }
                     }
                 },
                 {
                     text: 'Save',
                     handler: data => {
                         this.missionService.setGlobal('isBoardDirty', true);
                         console.log('Saved clicked data ->', data);
                         data && Object.assign(this.properties, data);
                         console.log(this.properties);
 
                         //check for empty board first then close this dialog before calling saveActiveBoard which
                         //will also check for empty board and show alert but this way no dialog on top of dialog
                         //check for empty board
                         let cvObjs = that.boardCanvas.getObjects();
                         if (cvObjs && cvObjs.length < 1) {
                             //that.engine.doAlert(that.nav, 'Warning!!', 'Board is Empty. Add some photos first and then save');
                             //return false;
                             let navTransition = prompt.dismiss();
                             navTransition.then(
                                 () => this.saveActiveBoard(),//transition success now call save which will alert if empty
                                 () => console.log('dimiss actionsheet transition failed')
                             );//transition fail fxn
 
                         }
 
                         if (this.properties.title === '') {
                             this.properties.title = defaultBoadTitle;
                         }
 
                     }
                 }
             ]
         });
         prompt.present(prompt);*/
    }
}
