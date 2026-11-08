import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityStore } from '../../core/city-store';
import { DevicePanel, Metric } from '../../shared/device-panel';
import { PageHeading } from '../../shared/page-heading';
import { CommandList } from '../../shared/command-list';
import { causeLabel, numberMetric, reportedBoolean } from '../../core/presentation';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DevicePanel, Metric, PageHeading, CommandList],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  readonly store = inject(CityStore);
  readonly online = computed(() => this.store.error() ? 0 : this.store.devices().filter(d => d.online && !d.isStale).length);
  readonly metric = numberMetric; readonly state = reportedBoolean; readonly cause = causeLabel;
}
