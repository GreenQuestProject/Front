import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';

type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY';

@Component({
  selector: 'app-reminder-dialog',
  imports: [CommonModule, FormsModule, MatDialogModule, MatButton, MatLabel, MatInput, MatSelect, MatOption, MatFormField],
  templateUrl: './reminder-dialog.component.html',
  styleUrl: './reminder-dialog.component.scss',
  standalone: true,
})
export class ReminderDialogComponent {
  when = '';
  recurrence: Recurrence = 'NONE';

  constructor(
    private ref: MatDialogRef<ReminderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { progressionId: number }
  ) {
  }

  close() {
    this.ref.close();
  }

  save() {
    this.ref.close({when: this.when, recurrence: this.recurrence});
  }
}
