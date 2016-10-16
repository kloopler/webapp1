import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import {ElectronRenderer} from '../../providers/electron-renderer/electron-renderer';


export interface IdpPhoto {
  id: number,
  label?: string,
  url: string,
  active?: string,
  action?: string,
  icon?: string,
  show?: string
};


@Injectable()
export class DpphotosSrvc {
  data: any = null;
  baseurl: string = 'img/bundled/';

  constructor(public http: Http, private er: ElectronRenderer) { }

  //loads data from local json app data file saved to providers/persistence/app-data.json
  getAppBundledImgDataFromJSON(): Observable<IdpPhoto[]> {
    let appBundledImgData = [];
    let obs = Observable.create((o) => {
      //let dataObsv = this.http.get('../../providers/dp-persistence/app-data.json')
      let dataObsv = this.http.get('./app-data.json')
        .map((res: Response) => res.json());

      dataObsv.subscribe(
        (res) => {
          console.log('bundled photos fetched from json');
          res.map(x=>{
            let subdir = ''
            x.id = x.refID
            x.url =  x.urlfrag
          })
          o.next(res)
        },
        err => {
          console.log('An error occured while fetching bundled photos')
          o.error(err)
        },
        ()=>console.log('Completed bundled photos fetched from json')
      )
    });

    return obs;
  }

  getData(): Promise<IdpPhoto[]> {
    let that = this;
    let log = [
      { id: 0, url: this.baseurl + 'mn1.jpg' },
      { id: 0, url: this.baseurl + 'mn2.jpg' },
      { id: 0, url: this.baseurl + 'mn3.jpg' },
      { id: 0, url: this.baseurl + 'mn4.jpg' },
      { id: 0, url: this.baseurl + 'dp/2013-yamaha-yzf-r1-16.jpg' },
      { id: 0, url: this.baseurl + 'dp/6277603036_fc0da4be73_o-770x513.jpg' },
      { id: 0, url: this.baseurl + 'bills/100000-dollar-bill-front.jpg' }
    ];
    let p = new Promise(function (resolve: (farr: Array<IdpPhoto>) => void, reject) {
      that.er.readSavedImages().then(
        files => {
          files.map(x => log.push({ id: 0, url: x }));
          resolve(log);
        },
        err => {
          console.log(err);
          reject(err);
        }
      );
      //return log;
    });
    return p;
  }

  load() {
    if (this.data) {
      // already loaded data
      return Promise.resolve(this.data);
    }

    // don't have the data yet
    return new Promise(resolve => {
      // We're using Angular Http provider to request the data,
      // then on the response it'll map the JSON data to a parsed JS object.
      // Next we process the data and resolve the promise with the new data.
      this.http.get('path/to/data.json')
        .map(res => res.json())
        .subscribe(data => {
          // we've got back the raw data, now generate the core schedule data
          // and save the data for later reference
          this.data = data;
          resolve(this.data);
        });
    });
  }
}

