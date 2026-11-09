import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DEFAULT_CITY_ASSETS, ResolvedAssetSnapshot } from '../../core/city-scene';
import { CityStore } from '../../core/city-store';
import { ImprovementsStore, IMPROVEMENT_STATUS_LABELS } from '../../core/improvements-store';
import { terminalCommand } from '../../core/models';
import { causeLabel, deviceName, numberMetric, originLabel, qualityLabel, reportedBoolean } from '../../core/presentation';
import { CityCanvas2D } from '../../shared/city-canvas-2d';
import { CommandList } from '../../shared/command-list';
import { DevicePanel, Metric } from '../../shared/device-panel';
import { PageHeading } from '../../shared/page-heading';
import { CityAssistant } from './city-assistant';
import { TelemetryAnalysis } from './telemetry-analysis';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DevicePanel,
    Metric,
    PageHeading,
    CommandList,
    CityCanvas2D,
    TelemetryAnalysis,
    CityAssistant
  ],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {
  readonly store = inject(CityStore);
  readonly improvements = inject(ImprovementsStore);

  readonly online = computed(() =>
    this.store.error() ? 0 : this.store.devices().filter(d => d.online && !d.isStale).length
  );
  readonly pendingCommandsCount = computed(() =>
    this.store.commands().filter(c => !terminalCommand(c.status)).length
  );

  readonly metric = numberMetric;
  readonly state = reportedBoolean;
  readonly cause = causeLabel;
  readonly origin = originLabel;
  readonly quality = qualityLabel;
  readonly devName = deviceName;
  readonly impStatus = IMPROVEMENT_STATUS_LABELS;

  readonly selectedAsset = signal<{ assetId: string; label: string; deviceKey?: string }>({
    assetId: DEFAULT_CITY_ASSETS[0].id,
    label: DEFAULT_CITY_ASSETS[0].displayName,
    deviceKey: DEFAULT_CITY_ASSETS[0].binding?.deviceKey
  });

  readonly assistantQuestion = signal('');

  onAssetSelected(snapshot: ResolvedAssetSnapshot) {
    this.selectedAsset.set({
      assetId: snapshot.asset.id,
      label: snapshot.asset.displayName,
      deviceKey: snapshot.asset.binding?.deviceKey
    });
  }

  onAskAssistant(payload: { assetId: string; deviceKey?: string; question: string }) {
    this.selectedAsset.set({
      assetId: payload.assetId,
      label: payload.assetId,
      deviceKey: payload.deviceKey
    });
    this.assistantQuestion.set(payload.question);
  }
}
