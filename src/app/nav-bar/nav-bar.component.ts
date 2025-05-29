import {Component} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {AuthService} from "../services/auth.service";
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatDivider} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-nav-bar',
  imports: [
    MatDivider,
    MatButton,
    RouterLink,
    MatAnchor,
    MatIconModule
  ],
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {

  constructor(private authService: AuthService, private router: Router) {
  }

  logout(): void {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (confirmed) {
      this.authService.logout();
    }
  }
}
