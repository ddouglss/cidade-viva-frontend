import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';
import { friendlyError } from '../../core/api';

@Component({ selector: 'cv-login', imports: [ReactiveFormsModule], templateUrl: './login.html' })
export class Login {
  readonly auth = inject(AuthService); private readonly router = inject(Router);
  readonly busy = signal(false); readonly error = signal(''); readonly submitted = signal(false);
  readonly form = new FormGroup({ username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(128)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(1024)] }) });
  async submit() {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) { this.form.markAllAsTouched(); return; }
    this.busy.set(true); this.error.set('');
    const { username, password } = this.form.getRawValue();
    try { await this.auth.login(username.trim(), password); this.form.controls.password.reset(); await this.router.navigateByUrl('/dashboard'); }
    catch (error) { this.error.set(friendlyError(error)); this.form.controls.password.reset(); }
    finally { this.busy.set(false); }
  }
}
