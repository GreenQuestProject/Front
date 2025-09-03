import {Component} from '@angular/core';
import {NavBarComponent} from '../nav-bar/nav-bar.component';
import {NotificationsSettingsComponent} from '../notifications-settings/notifications-settings.component';

@Component({
  selector: 'app-parameters',
  imports: [
    NavBarComponent,
    NotificationsSettingsComponent
  ],
  templateUrl: './parameters.component.html',
  styleUrl: './parameters.component.scss',
  standalone: true,
})
export class ParametersComponent {

}
