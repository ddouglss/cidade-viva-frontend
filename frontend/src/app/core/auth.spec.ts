import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, authInterceptor } from './auth';
import { API_BASE } from './api';

describe('Autenticação local', () => {
  let auth: AuthService; let http: HttpTestingController;
  const navigate = vi.fn().mockResolvedValue(true);
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting(),
      {provide:API_BASE,useValue:''},{provide:Router,useValue:{navigateByUrl:navigate}}]});
    auth=TestBed.inject(AuthService); http=TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); auth.logout(); });
  it('envia credenciais só ao login e usa token opaco no /me', async () => {
    const login=auth.login('viewer','test-only-password');
    const request=http.expectOne('/api/v1/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({accessToken:'opaque-test-token',expiresIn:1800,tokenType:'Bearer'});
    await Promise.resolve();
    const me=http.expectOne('/api/v1/auth/me');
    expect(me.request.headers.get('Authorization')).toBe('Bearer opaque-test-token');
    me.flush({id:'viewer-id',username:'viewer',role:'viewer'}); await login;
    expect(auth.operator()).toBe(false); expect(auth.user()?.username).toBe('viewer');
    auth.logout(); expect(auth.accessToken()).toBeNull(); expect(auth.user()).toBeNull();
  });
  it('não mantém sessão quando login falha', async () => {
    const login=auth.login('viewer','wrong');
    const failure=expect(login).rejects.toBeTruthy();
    http.expectOne('/api/v1/auth/login').flush({}, {status:401,statusText:'Unauthorized'});
    await failure; expect(auth.user()).toBeNull(); expect(auth.accessToken()).toBeNull();
  });
});
