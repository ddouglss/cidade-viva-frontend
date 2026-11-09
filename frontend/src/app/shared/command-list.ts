import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CityStore } from '../core/city-store';
import { actionLabel, commandLabel, reasonLabel } from '../core/presentation';
import { terminalCommand } from '../core/models';

@Component({ selector: 'cv-command-list', imports: [DatePipe], template: `
  <div class="command-list" aria-live="polite" aria-atomic="false">
    @for (command of items(); track command.commandId) {
      <article class="command-row">
        <div class="row-between"><strong>{{ action(command.action) }}</strong><span class="badge" [class.good]="command.status === 'APPLIED'" [class.warn]="command.status === 'REJECTED' || command.status === 'TIMED_OUT'" [class.pending]="!terminal(command.status)">{{ label(command) }}</span></div>
        <p class="small muted-text">{{ command.deviceKey }} · <time [title]="command.requestedAt">{{ command.requestedAt | date:'dd/MM, HH:mm:ss' }}</time></p>
        @if (reason(command.reason)) { <p class="command-reason">{{ reason(command.reason) }}</p> }
        @if (command.status === 'APPLIED') { <p class="small muted-text">Estado confirmado pelo controlador. Não comprova vazão ou movimento físico.</p> }
        <details><summary>Detalhes do comando</summary><code>{{ command.commandId }}</code><p class="small">Status: {{ command.status }}{{ command.reason ? ' · ' + command.reason : '' }}</p></details>
        @if (!terminal(command.status)) { <button type="button" class="text-button" [disabled]="command.status === 'REQUESTED'" (click)="store.checkCommand(command.commandId)">Consultar resultado <span aria-hidden="true">↗</span></button> }
      </article>
    } @empty { <div class="empty-state compact"><span aria-hidden="true">↗</span><p>Nenhum comando nesta sessão.</p><span>Solicitações e confirmações aparecerão aqui.</span></div> }
  </div>` })
export class CommandList {
  readonly store = inject(CityStore); readonly deviceKey = input<string | undefined>(); readonly limit = input(4);
  readonly items = computed(() => {
    const commands = this.store.commands().filter(c => !this.deviceKey() || c.deviceKey === this.deviceKey());
    const pending = commands.filter(c => !terminalCommand(c.status));
    const completed = commands.filter(c => terminalCommand(c.status));
    return [...pending, ...completed.slice(0, Math.max(0, this.limit() - pending.length))];
  });
  readonly action = actionLabel; readonly label = commandLabel; readonly reason = reasonLabel; readonly terminal = terminalCommand;
}
