import {Component, OnInit} from '@angular/core';
import {NavBarComponent} from '../nav-bar/nav-bar.component';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {Challenge} from '../interfaces/challenge';
import {Router} from '@angular/router';
import {ChallengeService} from '../services/challenge.service';
import {NgForOf, NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {
  MatChipListbox,
  MatChipOption,MatChipsModule
} from '@angular/material/chips';
import {FormsModule} from '@angular/forms';
import {TranslateCategoryPipe} from '../pipes/translate-category.pipe';
import {MatTooltip} from '@angular/material/tooltip';
import {ProgressionService} from '../services/progression.service';

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
    MatIcon,
    MatButton,
    MatChipListbox,
    MatChipOption,
    FormsModule,
    MatChipsModule,
    TranslateCategoryPipe,
    MatTooltip
  ],
  templateUrl: './challenge-list.component.html',
  styleUrl: './challenge-list.component.scss',
  standalone: true,
})
export class ChallengeListComponent implements OnInit {
  isLoading: boolean = false;
  challenges: Challenge[] = [];
  categories: any = ["ecology","health","community","education","personal_development","none"];
  selectedCategories: string[] = [];
  notFoundMessage: string = "";
  constructor(private challengeService: ChallengeService, private router: Router, private progressionService: ProgressionService) {

  }

  ngOnInit(): void {
    this.challengeService.getChallenges().subscribe({
      next: (data) => {
        this.categories = [...new Set(data.map(ch => ch.category))];
        this.selectedCategories = [...this.categories];
        this.challenges = data;
        this.notFoundMessage = "Aucun défi trouvé.";
      },
      error: (error) => {
        console.error(error);
        if (error.status === 401) {
          this.router.navigateByUrl('/login');
        }
      }
    });
  }

  start(id: number | undefined) {
    if (!id) return;

    this.progressionService.startChallenge(id).subscribe({
      next: (response) => {
        this.challenges = this.challenges.map(c =>
          c.id === id ? {...c, isInUserProgression: true} : c
        );
      },
      error: (error) => {
        console.error('Erreur lors du démarrage du défi :', error);
      }
    });
  }


    onCategorySelectionChange() {
      if (this.selectedCategories.length === 0) {
        this.challenges = [];
        return;
      }

    this.isLoading = true;
    this.challengeService.getChallenges(this.selectedCategories).subscribe({
      next: (data) => {
        this.challenges = data;
        this.isLoading = false;
        this.notFoundMessage = "Aucun défi trouvé. Essayez de modifier vos filtres.";
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
    }

}
