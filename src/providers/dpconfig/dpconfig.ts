import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Configuration file for app. All static app config stuff goes here.

*/
@Injectable()
export class DCFG {
  data: any = null;

  public static APPINFO = {
				isDebug: false, // IMPORTANT!! change to false for production
				saveToDisc: true,//IMPORTANT!! change to true for production
				sendToRemoteServerRealTime: false,//false for prod
				dbShdReplicate: false,//false for prod
				shdAutoDismissPopups: false,
    //* IMPORTANT !! ALL APPS MUST SPECIFY APP ID */
				id: 'dpBigVB20160730', //format is appNameYearMonthDay
				title: 'Big Vision Board',
				version: '1.0.2016.07.30',
				subtitle: 'Believe and Achieve',
				fileFrag: 'electBigVB',
				appType: 'electBigVB',
				dbAccntName: 'dpankani',
				dbApiKey: 'mellsespengeryingetheryo',
				dbApiPass: '2a9069c4c949a41516db4299c17841b442823612',
				dbName: 'electBigVB'
  };
  public static DT = {
    YMDFormat: 'YYYY_MM_DD',
				MediumDateTimeFormat: 'MM/DD/YYYY hh:mm',
				LongDateTimeFormat: "dddd, MMMM Do YYYY, h:mm a",
				DayFormat1: 'MM_DD_YYYY',
    DayFormat2: 'MM/DD/YYYY',
    Short24HourTimeFormat: 'HH:mm:ss',
  }
    public static DF = {
    delim:'_',
    userName:'anonymous'
  }

  constructor(public http: Http) { }

}

