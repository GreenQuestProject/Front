import {Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "../services/auth.service";
import {Router, RouterLink} from "@angular/router";
import {User} from "../interfaces/user";
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [
    MatProgressSpinner,
    RouterLink,
    MatButton,
    MatFormField,
    ReactiveFormsModule,
    MatInput,
    NgIf,
    MatError,
    MatLabel
  ],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]  ],
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    if (this.registerForm.valid) {
      const newUser: User = this.registerForm.value;
      this.authService.register(newUser).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigateByUrl('/login');
        },
        error: (error) => {
          this.isLoading = false;

          console.error('Error while registering',error);

          const violations = (error.error?.violations ?? []) as {propertyPath: string; title: string}[];

          this.errorMessage = violations[0]?.title
            || (error.error?.detail ?? 'Une erreur inattendue s\'est produite. Veuillez réessayer ultérieurement.');

        }
      });
    } else {
      this.isLoading = false;
      this.errorMessage = 'Veuillez remplir correctement le formulaire avant de le soumettre.';
      console.log('Invalid form');
    }
  }
}
