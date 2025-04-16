import { Component } from '@angular/core';
import {User} from "../interfaces/user";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Router, RouterLink} from "@angular/router";
import { AuthService } from "../services/auth.service";
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatInput} from '@angular/material/input';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    RouterLink,
    MatButton,
    MatInput,
    MatProgressSpinner,
    MatError,
    MatLabel,
    NgIf
  ],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm:FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  constructor(private fb:FormBuilder,
              private authService: AuthService,
              private router: Router) {

    this.loginForm = this.fb.group({
      username: ['',Validators.required],
      password: ['',Validators.required]
    });
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', ],
      password: ['', ]
    });

  }

  onSubmit() {
    this.isLoading = true;
    if (this.loginForm.valid) {
      const user: User = this.loginForm.value;
      this.authService.login(user.username, user.password)
        .subscribe({
            next: (response) => {
              this.isLoading = false;
              this.router.navigateByUrl('/accueil');
            },
            error: (error) => {
              this.isLoading = false;
              if(error.status == 401){
                this.errorMessage = 'Invalid username or password.';
              }else {
                this.errorMessage = 'An unexpected error occurred. Please try again later.';
                console.error('Error while login', error);
              }
            }
          }
        );
    }else {
      this.isLoading = false;
      this.errorMessage = 'Please fill out the form correctly before submitting.';
      console.log('Invalid form');
    }
  }
}
