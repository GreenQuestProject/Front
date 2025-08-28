import {Component, OnInit} from '@angular/core';
import {Progression} from '../interfaces/progression';
import {Router} from '@angular/router';
import {ProgressionService} from '../services/progression.service';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {NavBarComponent} from '../nav-bar/nav-bar.component';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {TranslateCategoryPipe} from '../pipes/translate-category.pipe';
import {MatButton} from '@angular/material/button';
import {TranslateStatusPipe} from '../pipes/translate-status.pipe';
import {FormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {ChallengeCategory} from '../interfaces/challenge-category';
import {ChallengeStatus} from '../interfaces/challenge-status';
import {forkJoin, switchMap} from 'rxjs';
import {ChallengeService} from '../services/challenge.service';
import {tap} from 'rxjs/operators';
import {MatTooltip} from '@angular/material/tooltip';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { RemindersService } from '../services/reminders.service';
import { firstValueFrom } from 'rxjs';
import { ReminderDialogComponent} from '../reminder-dialog/reminder-dialog.component';

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
    MatTooltip,
    MatDialogModule,
    DatePipe
  ],
  templateUrl: './progression-list.component.html',
  styleUrl: './progression-list.component.scss',
  standalone: true,
})
export class ProgressionListComponent implements OnInit {
  isLoading: boolean = false;
  progressions: Progression[] = [];
  categories: ChallengeCategory[] = [];
  status: ChallengeStatus[] = [];
  selectedCategories: string[] = [];
  selectedStatus: string[] = [];
  notFoundMessage: string = "";


  constructor(
    private progressionService: ProgressionService,
    private router: Router,
    private challengeService: ChallengeService,
    private dialog: MatDialog,
    private remindersService: RemindersService) {
  }

  ngOnInit(): void {
    forkJoin([
      this.challengeService.getChallengeCategories(),
      this.challengeService.getChallengeStatus(),
    ]).pipe(
      tap(([categories, statuses]) => {
        this.categories = categories;
        this.status = statuses;

        // sélection par défaut : toutes les catégories, tous les statuts sauf 'failed'
        this.selectedCategories = categories.map(c => c.value);
        this.selectedStatus = statuses.map(s => s.value).filter(s => s !== 'failed');
      }),
      switchMap(() => this.progressionService.getProgressions()),
        tap(initial => {
          this.progressions = initial;
      }),
      switchMap(() =>
        this.progressionService.getProgressions(this.selectedCategories, this.selectedStatus)
      )
    ).subscribe({
      next: data => {
        this.progressions = data;
        this.notFoundMessage = "Aucune progression trouvée. Essayez de modifier vos filtres.";
        this.isLoading = false;
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
        if (err.status === 401) this.router.navigateByUrl('/login');
      }
    });

    /*
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
    });*/
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
    const allowedCategories = this.categories.map(c => c.value);
    const allowedStatuses   = this.status.map(s => s.value);

    this.selectedCategories = this.selectedCategories.filter(cat => allowedCategories.includes(cat));
    this.selectedStatus     = this.selectedStatus.filter(st  => allowedStatuses.includes(st));

    this.applyFilters();
  }

  async openReminderDialog(prog: Progression) {
    const ref = this.dialog.open(ReminderDialogComponent, {
      data: { progressionId: prog.id  },
    });
    const res = await firstValueFrom(ref.afterClosed());
    if (!res) return;

    try {
      const whenISO = new Date(res.when).toISOString();
      const out = await this.remindersService.createByProgression(prog.id!, whenISO, res.recurrence);
      // Mémorise localement pour l’UX
      (prog as any).reminderId = out.id;
      (prog as any).nextReminderUtc = whenISO;
      (prog as any).recurrence = res.recurrence;
    } catch (e: any) {
      alert(e?.error?.error ?? 'Impossible de planifier le rappel');
    }
  }

  async snoozeReminder(prog: Progression) {
    const id = (prog as any).reminderId;
    if (!id) return;
    try {
      await this.remindersService.snooze(id);
      // feedback immédiat (l’heure exacte vient du serveur, on avance localement de +10min)
      if ((prog as any).nextReminderUtc) {
        const next = new Date((prog as any).nextReminderUtc).getTime() + 10*60*1000;
        (prog as any).nextReminderUtc = new Date(next).toISOString();
      }
    } catch {
      alert('Échec du snooze');
    }
  }

  async completeReminder(prog: Progression) {
    const id = (prog as any).reminderId;
    if (!id) return;
    try {
      await this.remindersService.complete(id);
      // Si récurrence NONE: plus de rappel
      (prog as any).reminderId = null;
      (prog as any).nextReminderUtc = null;
    } catch {
      alert('Échec de la complétion du rappel');
    }
  }
}
