import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
// Import the AF2 Module
import { FirebaseAuthState, AngularFireModule, AuthProviders, AuthMethods } from 'angularfire2';
import { AngularFire } from 'angularfire2';


@Injectable()
export class Authservice {
  private authState: FirebaseAuthState = null;
  // Here we declare the variables we'll be using.
  public fireAuth: any;
  public userProfile: any;
  public user = {};
  public isAuthenticated = false;
  public displayName: string = '';
  public photoUrl: string = '';

  constructor(public http: Http, public af: AngularFire) {
    console.log('Hello Authservice Provider');

    this.fireAuth = firebase.auth();
    this.userProfile = firebase.database().ref('/userProfile');
    this.af.auth.subscribe(user => {
      if (user) {
        // user logged in
        this.user = user;
        this.authState = user;
      }
      else {
        // user not logged in
        this.user = {};
      }
    });
  }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  get id(): string {
    return this.authenticated ? this.authState.uid : '';
  }

  //save logged in state to local storage
  private storeAuthInfo(authState: FirebaseAuthState): FirebaseAuthState {
    if (authState) {
      this.displayName = authState.auth.displayName;
      this.photoUrl = authState.auth.photoURL;
      this.isAuthenticated = true;
      if (authState.google) {
        localStorage.setItem('idToken', (authState.google as any).idToken);
        localStorage.setItem('accessToken', (authState.google as any).accessToken);
      }
    }
    return authState;
  }

  login(opts): firebase.Promise<FirebaseAuthState> {

    const idToken = localStorage.getItem('idToken');
    const accessToken = localStorage.getItem('accessToken');

    if (idToken && accessToken) {

      const authConfig = {
        method: AuthMethods.OAuthToken,
        provider: AuthProviders.Google
      };
      const credential = firebase.auth.GoogleAuthProvider.credential(idToken, accessToken);
      return this.af.auth.login(credential, authConfig).then((authState) => {
        console.log("Successful Token-based Login");
        return this.storeAuthInfo(authState);
      }).catch((err) => {
        console.log("Error with auth token: " + err, " Clearing cached token..");
        localStorage.setItem('idToken', '');
        localStorage.setItem('accessToken', '');
      });
    } else {
      if (opts.provider === 'email') {
        return this.fireAuth.signInWithEmailAndPassword(opts.email, opts.password);
      }
      // fall through to popup auth
      return this.af.auth.login({
        method: AuthMethods.Popup
      }).then((authState) => {
        console.log("Successful OAuth-based Login");
        return this.storeAuthInfo(authState);
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  //login with Facebook
  loginFaceBook(): any {
    return this.login({
      provider: AuthProviders.Facebook,
      method: AuthMethods.Redirect
    });
  }

  //login with Google
  loginGoogle(): any {
    return this.login({
      provider: AuthProviders.Google,
      method: AuthMethods.Redirect
    });
  }

  //login with Twitter
  loginTwitter(): any {
    return this.login({
      provider: AuthProviders.Twitter,
      method: AuthMethods.Redirect
    });
  }

  //login with email
  loginUser(email: string, password: string): any {
    //pass bogus provider and method but valid email and password to login with
    return this.login({
      provider: 'email',
      method: 'dpMadeUp',
      email: email,
      password: password
    });
    //return this.fireAuth.signInWithEmailAndPassword(email, password);
  }

  signupUser(email: string, password: string): any {
    return this.fireAuth.createUserWithEmailAndPassword(email, password)
      .then((newUser) => {
        this.userProfile.child(newUser.uid).set({ email: email });
      });
  }

  resetPassword(email: string): any {
    return this.fireAuth.sendPasswordResetEmail(email);
  }

  logoutUser(): any {
    return this.fireAuth.signOut();
  }

}
