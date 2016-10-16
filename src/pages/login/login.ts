import { Component } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
//import { NavController, LoadingController, AlertController } from 'ionic-angular';
import { FormGroup, AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Authservice } from '../../providers/authservice';
import { Signup } from '../../pages/signup/signup';
import { Homepage } from '../../pages/home/home';
import { Resetpwd } from '../../pages/resetpwd/resetpwd';
import { EmailValidator } from '../../validators/email';
import { AppConfigService } from '../../providers/config';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class Login {
  public config: any;
  public loginForm: FormGroup;
  public email: AbstractControl;
  public password: AbstractControl;
  appTitle: string = 'App Title Goes Here';
  emailChanged: boolean = false;
  passwordChanged: boolean = false;
  submitAttempt: boolean = false;
  loading: any;

  constructor(private router: Router, private params: Params, public authData: Authservice,
    public formBuilder: FormBuilder, public Config: AppConfigService) {

    /**
     * Creates a ControlGroup that declares the fields available, their values and the validators that they are going
     * to be using.
     *
     * I set the password's min length to 6 characters because that's Firebase's default, feel free to change that.
     */

    this.loginForm = formBuilder.group({
      email: ['dan@appsandcode.net', Validators.compose([Validators.required, EmailValidator.isValid])],
      password: ['KS1h1r1s', Validators.compose([Validators.minLength(6), Validators.required])]
    });
    this.email = this.loginForm.controls['email'];
    this.password = this.loginForm.controls['password'];
    this.config = Config.appStrings;


  }

  ngAfterViewInit() {
    console.log('inside ngAfterViewInit in login page');
    if (this.authData.authenticated) {
      //this.navCtrl.setRoot(Homepage);
      this.router.navigate(['/Homepage']);
    }
  }

  /**
   * Receives an input field and sets the corresponding fieldChanged property to 'true' to help with the styles.
   */
  elementChanged(input) {
    let field = input.inputControl.name;
    this[field + "Changed"] = true;
  }

  ionViewDidLoad() {
    console.log('Hello Login Page');
  }

  goToSignup() {
    //this.navCtrl.push(Signup);
    this.router.navigate(['/Signup']);
  }

  goToResetPassword() {
    //this.navCtrl.push(Resetpwd);
    this.router.navigate(['/Resetpwd']);
  }

  /**
     * If the form is valid it will call the AuthData service to log the user in displaying a loading component while
     * the user waits.
     *
     * If the form is invalid it will just log the form value, feel free to handle that as you like.
     */
  loginUser() {
    this.submitAttempt = true;

    if (!this.loginForm.valid) {
      console.log(this.loginForm.value);
    } else {
      this.authData.loginUser(this.loginForm.value.email, this.loginForm.value.password).then(authData => {
        //this.navCtrl.setRoot(Homepage);
        this.router.navigate(['/Homepage']);

      }, error => this.loginErr);

      /*this.loading = this.loadingCtrl.create({
        dismissOnPageChange: true,
      });*/
      this.loading.present();
    }
  }
  //login with facebook
  loginFacebook() {
    this.authData.loginFaceBook().then(authData => {
      //this.navCtrl.setRoot(Homepage);
      this.router.navigate(['/Homepage']);
    }, error => this.loginErr);

    /*this.loading = this.loadingCtrl.create({
      dismissOnPageChange: true,
    });*/
    this.loading.present();
  }

  //login with Google
  loginGoogle(): any {
    this.authData.loginGoogle().then(authData => {
      //this.navCtrl.setRoot(Homepage);
      this.router.navigate(['/Homepage']);
    }, error => this.loginErr);

    /*this.loading = this.loadingCtrl.create({
      dismissOnPageChange: true,
    });*/
    this.loading.present();
  }

  //login with twitter
  loginTwitter() {
    this.authData.loginTwitter().then(authData => {
      //this.navCtrl.setRoot(Homepage);
      this.router.navigate(['/Homepage']);
    }, error => this.loginErr);

    /*this.loading = this.loadingCtrl.create({
      dismissOnPageChange: true,
    });*/
    this.loading.present();
  }

  loginErr(error) {

    /*this.loading.dismiss().then(() => {
      let alert = this.alertCtrl.create({
        message: error.message,
        buttons: [
          {
            text: "Ok",
            role: 'cancel'
          }
        ]
      });
      alert.present();
    });*/
  }


}



