import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Import pages
import { SplashPage } from '../pages/splash/splash';
import { Homepage } from '../pages/home/home';
import { Login } from '../pages/login/login';
import { Resetpwd } from '../pages/resetpwd/resetpwd';
import { Signup } from '../pages/signup/signup';
//import { ListPage } from '../pages/list/list';
import { VisualizePage } from '../pages/visualize/visualize';
import { CreatePage } from '../pages/create/create';

//components
import { BoardListcard } from '../components/board-listcard/board-listcard';
import { TileComponent } from '../components/tile-component/tile-component';
// Import auth providers
import { Authservice } from '../providers/authservice';
// Import the AF2 Module
import { AngularFireModule, AuthProviders, AuthMethods } from 'angularfire2';

//others
import { AppConfigService } from '../providers/config';
import { EmailValidator } from '../validators/email';
import { AngularFire } from 'angularfire2';
//providers
import { MissionControl, IMissionCommand } from '../providers/mission-control/mission-control';
import { DpPersistence } from '../providers/dp-persistence/dp-persistence';
import { DpPersistenceFirebase } from '../providers/dp-persistence/dp-persistence-firebase';
import { DpphotosSrvc, IdpPhoto } from '../providers/dpphotos/dpphotos';
import { BoardService } from '../providers/board/board';
import { DpDataModel } from '../providers/dp-persistence/dp-datamodel';
import { DCFG } from '../providers/dpconfig/dpconfig';

// AF2 Settings
export const firebaseConfig = {
  apiKey: "AIzaSyBxAb3qvP_jqdpKYBxbMV4VDI6DoV0Hyjk",
  authDomain: "openaff-d0ebf.firebaseapp.com",
  databaseURL: "https://openaff-d0ebf.firebaseio.com",
  storageBucket: "openaff-d0ebf.appspot.com",
  messagingSenderId: "545666067590"
};

const myFirebaseAuthConfig = {
  //provider: AuthProviders.Password,
  //method: AuthMethods.Password
  provider: AuthProviders.Google,
  method: AuthMethods.Popup
}

@NgModule({
  declarations: [
    AppComponent,
    SplashPage,
    Homepage,
    Login,
    //ListPage,
    Resetpwd,
    Signup,
    BoardListcard,
    TileComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterialModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig, myFirebaseAuthConfig),
    AppRoutingModule
  ],
  providers: [
    Authservice,
    AppConfigService,
    Authservice,
    MissionControl,
    DpPersistence,
    DpphotosSrvc,
    BoardService,
    DpDataModel,
    DCFG,
    DpPersistenceFirebase
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
