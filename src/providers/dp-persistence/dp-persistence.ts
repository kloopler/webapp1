import { Injectable } from '@angular/core';
//import {Storage, SqlStorage} from 'ionic-angular';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { DCFG } from '../../providers/dpconfig/dpconfig';
import moment from 'moment';
//import PouchDB from 'pouchdb-browser';
//import PouchDB from 'pouchdb';

//fire base data structure - imported into firebase
var dataStructure = {
  bigvisionboard: {
    appsettings: {
      version: '1.0.0'
    },
    appdata: {
      version: '1.0.0'
    },
    users: {
      defaultuser: {
        email: 'app@bigvisionboard.com',
        username: 'app',
        lastaccessed: '',
        lastmodified: '',
        profileid: '',
        photoid: '',
        tagline: '',
        joined: ''
      },
      boards: {},
      photos: {},
      profiles: {},
      quotes: {},
      affirmations: {},
      notifications: {},
    }
  }
}

//declare var pouchdb: any;
//var PouchDB = pouchdb;
//declare var require: any;
//let PouchDB = require('pouchdb');
//PouchDB.plugin(require('pouchdb-upsert'));
//for chrome pouchdb inspector to work need to expose pouchdb on the window as written here https://chrome.google.com/webstore/category/apps
//window["PouchDB"] = PouchDB;

@Injectable()
export class DpPersistence {
  db;
  remoteDbUrl;
  username;
  pwd;
  dburl;
  constructor(public http: Http) {

    this.db = {}//new PouchDB('dpVB2');
    this.username = 'API KEY';
    this.pwd = 'API PASSWORD';
    //this.dburl = 'https://MY-BLUEMIX-URL-bluemix.cloudant.com/mytestdb';
    this.remoteDbUrl = 'http://localhost:5984/vb';

    let options = {
      live: true,
      retry: true,
      continuous: true,
      /*auth: {
        username: this.username,
        password: this.pwd
      }*/
    };

    //this.db.replicate.to(this.remoteDbUrl, options);

  }
  genericFailFxn(err, response) {
    console.log(err || response);
  }



  createItmDBId(idLevel = 0, entityType = 'nonEntity', userName = DCFG.DF.userName): string {
    let id = '';
    let dt = moment().format(DCFG.DT.YMDFormat);
    let tokens = [DCFG.APPINFO.id, entityType, userName, dt, moment().unix()];
    let ids = [
      DCFG.APPINFO.id,
      [DCFG.APPINFO.id, entityType].join(DCFG.DF.delim),
      [DCFG.APPINFO.id, entityType, userName].join(DCFG.DF.delim),
      [DCFG.APPINFO.id, entityType, userName, dt].join(DCFG.DF.delim),
      [DCFG.APPINFO.id, entityType, userName, dt].join(DCFG.DF.delim)
    ];

    return ids[idLevel];
  }

  save(itm): Observable<any> {
    return this.put(itm);
  }

  getAllEntityLogs(entityType, userName, container): Observable<any> {
    let idPrefix = this.createItmDBId(2, entityType, userName);
    return this.getAllLogsByIdPrefixFullData(container, idPrefix)
  }

  getAllLogsByIdPrefixFullData(container, idPrefix) {
    return this.dbGetAllByIdFrag(idPrefix).map(function (docs: any) {
      container.length = 0;
      docs.rows.map(rec => {
        let val = rec.doc;
        if (val.dateTimeCreated)
          val.dateTimeCreated = new Date(val.dateTimeCreated);
        container.push(val);
      });
      return container;
    });

    //return obs;
  }

  dbGetAllByIdFrag(idFrag) {
    let opts = {
      include_docs: true,
      startkey: idFrag,
      endkey: idFrag + '\uffff'
    };
    return this.getAll(opts);
  }

  getAll(options) {
    var opts = options || {
      include_docs: false
    };
    return Observable.fromPromise(this.db.allDocs(opts));
  }

  deleteItem(item) {
    if (item && item._id !== undefined) {
      return Observable.fromPromise(
        this.db.remove(item)
      )
    } else {
      //return Observable.empty();
      return Observable.from([]);
    }

  }

  put(itm): Observable<any> {
    let entityTofbRefsMap = {
      boards: ['/boards/'],
      board: '/boards/' + itm._id,
      users: '/users',
      user: '/user/' + itm._id,
    }

    return Observable.fromPromise(this.db.upsert(itm._id, function (doc) {
      if (itm.hasChangedSinceSave !== false) {
        Object.assign(doc, itm);
        doc.hasChangedSinceSave = false;

        //also save to the server
        if (DCFG.APPINFO.sendToRemoteServerRealTime) {
          //TODO
        }
        if (DCFG.APPINFO.saveToDisc) {
          //TODO saveEntryToDisc(itm);
        }
        return doc;
      }
      return false; // don't update the doc; it's changed since last save
    }));
  }
}

