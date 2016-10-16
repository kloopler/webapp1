import {Component,Input} from '@angular/core';

@Component({
  selector: 'board-listcard',
  templateUrl: 'board-listcard.html'
})
export class BoardListcard {
  @Input() board:any;
  @Input() properties:any;

  constructor() {
    //this.text = 'Hello World';
    console.log(this.board);
  }
  ngAfterViewInit(){
    console.log(this.board);
  }
}
