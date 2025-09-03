import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {Challenge} from '../interfaces/challenge';
import {ProgressionService} from '../services/progression.service';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {NgIf} from '@angular/common';
import {MatButton} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {TranslateCategoryPipe} from '../pipes/translate-category.pipe';

@Component({
  selector: 'app-challenge-dialog',
  imports: [
    MatIcon,
    MatTooltip,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButton,
    MatChipsModule,
    TranslateCategoryPipe,
    NgIf
  ],
  templateUrl: './challenge-dialog.component.html',
  styleUrl: './challenge-dialog.component.scss',
  standalone: true,
})
export class ChallengeDialogComponent {
  isStarting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Challenge,
    private ref: MatDialogRef<ChallengeDialogComponent>,
    private progressionService: ProgressionService
  ) {
  }

  starLine(n: number) {
    const v = Math.max(1, Math.min(5, Math.round(n)));
    return '★'.repeat(v) + '☆'.repeat(5 - v);
  }

  asNumber(v: string | number | undefined): number {
    if (v === undefined) return 0;
    return typeof v === 'string' ? Number(v) : v;
  }

  hasImpacts(): boolean {
    return this.data.co2EstimateKg !== undefined
      || this.data.waterEstimateL !== undefined
      || this.data.wasteEstimateKg !== undefined;
  }

  close() {
    this.ref.close();
  }

  startFromDialog(event: MouseEvent) {
    event.stopPropagation();
    if (!this.data.id || this.data.isInUserProgression) return;

    this.isStarting = true;
    this.progressionService.startChallenge(this.data.id).subscribe({
      next: () => {

        this.data.isInUserProgression = true;
        this.isStarting = false;

        this.ref.close({action: 'started', id: this.data.id});
      },
      error: (err) => {
        console.error('Erreur lors du démarrage du défi :', err);
        this.isStarting = false;
      }
    });
  }
}
