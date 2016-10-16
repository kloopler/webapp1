import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';


@Injectable()
export class AppConfigService {

  // Here we declare the variables we'll be using.
  //public appTitle:string = 'Big Vision Board';
  public appStrings:any = {
    appTitle:'Big Vision Board',
    loginSignup:'New? Sign Up!',
    loginForgot:'Forgot Password?',
    loginBtn:'Sign In',
    loginBtnForgot:'I forgot my password',
    socSigninTitle:'or Sigin In With One Click',
    loginfrmEmailLbl:'Email',
    loginfrmEmailErr:'Please enter a valid email.',
    loginfrmPwdLbl:'Password',
    loginfrmPwdErr:'Your password needs more than 6 characters.',
  };
  
}
