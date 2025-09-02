import {Component, inject} from '@angular/core';
import {InstallPromptService} from '../services/install-prompt.service';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-install-prompt',
  imports: [CommonModule, MatIconModule],
  templateUrl: './install-prompt.component.html',
  styleUrl: './install-prompt.component.scss',
  standalone: true
})
export class InstallPromptComponent {
  svc = inject(InstallPromptService);
}
