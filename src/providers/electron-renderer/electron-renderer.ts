//credits webtorrent source

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
//import * as moment from 'moment';
import * as Rx from 'rxjs/Rx';
//import * as _ from 'lodash';


@Injectable()
export class ElectronRenderer {
  electron;
  app;
  fs; // node-fs
  fse; //node-fs-extra
  path;
  config;
  ipcRenderer;
  dragDrop;
  //remote;
  dialog;
  data: any = null;
  state = {
    window: {
      bounds: null, /* {x, y, width, height } */
      isFocused: true,
      isFullScreen: false,
      title: '',// this.config.APP_WINDOW_TITLE,
      wasMaximized: false,
      isVisible: true
    },
    dock: {
      badge: 0,
      progress: 0
    },
    errors: [],
    imgUrls: [] //paths to imgs saved in userData/images
  };
  constructor(public http: Http) {
    //this.ipcRenderer = this.electron.ipcRenderer;
  }

  //dp added to allow users to load their own images using system file dialog
  showDialogToLoadUserFile() {
    let that = this;
    let obs = Observable.create((o) => {
      that.dialog.showOpenDialog(
        {
          properties: ['openFile'],
          filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
            //{name: 'Movies', extensions: ['mkv', 'avi', 'mp4']},
            //{name: 'Custom File Type', extensions: ['as']},
            //{name: 'All Files', extensions: ['*']}
          ]
        }
        , function (fileNames) {
          if (fileNames === undefined) {
            console.log("No file selected");
            o.error();
          } else {
            //document.getElementById("actual-file").value = fileNames[0];
            //readFile(fileNames[0]);
            o.next(fileNames);
            o.complete();
          }
        });
    });
    return obs;
  }

  init(electron, fs, fse, path, config, ipcRenderer, dragDrop, dialog) {
    const that = this;
    this.electron = electron;
    this.app = electron.remote.app;
    this.fs = fs;
    this.fse = fse;
    this.path = path;
    this.config = config;
    this.ipcRenderer = ipcRenderer;
    this.dragDrop = dragDrop;
    //this.remote = remote;
    this.dialog = dialog;

    debugger;
    this.ipcRenderer = this.electron.ipcRenderer;
    this.state.window.title = this.config.APP_WINDOW_TITLE;

    // All state lives in state.js. `state.saved` is read from and written to a file.
    // All other state is ephemeral. First we load state.saved then initialize the app.
    //State.load(onState)
    this.onState();

    //read in files in userData/images
    this.readSavedImages().then(
      (files) => {
        that.state.imgUrls = files;
      },
      err => console.log(err)
    )
  };

  //function to save image dropped into webapp to disk


  /**
 * Called once when the application loads. (Not once per window.)
 * Connects to the torrent networks, sets up the UI and OS integrations like
 * the dock icon and drag+drop.
 */
  onState(err: any = null, _state: any = null) {
    if (err) return this.onError(err);

    // Listen for messages from the main process
    this.setupIpc()

    // OS integrations:
    // ...drag and drop a torrent or video file to play or seed
    this.dragDrop('body', (files, pos) => {
      //want this to be this provider so verboser fxn form needed other wise this is some other obj
      this.onDragDropImage(files, pos);
    })

    // ...same thing if you paste a torrent
    document.addEventListener('paste', this.onPaste)

    // ...focus and blur. Needed to show correct dock icon text ("badge") in OSX
    window.addEventListener('focus', this.onFocus)
    window.addEventListener('blur', this.onBlur)

    // ...window visibility state.
    document.addEventListener('webkitvisibilitychange', this.onVisibilityChange)

    console.timeEnd('init')
  }

  delayedInit() {
    this.lazyLoadCast()
    //sound.preload()
    //this.telemetry.init(state)
  }

  updateElectron() {
    /*if (state.window.title !== state.prev.title) {
      state.prev.title = state.window.title
      ipcRenderer.send('setTitle', state.window.title)
    }
    if (state.dock.progress !== state.prev.progress) {
      state.prev.progress = state.dock.progress
      ipcRenderer.send('setProgress', state.dock.progress)
    }
    if (state.dock.badge !== state.prev.badge) {
      state.prev.badge = state.dock.badge
      ipcRenderer.send('setBadge', state.dock.badge || '')
    }*/
  }

  // Lazily loads Chromecast and Airplay support
  lazyLoadCast() {

  }

  // Events from the UI never modify state directly. Instead they call dispatch()
  dispatch(action, ...args) {
    // Log dispatch calls, for debugging
    /*if (!['mediaMouseMoved', 'mediaTimeUpdate'].includes(action)) {
      console.log('dispatch: %s %o', action, args)
    }*/

    if (action === 'onOpen') {
      this.onOpen(args[0] /* files */)
    }
    if (action === 'openTorrentFile') {
      this.ipcRenderer.send('openTorrentFile') /* open torrent file */
    }
    if (action === 'openFiles') {
      this.ipcRenderer.send('openFiles') /* add files with dialog */
    }
    if (action === 'openItem') {
      //this.openItem(args[0] /* infoHash */, args[1] /* index */)
    }

    if (action === 'toggleFullScreen') {
      this.ipcRenderer.send('toggleFullScreen', args[0] /* optional bool */)
    }

    if (action === 'setTitle') {
      //state.window.title = args[0] /* title */
    }
    if (action === 'uncaughtError') {
      //telemetry.logUncaughtError(args[0] /* process */, args[1] /* error */)
    }
  }

  // Shows a modal saying that we have an update
  updateAvailable(version) {

  }

  setupIpc() {
    this.ipcRenderer.on('log', (e, ...args) => console.log(args))
    this.ipcRenderer.on('error', (e, ...args) => console.error(args))

    this.ipcRenderer.on('dispatch', (e, ...args) => this.dispatch(args[0], args));

    this.ipcRenderer.on('fullscreenChanged', function (e, isFullScreen) {
      //state.window.isFullScreen = isFullScreen
      if (!isFullScreen) {
        // Aspect ratio gets reset in fullscreen mode, so restore it (OS X)
        //this.ipcRenderer.send('setAspectRatio', state.playing.aspectRatio)
      }
      //this.update();
    })

    /*this.ipcRenderer.on('wt-infohash', (e, ...args) => torrentInfoHash(...args))
    this.ipcRenderer.on('wt-metadata', (e, ...args) => torrentMetadata(...args))
    this.ipcRenderer.on('wt-done', (e, ...args) => torrentDone(...args))
    this.ipcRenderer.on('wt-warning', (e, ...args) => torrentWarning(...args))
    this.ipcRenderer.on('wt-error', (e, ...args) => torrentError(...args))

    this.ipcRenderer.on('wt-progress', (e, ...args) => torrentProgress(...args))
    this.ipcRenderer.on('wt-file-modtimes', (e, ...args) => torrentFileModtimes(...args))
    this.ipcRenderer.on('wt-file-saved', (e, ...args) => torrentFileSaved(...args))
    this.ipcRenderer.on('wt-poster', (e, ...args) => torrentPosterSaved(...args))
    this.ipcRenderer.on('wt-audio-metadata', (e, ...args) => torrentAudioMetadata(...args))
    this.ipcRenderer.on('wt-server-running', (e, ...args) => torrentServerRunning(...args))

    this.ipcRenderer.on('wt-uncaught-error', (e, err) => telemetry.logUncaughtError('webtorrent', err))*/

    this.ipcRenderer.send('ipcReady')
  }

  //dp added to read in paths of all images in userData/images 
  readSavedImages() {
    let that = this;
    let filePaths = []; // files, directories, symlinks, etc

    //if running in browser no electron so return empty array
    if (!that.electron) {
      return Promise.resolve(filePaths);
    }

    let dir = this.config.IMG_DIR;
    //if imgs dir is blank create it
    if (dir === '') {
      dir = this.electron.remote.app.getPath('userData') + '/' + this.config._IMG_DIRTOCREATE + '/';
    }
    let p = new Promise(function (resolve: (farr: Array<string>) => void, reject) {
      that.fse.walk(dir)
        .on('data', function (item) {
          if (item.path && item.path !== dir && item.path !== '' && item.path !== '.DS_Store') {
            let filepathlwr = item.path.toLowerCase();
            if ((filepathlwr) && (filepathlwr.endsWith('.jpg') || filepathlwr.endsWith('.png') || filepathlwr.endsWith('.gif') || filepathlwr.endsWith('.webp'))) {
              filePaths.push(item.path);
            }
          }
        })
        .on('error', function (err, item) {
          reject(err);
        })
        .on('end', function () {
          console.dir(filePaths) // => [ ... array of files]
          resolve(filePaths);
        });
    });
    return p;
  }

  // Called when the user adds files (.torrent, files to seed, subtitles) to the app
  // via any method (drag-drop, drag to app icon, command line)
  onOpen(files) {
    if (!Array.isArray(files)) files = [files]
    this.update();
  }

  //openItem(infoHash, index) {
  openItem(filePath) {
    //var torrentSummary = this.getTorrentSummary(infoHash)
    //var filePath = path.join(torrentSummary.path,torrentSummary.files[index].path)
    this.ipcRenderer.send('openItem', filePath)
  }

  showItemInFolder(torrentSummary) {
    //ipcRenderer.send('showItemInFolder', getTorrentPath(torrentSummary))
  }

  moveItemToTrash(torrentSummary) {
    //ipcRenderer.send('moveItemToTrash', getTorrentPath(torrentSummary))
  }

  // Set window dimensions to match video dimensions or fill the screen
  setDimensions(dimensions) {
    // Don't modify the window size if it's already maximized
    if (this.electron.remote.getCurrentWindow().isMaximized()) {
      this.state.window.bounds = null
      return
    }

    // Save the bounds of the window for later. See restoreBounds()
    this.state.window.bounds = {
      x: window.screenX,
      y: window.screenY,
      width: window.outerWidth,
      height: window.outerHeight
    }
    this.state.window.wasMaximized = this.electron.remote.getCurrentWindow().isMaximized

    // Limit window size to screen size
    var screenWidth = window.screen.width
    var screenHeight = window.screen.height
    var aspectRatio = dimensions.width / dimensions.height
    var scaleFactor = Math.min(
      Math.min(screenWidth / dimensions.width, 1),
      Math.min(screenHeight / dimensions.height, 1)
    )
    var width = Math.max(
      Math.floor(dimensions.width * scaleFactor),
      this.config.WINDOW_MIN_WIDTH
    )
    var height = Math.max(
      Math.floor(dimensions.height * scaleFactor),
      this.config.WINDOW_MIN_HEIGHT
    )

    this.ipcRenderer.send('setAspectRatio', aspectRatio)
    this.ipcRenderer.send('setBounds', { x: null, y: null, width, height })
    //state.playing.aspectRatio = aspectRatio
  }

  restoreBounds() {
    this.ipcRenderer.send('setAspectRatio', 0)
    if (this.state.window.bounds) {
      this.ipcRenderer.send('setBounds', this.state.window.bounds, false)
    }
  }

  showDoneNotification(torrent) {
    /*var notif = new window.Notification('Download Complete', {
      body: torrent.name,
      silent: true
    })

    notif.onclick = function () {
      ipcRenderer.send('show')
    }*/
    //sound.play('DONE')
  }

  // Calls render() to go from state -> UI, then applies to vdom to the real DOM.
  update() {
    //showOrHidePlayerControls()
    //vdomLoop.update(state)
    //this.updateElectron();
  }


  // create directory if it does not exist
  createImgsDirectory(dir, callback) {
    let that = this;
    //var dir = '/tmp/this/path/does/not/exist'
    this.fse.ensureDir(dir, function (resp) {
      console.log(resp) // => null
      callback(resp);// dir has now been created, including the directory it is to be placed in
      that.config.IMG_DIR = dir;
    });
    /*//fs.access('/etc/passwd', fs.R_OK | fs.W_OK, (err) => {
    this.fs.access(dir, this.fs.R_OK | this.fs.W_OK, (err) => {
      console.log(err ? 'no access!' : 'can read/write');
      if (err) {
        this.fs.mkdir(dir, function (err) {
          if (err) {
            console.error(err);
            callback(err);
          } else {
            return callback(true);
          }
        });
      } else {
        callback(dir);
      }
    });

    /*this.fs.mkdir(dir, function (err) {
      if (err) {
        console.error(err);
        callback(err);
      } else {
        return callback(true);
      }
    });*/
  }

  // Event handlers
  onError(err) {
    console.error(err.stack || err)
    //sound.play('ERROR')
    this.state.errors.push({
      time: new Date().getTime(),
      message: err.message || err
    })
    this.update();
  }


  copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = this.fs.createReadStream(source);
    rd.on("error", errFxn);

    var wr = this.fs.createWriteStream(target);
    wr.on("error", errFxn);
    wr.on("close", (ex) => done());
    rd.pipe(wr);

    function errFxn(err?) {
      if (!cbCalled) {
        cb(err);
        cbCalled = true;
      }
    }

    function done() {
      cb(target)
    }
  }

  onDragDropImage(files, dropCoords): Observable<any> {
    let that = this;
    let dir = that.config.IMG_DIR;
    let obsArr = [];
    let myObs = Observable.create(obs => {

      console.log('Here are the dropped files', files);

      //if imgs dir is blank create it
      if (dir === '') {
        dir = that.electron.remote.app.getPath('userData') + '/' + that.config._IMG_DIRTOCREATE + '/'
        that.createImgsDirectory(dir, (x) => {
          //files.forEach((file) => {files.forEach((file) => parseAndCopy(file)));
          Object.keys(files).forEach((key) => {
            //files.forEach((file) => {
            //if (file.type === "image/png" || file.type === "image/jpeg") {
            let tempObs = that.parseAndCopy(files[key])
            obsArr.push(tempObs)
            //}
          })
          combineAndSub(obsArr)
        });
      } else {
        //files.forEach((file) => parseAndCopy(file));
        //files.forEach((file) => {
        Object.keys(files).forEach((key) => {
          //if (file.type === "image/png" || file.type === "image/jpeg") {
          let tempObs = that.parseAndCopy(files[key])
          obsArr.push(tempObs)
          //}
        })
        combineAndSub(obsArr)
      }
      function combineAndSub(obsCollection) {
        let temp = Observable.merge(...obsCollection);
        temp.subscribe(
          x => {
            console.log('inside electron-renderer.onDragDropImage dropped files copied success')
            obs.next(x)
            obs.complete()
          },
          err => {
            console.log('inside electron-renderer.onDragDropImage dropped files copied err=>', err)
            obs.error(err)
          },
          () => {
            console.log('inside electron-renderer.onDragDropImage dropped files copied complete')
            obs.complete()
          }
        )
      }

    });
    return myObs;
  }

  parseAndCopy(file): Observable<any> {
    var sourcefile:string = '';
    var newtarget:string = '';
    var filename:string = '';
    let that = this;
    let dir = that.config.IMG_DIR;
    //if imgs dir is blank create it
    if (dir === '') {
      dir = this.electron.remote.app.getPath('userData') + '/' + this.config._IMG_DIRTOCREATE + '/';
    }

    let myObs = Observable.create(obs => {
      if (file) { //sometimes file is already the path so just use it
        if (file && file.path) {
          sourcefile = file.path;
          newtarget = dir + file.name;
        } else {
          sourcefile = file;
          filename = file.replace(/^.*[\\\/]/, '');
          newtarget = dir + filename;
        }

        //const sourcefile = file.path || file;
        //const newtarget = dir + file.name;
        //that.fs.createReadStream(file.path).pipe(that.fs.createWriteStream('newLog.log'));
        that.copyFile(sourcefile, newtarget, x => {
          console.log('file copied successfully=>', newtarget)
          //cb(newtarget)
          obs.next(newtarget)
          obs.complete()
        });
        that.ipcRenderer.send('vb-savedragdropfile', file);
      }
    })
    return myObs
  }

  onWarning(err) {
    console.log('warning: %s', err.message || err)
  }

  onPaste(e) { }

  onFocus(e) { }

  onBlur() { }

  onVisibilityChange() { }
}

