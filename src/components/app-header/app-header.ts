import { Component } from '@angular/core';
//import { IONIC_DIRECTIVES } from 'ionic-angular';

@Component({
  selector: 'app-header',
  templateUrl: 'app-header.html',
  //directives: [IONIC_DIRECTIVES] // makes all Ionic directives available to your component
})
export class AppHeader {
  text;
  constructor() {
    this.text = 'Click here to add board title';
  }
}
