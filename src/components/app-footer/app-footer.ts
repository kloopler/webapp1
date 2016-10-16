import { Component } from '@angular/core';
//import { IONIC_DIRECTIVES } from 'ionic-angular';


@Component({
  selector: 'app-footer',
  templateUrl: 'app-footer.html',
  //directives: [IONIC_DIRECTIVES] // makes all Ionic directives available to your component
})
export class AppFooter {
  text;
  constructor() {
    this.text = 'Hello World from appFooter';
  }
}
