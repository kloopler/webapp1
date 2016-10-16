import { Injectable } from '@angular/core';

@Injectable()
export class DpDataModel {

    //apptype:string;
    //userName:string;
    //entityType:string;
    payLoad: any = {};
    properties: any = {};
    dateTimeCreated: Date;
    dateTimeModified: Date;
    dateTimeUsed: Date;
    isDeleted: boolean;
    Selected: boolean; //used in checked lists

    constructor(
        public _id: string,
        public entityType: string,
        public subType: string,
        public appType: string = 'unknownApp',
        public userName: string = 'unknownUser',
        public id: string = 'unknownID',
        public version: string = '0.0.1') {

        this.dateTimeCreated = new Date();
        this.dateTimeModified = new Date();
        this.dateTimeUsed = new Date();
        this.isDeleted = false;

    }
}

