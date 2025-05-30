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
import {TranslateCategoryPipe} from '../translate-category.pipe';

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
    TranslateCategoryPipe
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
  constructor(private challengeService: ChallengeService, private router: Router) {

  }

  ngOnInit(): void {
    this.challengeService.getChallenges().subscribe({
      next: (data) => {
        this.challenges = data;
        this.categories = [...new Set(data.map(ch => ch.category))];
        this.selectedCategories = [...this.categories];
        this.onCategorySelectionChange();
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

  }

    onCategorySelectionChange() {
     if (this.selectedCategories.length === 0) {
    this.challenges = [];
    return;
  }
    const selected = this.selectedCategories;
    this.isLoading = true;
    this.challengeService.getChallenges(selected).subscribe({
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
