import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private swUpdate = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);

  constructor() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
      if (event.type === 'VERSION_READY') this.promptUser();
    });

    // optionnel : vérifier régulièrement
    setInterval(() => this.swUpdate.checkForUpdate(), 60 * 60 * 1000);
  }

  private promptUser() {
    const ref = this.snackBar.open(
      'Une nouvelle version est disponible',
      'Mettre à jour',
      { duration: 10000 }
    );

    ref.onAction().subscribe(() => this.activateAndReload());
  }

  private async activateAndReload() {
    try {
      await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }
}
