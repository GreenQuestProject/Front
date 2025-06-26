import {Component, OnInit} from '@angular/core';
import {Progression} from '../interfaces/progression';
import {Router} from '@angular/router';
import {ProgressionService} from '../services/progression.service';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {NavBarComponent} from '../nav-bar/nav-bar.component';
import {NgForOf, NgIf} from '@angular/common';
import {TranslateCategoryPipe} from '../pipes/translate-category.pipe';
import {MatButton} from '@angular/material/button';
import {TranslateStatusPipe} from '../pipes/translate-status.pipe';
import {FormsModule} from '@angular/forms';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-progression-list',
  imports: [
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatChipListbox,
    MatChipOption,
    NavBarComponent,
    NgForOf,
    NgIf,
    TranslateCategoryPipe,
    TranslateStatusPipe,
    FormsModule,
    MatButton,
    MatIcon,
  ],
  templateUrl: './progression-list.component.html',
  styleUrl: './progression-list.component.scss',
  standalone: true,
})
export class ProgressionListComponent implements OnInit {
  isLoading: boolean = false;
  progressions: Progression[] = [];
  categories: any = ["ecology", "health", "community", "education", "personal_development", "none"];
  status: any = ["pending", "in_progress", "completed", "failed"];
  selectedCategories: string[] = [];
  selectedStatus: string[] = [];
  notFoundMessage: string = "";

  constructor(private progressionService: ProgressionService, private router: Router) {
  }

  ngOnInit(): void {
    this.progressionService.getProgressions().subscribe({
      next: (data) => {
        this.categories = [...new Set(data.map(ch => ch.category))];
        this.selectedCategories = [...this.categories];
        this.status = [...new Set(data.map(ch => ch.status))];
        this.selectedStatus = [...this.status];
        this.progressions = data;
        //this.applyFilters();
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

  onCategorySelectionChange() {
    if (this.selectedCategories.length === 0) {
      this.progressions = [];
      return;
    }
    const selected = this.selectedCategories;
    this.isLoading = true;
    this.progressionService.getProgressions(selected).subscribe({
      next: (data) => {
        this.progressions = data;
        this.isLoading = false;
        this.notFoundMessage = "Aucun défi trouvé. Essayez de modifier vos filtres.";
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  onStatusSelectionChange() {
    if (this.selectedStatus.length === 0) {
      this.progressions = [];
      return;
    }
    const selected = this.selectedStatus;
    this.isLoading = true;
    this.progressionService.getProgressions(selected).subscribe({
      next: (data) => {
        this.progressions = data;
        this.isLoading = false;
        this.notFoundMessage = "Aucun défi trouvé. Essayez de modifier vos filtres.";
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let categories = this.selectedCategories;
    let status = this.selectedStatus;

    const allCategoriesSelected = categories.length === this.categories.length;
    const allStatusSelected = status.length === this.status.length;

    if (allCategoriesSelected) {
      categories = [];
    }

    if (allStatusSelected) {
      status = [];
    }

    const noCategorySelected = categories.length === 0 && !allCategoriesSelected;
    const noStatusSelected = status.length === 0 && !allStatusSelected;

    if (noCategorySelected && noStatusSelected) {
      this.progressions = [];
      this.notFoundMessage = "Aucun filtre sélectionné.";
      return;
    }

    this.isLoading = true;
    this.progressionService.getProgressions(categories, status).subscribe({
      next: (data) => {
        this.progressions = data;
        this.isLoading = false;
        this.notFoundMessage = "Aucune progression trouvée. Essayez de modifier vos filtres.";
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }


  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#FFA500'; // orange
      case 'in_progress':
        return '#007BFF'; // bleu
      case 'completed':
        return '#28A745'; // vert
      case 'failed':
        return '#DC3545'; // rouge
      default:
        return '#6C757D'; // gris
    }
  }


  valider(progression: Progression) {
    console.log('Valider progression', progression);
    // changer le status en "completed"
  }

  abandonner(progression: Progression) {
    console.log('Abandonner progression', progression);
    // changer le status en "failed" ou autre logique
  }


}
