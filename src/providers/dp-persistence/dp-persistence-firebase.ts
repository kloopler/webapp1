import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { DCFG } from '../../providers/dpconfig/dpconfig';
import * as moment from 'moment';
import { Authservice } from '../../providers/authservice';
import { AngularFire, AngularFireDatabase, AngularFireModule, AuthProviders, AuthMethods, FirebaseRef, FirebaseListObservable } from 'angularfire2';


@Injectable()
export class DpPersistenceFirebase {
  //database references
  appdbroot = '/bigvisionboard/';
  dbRef: any = firebase.database();
  appDbRef: any = firebase.database().ref(this.appdbroot);
  usersRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'users');
  userBoardsRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'user-boards');
  defaultBoardsRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'default-boards');
  defaultBoardsJSONRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'default-boardsJSON');
  boardsRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'boards');
  threadsRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'threads');
  commentsRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'comments');
  statisticsRef: any;// = FirebaseRef.database().ref(this.appdbroot + 'statistics');
  storageRef: any;// = FirebaseRef.storage().ref();
  connectionRef: any;// = FirebaseRef.database().ref('.info/connected');*/
  connected: boolean = false;

  dbroot = '/bigvisionboard/';
  //db;
  remoteDbUrl;
  uid: string;
  defaultEntityType = 'board';

  constructor(public http: Http, public af: AngularFire,
    private db: AngularFireDatabase, public authSrvc: Authservice) {
    console.log('Hello DpPersistenceFirebase Provider');
    //this.db = af.database;

    //this.dbRef = this.af.database().ref();

    //this.checkFirebaseConnection();

    if (authSrvc.id) {
      console.log('this is auth user in dp-persistence-firebase->', authSrvc.user);
      this.uid = authSrvc.id;
    }
  }

  //ref - https://github.com/chsakell/ionic2-angular2-firebase/blob/master/src/shared/services/data.service.ts
  /*checkFirebaseConnection() {
    try {
      var self = this;
      var connectedRef = self.getConnectionRef();
      connectedRef.on('value', function (snap) {
        console.log(snap.val());
        if (snap.val() === true) {
          console.log('Firebase: Connected:');
          self.connected = true;
        } else {
          console.log('Firebase: No connection:');
          self.connected = false;
        }
      });
    } catch (error) {
      self.connected = false;
    }
  }
  isFirebaseConnected() {
    return this.connected;
  }
  getDatabaseRef() {
    // return this.dbRef;
    return this.db;
  }

  /*getConnectionRef() {
    return this.connectionRef;
  }

  goOffline() {
    this.db.goOffline();
  }

  goOnline() {
    this.db.goOnline();
  }*/

  genericFailFxn(err, response) {
    console.log(err || response);
  }

  getItemFromDBOnce(dbRef, childRef = ''): Observable<any> {
    let obs = Observable.create(observer => {
      let comboRef = childRef === '' ? dbRef : dbRef.child(childRef);

      let prom = comboRef.once('value');
      prom.then(snapshot => {
        console.log('inside getItemFromDBOnce snapshot ->', snapshot.val());
        observer.next(snapshot.val());
        observer.complete()
      }, err => {
        console.log('inside getDefaultBoards err ->', err);
        observer.error(err);
      });
    });
    return obs; //Observable.fromPromise(<Promise<any>>prom);
  }

  getItemFromDBObj(dbRef): Observable<any> {
    return this.db.object(dbRef)
      .do(console.log)
    //.map(Lesson.fromJsonList);

  }

  //this is for the default json used to create default boards intially
  getDefaultBoardsJSON(): Observable<any> {
    return this.getItemFromDBOnce(this.defaultBoardsJSONRef);
  }

  //fetches serialized default boards
  getDefaultBoardsActual(): Observable<any> {
    return this.getItemFromDBOnce(this.defaultBoardsRef);
  }

  //fetches serialized user boards
  getUserBoardsActual(): Observable<any> {
    return this.getItemFromDBOnce(this.userBoardsRef, this.uid);
  }

  //fetches both user-created and default boards
  getAllUserBoards(): Observable<any> {
    let obs = [];
    //1 fetch default boards
    obs.push(this.getDefaultBoardsActual());
    //2. fetch user boards
    obs.push(this.getUserBoardsActual());
    let combObs = Observable.concat(...obs);
    return combObs;
  }


  //TODO provide real implementation
  deleteItem(dbRef): Observable<any> {
    return this.db.object(dbRef).remove();
  }

  //begin write of specific entities
  //--------------------------------------------------
  saveBoard(opts): Observable<any> {
    //opts.payload.createdAt = opts.payload.createdAt || this.db.ServerValue.TIMESTAMP;
    //opts.payload.updatedAt = this.db.ServerValue.TIMESTAMP;
    return this.writeNewUserItm(this.uid, opts.payload, 'boards', true, opts.title, opts.description)
  }

  // [START write_fan_out]
  //e.g. entityTypeRef = '/posts/' also writes to '/user-posts/' by default
  writeNewUserItm(uid, payload, entityTypeRef = 'posts', shdFanout = true, title = "Unknown title", description = "Unknown Description") {
    //1st item in array is getting second item is for setting if multiple then supoorts fanout
    let entityTofbRefsMap = {
      //format:[getRef,[setRef,setFanoutRef]]
      boards: ['/boards/', ['/boards/']],
      board: [`${this.dbroot}/boards/${payload._id}/`, ['/boards/' + payload._id, '/boards/' + payload._id, 'users-boards/' + payload.uid, '/boards/']],
    }
    // A generic post entry.
    let postData = {
      uid: uid,
      payload: payload,
      title: title,
      starCount: 0,
      viewCount: 0,
      useCount: 0,
      //authorPic: picture
    };

    // Get a key for a new Post.
    //let newPostKey = this.db.ref(this.dbroot).child(entityTypeRef).push().key;

    // Write the new entityTypeRef's data simultaneously in the entityTypeRef list and the user's entityTypeRef list if shdFanout is true.
    let updates = {};
    updates[this.dbroot + '/' + entityTypeRef + '/' + newPostKey] = postData;
    if (shdFanout) {
      updates[this.dbroot + '/users/' + uid + '/' + '/' + entityTypeRef + '/' + newPostKey] = postData;
    }

    return this.db.ref().update(updates);
  }
}
