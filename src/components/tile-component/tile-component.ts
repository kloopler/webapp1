import {Component, Output, EventEmitter} from '@angular/core';
import {IONIC_DIRECTIVES} from 'ionic-angular';

@Component({
  selector: 'tile',
  templateUrl: 'tile-component.html',
  //directives: [IONIC_DIRECTIVES] // makes all Ionic directives available to your component
})
export class TileComponent {
    //@Output() modeChangeEvt = new EventEmitter<string>();
    text;
  constructor() {
    this.text = 'Hello World';
  };
  
}
