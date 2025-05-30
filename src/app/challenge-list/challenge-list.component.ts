import {Component, OnInit} from '@angular/core';
import {NavBarComponent} from '../nav-bar/nav-bar.component';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {Challenge} from '../interfaces/challenge';
import {Router} from '@angular/router';
import {ChallengeService} from '../services/challenge.service';
import {NgForOf, NgIf} from '@angular/common';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-challenge-list',
  imports: [
    NavBarComponent,
    MatCard,
    MatCardHeader,
    MatCardContent,
    NgIf,
    NgForOf,
    MatCardActions,
    MatIconButton,
    MatIcon
  ],
  templateUrl: './challenge-list.component.html',
  styleUrl: './challenge-list.component.scss',
  standalone: true,
})
export class ChallengeListComponent implements OnInit {
  isLoading: boolean = false;
  challenges: Challenge[] = [];

  constructor(private challengeService: ChallengeService, private router: Router) {

  }

  ngOnInit(): void {
    this.challengeService.getChallenges().subscribe({
      next: (data) => {
        this.challenges = data;
      },
      error: (error) => {
        console.log(error);
        if(error.status == 401){
          this.router.navigateByUrl('/login');
        }else{
          console.error('Error while getting recipes:', error);
        }
      }
    });
  }

  start(id: number | undefined) {

  }
}
