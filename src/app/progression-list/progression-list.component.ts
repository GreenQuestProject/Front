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
        this.selectedStatus = this.status.filter((s: string) => s !== 'failed');
        this.progressions = data;
        this.notFoundMessage = "Aucun défi trouvé.";
        this.applyFilters();
      },
      error: (error) => {
        console.error(error);
        if (error.status === 401) {
          this.router.navigateByUrl('/login');
        }
      }
    });
  }

  applyFilters() {
    const categories = this.selectedCategories;
    const status = this.selectedStatus;

    // Si aucun filtre sélectionné, on affiche rien
    if (categories.length === 0 || status.length === 0) {
      this.progressions = [];
      this.notFoundMessage = "Aucune progression trouvée. Essayez de modifier vos filtres.";
      return;
    }

    this.isLoading = true;
    this.progressionService.getProgressions(categories, status).subscribe({
      next: (data) => {
        this.progressions = data;
        this.isLoading = false;
        this.notFoundMessage = "Aucune progression trouvée. Essayez de modifier vos filtres."
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


  validate(id: number | undefined) {
    if (!id) return;

    this.progressionService.updateStatus(id, 'completed').subscribe({
      next: (response) => {
        this.progressions = this.progressions.map(p =>
          p.id === id ? {...p, status: "completed"} : p
        );
        this.refreshFilters();
      },
      error: (error) => {
        console.error('Erreur lors du démarrage du défi :', error);
      }
    });
  }

  remove(id: number | undefined) {
    if (!id) return;

    this.progressionService.updateStatus(id, 'failed').subscribe({
      next: (response) => {
        this.progressions = this.progressions.map(p =>
          p.id === id ? {...p, status: "failed"} : p
        );
        this.refreshFilters();
      },
      error: (error) => {
        console.error('Erreur lors du démarrage du défi :', error);
      }
    });
  }

  private refreshFilters() {
    this.categories = [...new Set(this.progressions.map(ch => ch.category))];
    this.status = [...new Set(this.progressions.map(ch => ch.status))];

    this.selectedCategories = this.selectedCategories.filter(cat => this.categories.includes(cat));
    this.selectedStatus = this.selectedStatus.filter(stat => this.status.includes(stat));

    this.applyFilters();
  }
}
