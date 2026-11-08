import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { API_BASE } from './core/api';

describe('Navegação protegida', () => {
  it('redireciona acesso direto à hidráulica para login sem sessão', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting(), {provide:API_BASE,useValue:''}] });
    const harness = await RouterTestingHarness.create('/hidraulica');
    expect(harness.routeNativeElement?.textContent).toContain('Bem-vindo à Cidade Viva');
    expect(harness.routeNativeElement?.querySelector('input[type="password"]')).not.toBeNull();
  });
});
