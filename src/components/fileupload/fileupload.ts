import {Component} from '@angular/core';
import {UPLOAD_DIRECTIVES} from 'ng2-uploader/ng2-uploader';

@Component({
  selector: 'fileupload',
  templateUrl: 'fileupload.html',
  //directives: [UPLOAD_DIRECTIVES]
})
export class Fileupload {
  uploadFile: any;
  options: Object = {
    url: 'http://localhost:10050/upload'
  }

  constructor() {
    //this.text = 'Hello World';
  }

  handleUpload(data):void{
    if(data && data.response){
      console.log('data received');
      this.uploadFile = data;
    }
  }

}
