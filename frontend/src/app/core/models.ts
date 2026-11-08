export type DataOrigin = 'PHYSICAL_SENSOR' | 'SIMULATED_INPUT' | 'CALCULATED';
export type DataQuality = 'VALID' | 'INVALID' | 'STALE' | 'UNSYNCHRONIZED_TIME';
export interface Identity { id: string; username: string; role: 'viewer' | 'operator' }
export interface AccessToken { accessToken: string; tokenType: string; expiresIn: number }
export interface AutomationRule {
  id: string; deviceKey: string; maxPulseMs: number; cooldownMs: number; version: number;
  updatedAt: string; updatedBy: string; deliveryStatus: string;
}
export interface Device {
  id: string; deviceKey: string; zoneCode: string; firmwareVersion: string | null;
  online: boolean; reportedOnline: boolean; isStale: boolean; mode: string | null;
  origin: DataOrigin | null; quality: DataQuality | null; lastSeenAt: string | null;
  lastTelemetryAt: string | null; measurements: Record<string, number | boolean>;
  actuators: Record<string, boolean | string | number>; automationRules: AutomationRule[];
}
export type CommandStatus = 'REQUESTED' | 'PENDING' | 'PUBLISHED' | 'RECEIVED' | 'APPLIED' | 'REJECTED' | 'EXPIRED' | 'TIMED_OUT' | 'UNCONFIRMED' | 'FAILED';
export interface Command {
  commandId: string; deviceKey: string; action: string; parameters: Record<string, unknown>;
  status: CommandStatus; reason: string | null; requestedAt: string; expiresAt: string;
  publishedAt: string | null; requestedBy: string; observedState: Record<string, unknown> | null;
}
export interface CityAlert {
  id: string; deviceKey: string; cause: string; active: boolean; raisedAt: string;
  resolvedAt: string | null; acknowledgedAt: string | null; acknowledgedBy: string | null;
}
export interface Reading {
  id: string; messageId: string; metric: string; value: number | boolean; unit: string | null;
  origin: DataOrigin; quality: DataQuality; observedAt: string | null; receivedAt: string;
}
export interface Page<T> { items: T[]; page: number; pageSize: number; totalCount: number }
export const terminalCommand = (status: CommandStatus) => ['APPLIED', 'REJECTED', 'EXPIRED', 'TIMED_OUT', 'FAILED'].includes(status);
