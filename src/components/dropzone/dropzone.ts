//credit: https://github.com/auth0-blog/angular2-electron
import {Component} from '@angular/core';

@Component({
  selector: 'dropzone',
  templateUrl: 'dropzone.html'
})
export class Dropzone {
   images:Array<Object> = [];
   isDragOver:boolean=false; //set to true to set class style to show active drop zone style
  
  constructor() { }

/*ondragenter(){
  this.isDragOver = true;
}
ondragleave(){
  this.isDragOver = true;
}*/

  handleDrop(e) {
    var files:File = e.dataTransfer.files;
    var self = this;
    Object.keys(files).forEach((key) => {
      if(files[key].type === "image/png" || files[key].type === "image/jpeg") {
        self.images.push(files[key]);
      }
      else {
        alert("File must be a PNG or JPEG!");
      }
    });
    return false;
  }

  imageStats() {
    let sizes:Array<number> = [];
    let totalSize:number = 0;
    this.images.forEach((image:File) => sizes.push(image.size));

    sizes.forEach((size:number) => totalSize += size);

    return {
      size: totalSize,
      count: this.images.length
    }

  }

}
