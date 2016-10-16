
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Authservice } from '../../providers/authservice';
import { EmailValidator } from '../../validators/email';

@Component({
  selector: 'page-resetpwd',
  templateUrl: 'resetpwd.html'
})
export class Resetpwd {
  public resetPasswordForm;
  emailChanged: boolean = false;
  //passwordChanged: boolean = false;
  submitAttempt: boolean = false;


  constructor(public authData: Authservice, public formBuilder: FormBuilder,
    private router: Router, private params: Params) {

    this.resetPasswordForm = formBuilder.group({
      email: ['', Validators.compose([Validators.required, EmailValidator.isValid])],
    })
  }
  ionViewDidLoad() {
    console.log('Hello Resetpwd Page');
  }

  /**
   * Receives an input field and sets the corresponding fieldChanged property to 'true' to help with the styles.
   */
  elementChanged(input) {
    let field = input.inputControl.name;
    this[field + "Changed"] = true;
  }

  /**
   * If the form is valid it will call the AuthData service to reset the user's password displaying a loading
   *  component while the user waits.
   *
   * If the form is invalid it will just log the form value, feel free to handle that as you like.
   */
  resetPassword() {

    this.submitAttempt = true;

    if (!this.resetPasswordForm.valid) {
      console.log(this.resetPasswordForm.value);
    } else {
      this.authData.resetPassword(this.resetPasswordForm.value.email).then((user) => {
        /*let alert = this.alertCtrl.create({
          message: "We just sent you a reset link to your email",
          buttons: [
            {
              text: "Ok",
              role: 'cancel',
              handler: () => {
                this.nav.pop();
              }
            }
          ]
        });
        alert.present();*/

      }, (error) => {
        var errorMessage: string = error.message;
        /*let errorAlert = this.alertCtrl.create({
          message: errorMessage,
          buttons: [
            {
              text: "Ok",
              role: 'cancel'
            }
          ]
        });

        errorAlert.present();*/
      });
    }

  }
}
