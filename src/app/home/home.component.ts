import {Component, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {NavBarComponent} from '../nav-bar/nav-bar.component';
@Component({
  selector: 'app-home',
  imports: [
    NavBarComponent
  ],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  constructor(private router: Router) {

  }

}
