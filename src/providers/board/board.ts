import { Injectable, Inject } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import moment from 'moment';
import * as Rx from 'rxjs/Rx';
import _ from 'lodash'; //use npm install @types/lodash --save-dev --save-exact from http://stackoverflow.com/questions/33406589/how-do-i-use-lodash-with-ionic-2

//providers
//import {DpphotosSrvc, IdpPhoto} from '../../providers/dpphotos/dpphotos';
import { DpPersistenceFirebase } from '../../providers/dp-persistence/dp-persistence-firebase';
import { DpDataModel } from '../../providers/dp-persistence/dp-datamodel';
import { DCFG } from '../../providers/dpconfig/dpconfig';
//import {MissionControl, IMissionCommand} from '../../providers/mission-control/mission-control';

//declare var fabric: any;
//declare var lodash: any;

interface FBAnimationOpts {
  isStart: boolean,
  topStart: number,
  topEnd: number,
  leftStart: number,
  leftEnd: number,
  opacityEnd: number,
  opacityStart: number,
  angleEnd: number,
  angleStart: number,
  scaleXEnd: number,
  scaleXStart: number,
  scaleYStart: number,
  duration: number,
  onComplete: any
};

let defaultBoadTitle = 'Untitled Board';

@Injectable()
export class BoardService {
  http;
  appType = 'webVB';
  entityDefaults = {
    entity: 'vboard'
  };
  animationOptions = {
    isStart: true,
    topStart: 0,
    topEnd: 0,
    leftStart: 0,
    leftEnd: 0,
    opacityEnd: 1,
    opacityStart: 1,
    angleEnd: 0,
    angleStart: 0,
    scaleXEnd: 1,
    scaleXStart: 1,
    scaleYStart: 1,
    duration: 1500,
    onComplete: {},
    canvas: {}
  }
  public boardCount = 0;
  userBoardCount = 0;
  sampleBoardCount = 0;
  logs: Array<DpDataModel>; //holds all boards
  userBoards: Array<DpDataModel>; //holds all user boards
  sampleBoards: Array<DpDataModel>;//holds all sample boards

  defaultUserName = 'anonymous';
  defaultCanvasOptions = {
    backgroundColor: 'rgb(200,200,200,0)',
    selectionColor: 'blue',
    selectionLineWidth: 2,
    minCanvasHeight: 500,
    minCanvasWidth: 500
  };
  defaultBoardsCreated = false; //updated by caller of createDefaultBoards
  defaultBoardProperties = {
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

  //bundle 3 default vbs to get folks started
  //position allows us to auto compute coords of top left
  defaultBoards = []; //json read from file at ../../data/defaultBoards.json
  private stopAllAnimations = false;

  constructor( @Inject(Http) http,
    private DataStore: DpPersistenceFirebase,
    private alertCtrlr: AlertController
    //private missionService: MissionControl
  ) {
    this.http = http;
    this.logs = [];

    //get hardcoded default boards from local json
    this.getDefaultBoardsLocal();
  }

  getDefaultBoardsLocal() {
    let that = this
    return this.http.request('../../data/defaultBoards.json').map(res => {
                   that.defaultBoards = res.json();
                 });
  }

  findNewPos(cv, canvasWidth: number, canvasHeight: number, existingObj, incomingObj): boolean {
    let defaultStartLeft = 10; //leftmost starting coord basically left margin
    let spaceBetweenObjs = 20;
    let magicYOffset = incomingObj.getHeight(); //TODO rethink - obtained by trial and error
    let magicXOffset = 2 * incomingObj.getWidth(); //TODO rethink - obtained by trial and error

    //prefer updating X first then Y while staying within board
    let xOffset = ((existingObj.getLeft() + existingObj.getWidth())) + spaceBetweenObjs;
    let newRightEdgeX = xOffset + ((incomingObj.getLeft() + incomingObj.getWidth()));

    //check that right edge still within boards else modify Y instead
    if ((newRightEdgeX - magicXOffset) < canvasWidth) {
      incomingObj.setLeft(xOffset)
    } else {
      let yOffset = ((existingObj.getTop() + existingObj.getHeight())) + spaceBetweenObjs;
      let newBottomEdgeX = yOffset + ((incomingObj.getTop() + incomingObj.getHeight()));

      if ((newBottomEdgeX - magicYOffset) < canvasHeight) {
        incomingObj.setTop(yOffset)
        incomingObj.setLeft(defaultStartLeft)
      } else {
        return false
      }
    }
    incomingObj.setCoords();
    return true;
  }

  optimizeImgPosition(canvas: any, img: any) {
    let that = this;
    let flag;
    let minCanvasWidth = this.defaultCanvasOptions.minCanvasWidth
    let minCanvasHeight = this.defaultCanvasOptions.minCanvasHeight
    // Loop through objects
    //does not loop through all? canvas.forEachObject(function (obj) {
    let cvobjs = canvas.getObjects();
    cvobjs.map(obj => {
      //do not compare img to itself
      if (obj === img) {
        return true
      }
      // If objects intersect
      if (img.isContainedWithinObject(obj) || img.intersectsWithObject(obj) || obj.isContainedWithinObject(img)) {
        // Set new position
        flag = that.findNewPos(canvas, minCanvasWidth, minCanvasHeight, obj, img);
        if (flag === false) {//board full
          return flag
        }
      }
    })
    return true
  }

  addImageToCanvas(fabricCanvas: any, photoUrl: string, opts): Observable<any> {
    let that = this
    let imgscale = 1;
    let obs = Rx.Observable.create(o => {

      fabric.Image.fromURL(photoUrl, oImg => {
        oImg.set({
          left: opts.left || 10,
          top: opts.top || 10,
          stroke: 'white',
          strokeWidth: 2,
          src: photoUrl,
          originX: 'center',
          originY: 'center'
          //"angle": 10,
          //skews it width:200
        });
        imgscale = this.defaultBoardProperties.defaultCanvasImgWidth / oImg.width;
        oImg.scale(imgscale).setCoords();

        let imgText = opts.text || ' '

        //TODO compute top ref http://stackoverflow.com/questions/27358708/how-does-fabric-group-positioning-work
        let boardText = new fabric.Text(imgText, {
          fontSize: 20,
          fontFamily: 'Verdana, Geneva, sans-serif',
          fontWeight: 'bold',
          originX: 'center',
          originY: 'center',
          top: -30, //want text away from center of image and a bit towards the top
          left: 10,//TODO replace with calc - Want text centered
          stroke: '#ffffff',
          //stroke: '#000000',
          strokeWidth: 1,
          shadow: 'rgba(0,0,0,0.3) 2px 2px 5px',

          fill: '#387ef5'
          //fill: '#ffffff'
        });

        let group = new fabric.Group([oImg, boardText], {
          left: opts.left || 10,
          top: opts.top || 10,
          //"angle": -10
        });

        fabricCanvas.add(group);
        //fabricCanvas.add(oImg);

        fabricCanvas.renderAll();

        //calculate best position for image and update its position
        //that.optimizeImgPosition(fabricCanvas, oImg)
        that.optimizeImgPosition(fabricCanvas, group)
        fabricCanvas.renderAll();

        o.next(oImg);
        o.complete();
      });

    });
    return obs;
  }

  createNewBoard(domBoardID = 'domBoardID', canvasOptions = this.defaultCanvasOptions) {
    let boardCanvas = new fabric.Canvas(domBoardID, canvasOptions);
    let canvas = boardCanvas; //easier to type and paste code
    boardCanvas.backgroundColor = 'rgba(200,200,200,0)';
    return canvas;
  }

  createDefaultBoard(def) {

    let myObs = Observable.create(o => {
      let fabricCanvas = this.createNewBoard();
      let imgObs = [];

      def.items.map(x => {
        let obs = this.addImageToCanvas(fabricCanvas, x.path, x);
        imgObs.push(obs);
      });

      let cvObj = {};
      let temp = Observable.concat(...imgObs);
      temp.subscribe(
        x => console.log('1 img added'),
        err => console.log('an error occured'),
        () => {
          console.log('completed - all imgs added')

          cvObj = fabricCanvas.toObject();
          let props = Object.assign({}, this.defaultBoardProperties);
          props.title = def.title;
          props.boardDescription = def.description;
          props.dateTimeCreated = new Date(); //todo set to fixed date to represent created at original ship date
          this.saveBoard(this.defaultUserName, props, cvObj, 'vboard_sample').subscribe(
            x => {
              console.log('default board saved')
              o.next(true);
            },
            err => console.log('default board save failed ->', err),
            () => {
              console.log('default board save completed');
              o.next(true);
              o.complete(true);
            }
          );
        }
      );
    });
    return myObs;
  }

getDefaultBoardsJSON(userName): Observable<any>{
return this.DataStore.getDefaultBoardsJSON();
}

//0. checks to see if default boards already created and returns if created
//1. attempts to retrieve all boards previously created including sample boards
//2. if sample boards have not yet been created, creates them
  createDefaultBoards(defs = this.defaultBoards): Observable<any> {
    let DELAY_500_MS = 1000; //used to introduce 10ms delay so that board name collisions avoided cause unix timestamp can advance
    //1. check if default boards already created
    if (this.defaultBoardsCreated) {
      return Observable.from([true]);
    }

    let myObs = Observable.create(o => {
      //2. if not already created attempt to retrieve from db and abort if any boards in db
      let obs = this.getBoards(DCFG.DF.userName).subscribe(
        success => {
//debugger;
          if (success && success.sampleBoards && success.sampleBoards.length > 2) {
            this.defaultBoardsCreated = true;
            o.next(true);
            o.complete();
          } else {

            //3. If no boards in db create default boards
            let obsrvs = [];
            defs.map(x => {
              //replace sample boards the user may have saved as their own
              if (success && success.sampleBoards && success.sampleBoards.length < 3) {
                console.log(success)
                let boardCount = _.filter(success.sampleBoards, (samp: any) => {
                  return (samp.properties && (samp.properties.title === x.title))
                }).length
                if (boardCount > 0) return
              }
              let obs = this.createDefaultBoard(x).delay(DELAY_500_MS);
              obsrvs.push(obs);
            });
            Observable.concat(...obsrvs).subscribe(
              success => {
                console.log('createDefaultBoards: default board created')
                o.next(true);
              },
              err => o.error(false),
              () => {
                o.complete();
                console.log('createDefaultBoards: all default boards created successfully');
              }
            )
          }
        },
        err => console.log('Intial attempt to get boards before creating defaults failed ->', err),
        () => console.log('Intial attempt to get boards before creating defaults completed')
      );
    });
    return myObs;
  }


  defaultAlertCallback() {
    console.log('defaultAlertCallback called');
  }

  doAlert(nav, title, subtitle = '', callback: any = this.defaultAlertCallback) {
    let alert = this.alertCtrlr.create({
      title: `<h3 class="text-center">${title}</h3>`,
      subTitle: `<p>${subtitle}</p>`,
      buttons: [{
        text: 'OK',
        handler: data => {

          alert.dismiss().then(() => {
            callback();
            console.log('OK clicked');
          });
          return false;
        }
      }]
    });

    alert.present(alert);
  }

  showConfirmAlert(nav, title, msg, btn1Text = 'Yes', btn2Text = 'No', btn1Fxn, btn2Fxn) {
    let confirm = this.alertCtrlr.create({
      title: `<h3 class="text-center">${title}</h3>`,
      message: `<p>${msg}</p>`,
      buttons: [
        {
          text: btn1Text,
          handler: () => {
            console.log('Disagree clicked');
            btn1Fxn();
          }
        },
        {
          text: btn2Text,
          handler: () => {
            console.log('Agree clicked');
            btn2Fxn();
          }
        }
      ]
    });
    confirm.present(confirm);
  }

  saveBoard(username, properties, cvObj, subType: string = 'vboard_user'): Observable<any> {
    let dt = moment().format(DCFG.DT.YMDFormat);
    let ts = moment().unix();
    let boardID = [DCFG.APPINFO.id, this.entityDefaults.entity, username, dt, ts].join(DCFG.DF.delim);
    let appVer = DCFG.APPINFO.version;
    console.log('inside BoardProvider.saveBoard: boardID->', boardID);
    properties._id = properties._id || boardID;
    let obj = new DpDataModel(
      properties._id,
      this.entityDefaults.entity,
      subType,
      this.appType,
      this.defaultUserName,
      boardID, appVer);
    obj.properties = properties;
    obj.payLoad = cvObj;
    return this.DataStore.saveBoard(obj);
  }

  deleteItem(itm): Observable<any> {
    return this.DataStore.deleteItem(itm);
  }

  _getBoards(userName): Observable<any> {
    return this.DataStore.getAllUserBoards().map(
      payload => {
        console.log('inside boardservice._getBoards payload->', payload);
        if(payload){
        payload.map(data => {
          if (data.properties && data.properties.dateTimeCreated) {
            data.properties.dateTimeCreated = new Date(data.properties.dateTimeCreated);
            console.log('Boardservice.getBoards date converted for board->', data);
          }
          return data;
        });
      }
        return payload;
      }
    );
  }

  getBoards(userName): Observable<any> {
    let that = this;
    let myObs = Observable.create(observer => {
      let obs = this._getBoards(DCFG.DF.userName);
      obs.subscribe(
        success => {
          console.log('inside listPage getBoards success');
          if(success && success.length > 0){
this.logs = success;
          this.logs = _.sortBy(this.logs, ['dateTimeUsed']);

          this.sampleBoards = _.filter(this.logs, { subType: 'vboard_sample' });
          this.sampleBoardCount = this.sampleBoards.length;

          this.userBoards = _.filter(this.logs, { subType: 'vboard_user' })
          this.userBoardCount = this.userBoards.length;

          this.boardCount = this.logs.length;
          observer.next({
            length: that.logs.length > 0 ? 3 : 0,//hack to make is seem arraylike since most calls call .length
            logs: this.logs,
            sampleBoards: this.sampleBoards,
            userBoards: this.userBoards
          });
          }else{
            observer.error({
              msg:'0 boards found'
            });
          }
          
        },
        err => {
          console.log('inside listPage getBoards error'),
            observer.error(err);
        },
        () => {
          console.log('inside listPage getBoards  completed')
          observer.complete()
        }
      );
    });
    return myObs;
  }

  getFeaturedBoard(userName): Observable<any> {
    let myObs = Observable.create(o => {
      if (this.boardCount > 0) { // assume boards already fetched
        let fb = getFeatured(this.userBoards, this.sampleBoards)
        o.next(fb)
        o.complete()
      } else {
        this.getBoards(userName).subscribe(
          x => {
            let fb = getFeatured(this.userBoards, this.sampleBoards)
            o.next(fb)
            o.complete()
          },
          err => console.log('An error occured while trying to fetch featured board'),
          () => console.log('Finished trying to fetch featured board')
        )
      }
    })
    return myObs;

    function getFeatured(userBoards: any, sampleBoards: any) {
      if (userBoards && userBoards.length > 0) {
        return _.sortBy(userBoards, ['dateTimeUsed'])[userBoards.length - 1];
      } else {
        if (sampleBoards && sampleBoards.length > 0) {
          return _.sortBy(sampleBoards, ['dateTimeUsed'])[sampleBoards.length - 1];
        }
      }
    }

  }

  //utility fxn to calculate scale that allows us to cover entire board with overzoomed image
  calcFullBoardImgScales(board, img) {
    let overscaleFactor = 1.2
    let bw = board.getWidth();
    let bh = board.getHeight();
    let iw = img.getWidth();
    let ih = img.getHeight();
    let isx = img.getScaleX();
    let isy = img.getScaleY();
    console.log(bw, bh, iw, ih, isx, isy);
    let xscale = isx * bw / iw;
    let yscale = isy * bh / ih;
    let scales = {
      fullBoardX: xscale,
      fullBoardY: yscale,
      fullBoardScale: Math.max(xscale, yscale),
      fullBoardMaxScale: Math.max(xscale, yscale),
      fullBoardMinScale: Math.min(xscale, yscale),
      fullBoardOverScale: overscaleFactor * Math.max(xscale, yscale),
      fullBoardOverScaleDownToFull: Math.max(xscale, yscale),
      scalePercent: overscaleFactor * 100,
      scale: overscaleFactor
    }
    return scales;
  }

  retoreBoardItemState(boardItemCache) {
    let canvas;
    console.log('About to begin providers/board/retoreBoardItemState')
    boardItemCache.map(item => {
      canvas = item.canvas;
      Object.assign(item.original, item.properties);
      item.original.set('selectable', true);
      item.original.setOpacity(1);
      //item.original.set({ 'top': item.topStart, 'left': item.leftStart });
      item.original.set('top', item.topStart);
      item.original.set('left', item.leftStart);
      //item.original.set('width', item.savedWidth);
      //item.original.set('height', item.savedHeight);
      //item.original.set('scaleX', item.savedScaleX);
      //item.original.set('scaleY', item.savedScaleY);
    });
    canvas.deactivateAll().renderAll();
    console.log('Completed providers/board/retoreBoardItemState')
  }

  //stops the animation in its tracks
  stopBoardAnim() {
    this.stopAllAnimations = true;
  }
  allowBoardAnim() {
    this.stopAllAnimations = false;
  }

  //Animation macro 1 - zooms from center to full board, pans slowly to the right and fades to 0 opacity while next images fades in at full board size
  animateGroupMacro1(groups, canvas, secondsPerTile: number, doneCallBack: any) {
    let that = this;
    let millSecFactor = 1000;

    //step 1 move to the center and zoom to fullboard
    //step 2a pan slowly to the right
    //step 2b load next img move to center and repeat till no imgs left
    let animatefxns = [
      this.animateZoomToFullBoard,
      this.animateZoomPanIntoImg,
      this.animateZoomPanIntoImgReverse,
      this.animateZoomDownToFullBoard
    ];

    let animateDursMults = [
      secondsPerTile * 1 / 13,
      secondsPerTile * 4 / 13,
      secondsPerTile * 4 / 13,
      secondsPerTile * 4 / 13
    ];

    let obsrvs = [];
    this.animationOptions.canvas = canvas;
    let boardItemCache = [];

    //make sure any selected board items are deselected
    canvas.deactivateAll().renderAll();

    //turn animations back on 
    this.stopAllAnimations = false;

    //cache the state of board items so can be later restored and make all images transparent
    groups.map(grp => {
      let tempObj = {
        canvas: canvas,
        original: grp,
        properties: Object.assign({}, grp),
        topStart: grp.get('top'),
        leftStart: grp.get('left'),
        //savedWidth: grp.getWidth(),
        //savedHeight: grp.getHeight(),
        //savedScale"X": img.getScaleX(),
        //savedScale"Y": img.getScaleY()
      };
      boardItemCache.push(tempObj);
      grp.setOpacity(0);
      grp.set('selectable', false);
      grp.item(0).set({ strokeWidth: 0 });
    });

    groups.map((img) => {
      let zoomScales = this.calcFullBoardImgScales(canvas, img);
      [0, 1, 2, 3].map(x => {
        let fxn = animatefxns[x];
        let animObs = fxn(that, img, zoomScales, millSecFactor * animateDursMults[x], false, () => {
          console.log(`step ${x} completed`);
        });
        obsrvs.push(animObs);
      });
    });
    let combObs = Observable.concat(...obsrvs).subscribe(
      x => console.log(x),
      err => console.log('an error occured in boardComponent.animateMacro1'),
      () => {
        //restore board items to the way the were before the animation
        this.retoreBoardItemState(boardItemCache);
        doneCallBack() //console.log('animateMacro1 completed in boardComponent.animateMacro1')
      }
    );
    return combObs;
  }

  //Step 1 - zoom from center until board covered
  animateZoomToFullBoard(that, img, zoomScales, aniDuration, isReverse, onCompletefxn) {
    img.center();
    let zooomScale = zoomScales.fullBoardOverScale//fullBoardScale;
    let source = new Observable(observer => {
      let opts: FBAnimationOpts = Object.assign({}, that.animationOptions, {
        scaleXStart: zooomScale,//img.get('scaleX'),
        scaleYStart: zooomScale,//img.get('scaleY'),
        duration: aniDuration,
        onComplete: () => {
          //observer.next(true);
          observer.complete();
          //still call callback
          if (onCompletefxn) onCompletefxn();
          console.log('animateZoomToFullBoard complete isReverse->', isReverse)
        }
      });
      that.animate(img, opts);
    });
    return source;
  }

  //step 2 pan around image diagonal down
  animateZoomPanIntoImg(that, img, zoomScales, aniDuration, isReverse, onCompletefxn) {
    img.center();
    let directionMult = isReverse ? -1 : 1;
    let canvas = that.animationOptions.canvas
    let zooomScale = zoomScales.fullBoardOverScale;

    var source = Observable.create(observer => {
      let opts: FBAnimationOpts = Object.assign({}, that.animationOptions, {
        topStart: img.get('top') - (directionMult * ((Math.abs(1 - zoomScales.scale) * canvas.height) / 4)),
        leftStart: img.get('left') - (directionMult * ((Math.abs(1 - zoomScales.scale) * canvas.width) / 4)),
        scaleXStart: zooomScale,//img.get('scaleX'),
        scaleYStart: zooomScale,//img.get('scaleY'),
        duration: aniDuration,
        onComplete: () => {
          //observer.next(true);
          observer.complete();
          //still call callback
          if (onCompletefxn) onCompletefxn();
          console.log('animateZoomPanIntoImg complete isReverse->', isReverse)
        }
      });
      that.animate(img, opts);
    });
    return source;
  }

  //step 3 pan around img diagonal up
  animateZoomPanIntoImgReverse(that, img, zoomScales, aniDuration, isReverse, onCompletefxn) {
    isReverse = !isReverse;
    return that.animateZoomPanIntoImg(that, img, zoomScales, aniDuration, isReverse, onCompletefxn)
  }

  //Step 4 - zoom from overscaled to full board centered
  animateZoomDownToFullBoard(that, img, zoomScales, aniDuration, isReverse, onCompletefxn) {
    img.center();
    let zooomScale = zoomScales.fullBoardOverScaleDownToFull;
    let source = new Observable(observer => {
      let opts: FBAnimationOpts = Object.assign({}, that.animationOptions, {
        scaleXStart: zooomScale,
        scaleYStart: zooomScale,
        duration: aniDuration,
        onComplete: () => {
          observer.next(true);
          observer.complete();
          if (onCompletefxn) onCompletefxn();
          console.log('animateZoomDownToFullBoard complete call now about to fade out isReverse->', isReverse)

          img.animate('opacity', 0, {
            duration: 2000,
            onComplete: () => {
              console.log('animateZoomDownToFullBoard complete call fade out complete')
            }
          });
          //img.center();
        }
      });
      that.animate(img, opts);
    });
    return source;
  }

  animate(fbimg, opts) {
    let that = this;
    var isStart = opts.isStart;
    fbimg && fbimg.animate({
      top: isStart ? opts.topStart : opts.topEnd,
      left: isStart ? opts.leftStart : opts.leftEnd,
      opacity: isStart ? opts.opacityEnd : opts.opacityStart,
      angle: isStart ? opts.angleStart : opts.angleEnd,
      scaleX: isStart ? opts.scaleXStart : opts.ScaleXEnd,
      scaleY: isStart ? opts.scaleYStart : opts.ScaleYEnd,
    }, {
        duration: opts.duration,
        onChange: opts.canvas.renderAll.bind(opts.canvas),
        onComplete: opts.onComplete,
        abort: () => {
          //TODO loop through all imgs and make opaque again
          return that.stopAllAnimations
        }
      });
  }
}

