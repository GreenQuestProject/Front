import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {PwaUpdateService} from './services/pwa-update.service';
import {PushBridgeService} from './services/push-bridge.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent {
  title = 'GreenQuest';
  constructor(private _update: PwaUpdateService, _bridge: PushBridgeService) {}
}
