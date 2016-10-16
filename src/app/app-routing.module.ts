import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Import pages
import { SplashPage } from '../pages/splash/splash';
import { Homepage } from '../pages/home/home';
import { Login } from '../pages/login/login';
import { Resetpwd } from '../pages/resetpwd/resetpwd';
import { Signup } from '../pages/signup/signup';
//import { ListPage } from '../pages/list/list';
import { VisualizePage } from '../pages/visualize/visualize';
import { CreatePage } from '../pages/create/create';


@NgModule({
    imports: [
        RouterModule.forRoot([

            { path: 'home', component: Homepage },
            { path: 'login', component: Login },
            { path: '', component: Login },
            { path: '**', component: SplashPage }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }
