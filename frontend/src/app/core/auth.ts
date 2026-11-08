import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE, CityApi } from './api';
import { Identity } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(CityApi);
  private readonly router = inject(Router);
  private readonly token = signal<string | null>(null);
  readonly user = signal<Identity | null>(null);
  readonly operator = computed(() => this.user()?.role === 'operator');
  readonly notice = signal('');
  private expiration?: ReturnType<typeof setTimeout>;
  accessToken() { return this.token(); }
  async login(username: string, password: string) {
    const response = await this.api.login(username, password);
    this.token.set(response.accessToken);
    try {
      const identity = await this.api.me();
      this.user.set(identity); this.notice.set('');
      clearTimeout(this.expiration);
      this.expiration = setTimeout(() => this.logout('Sua sessão expirou. Entre novamente.'), response.expiresIn * 1000);
    } catch (error) { this.token.set(null); throw error; }
  }
  logout(message = '') {
    this.token.set(null); this.user.set(null); clearTimeout(this.expiration); this.notice.set(message);
    void this.router.navigateByUrl('/login');
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const base = inject(API_BASE);
  const apiRequest = request.url.startsWith(base + '/api/v1/');
  const token = auth.accessToken();
  const authenticated = apiRequest && !!token;
  return next(authenticated ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request).pipe(
    catchError(error => {
      if (authenticated && error.status === 401 && !request.url.endsWith('/auth/login')) auth.logout('Sua sessão expirou. Entre novamente.');
      return throwError(() => error);
    }));
};
export const authenticatedGuard: CanActivateFn = () => inject(AuthService).user() ? true : inject(Router).createUrlTree(['/login']);
