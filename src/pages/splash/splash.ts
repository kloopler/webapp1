import { Component } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
//import {NavController, Loading} from 'ionic-angular';

import { Login } from '../../pages/login/login';
//import { ListPage } from '../../pages/list/list';
//import {ListPage} from '../list/list';


@Component({
  templateUrl: 'splash.html',
})
export class SplashPage {
  loadingText = 'Loading ...';
  splashDuration = 2000; //micro seconds to display splash
  splashImgSrc = 'assets/img/logo.png'
  constructor(private router: Router, private params: Params) { }


  /*presentLoading() {
    let loading = Loading.create({
      content: "Loadin please wait...",
      duration: this.splashDuration
    });
    return this.nav.present(loading);

  }*/

  ngAfterViewInit() {
    console.log('inside ngAfterViewInit in splash page');
    let loadingText = "Loading..."


    setTimeout(() => {
      //this.nav.setRoot(ListPage)
      //this.nav.setRoot(Login)
      this.router.navigate(['/login']);
    }, this.splashDuration);

    //this.presentLoading().then(
    //(unknown) => this.nav.setRoot(HomePage),
    // (unknown) => this.nav.setRoot(HomePage)
    //);
  }

}
