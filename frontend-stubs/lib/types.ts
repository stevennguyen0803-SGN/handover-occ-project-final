/**
 * Shared TypeScript types for the OCC Handover frontend.
 *
 * These mirror `shared/DATA_MODEL.md` 1:1. Do NOT invent fields here —
 * if you need a new field, add it to the data model first.
 *
 * BR-02: never accept `referenceId` from the client; the server generates it.
 */

export type Shift = 'Morning' | 'Afternoon' | 'Night';

export type Priority = 'Low' | 'Normal' | 'High' | 'Critical';

export type ItemStatus = 'Open' | 'Monitoring' | 'Resolved';

export type UserRole = 'OCC_STAFF' | 'SUPERVISOR' | 'MANAGEMENT_VIEWER' | 'ADMIN';

export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'ACKNOWLEDGED'
  | 'CARRIED_FORWARD'
  | 'DELETED';

export type CategoryCode =
  | 'aircraft'
  | 'airport'
  | 'flightSchedule'
  | 'crew'
  | 'weather'
  | 'system'
  | 'abnormal';

export interface UserSummary {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
}

export interface ItemCounts {
  open: number;
  monitoring: number;
  resolved: number;
}

/** Shape returned by `GET /api/v1/handovers` list rows. */
export interface HandoverListRow {
  id: string;
  referenceId: string;
  handoverDate: string; // ISO date `YYYY-MM-DD`
  shift: Shift;
  preparedBy: UserSummary;
  handedTo: UserSummary | null;
  overallPriority: Priority;
  overallStatus: ItemStatus;
  isCarriedForward: boolean;
  itemCounts: ItemCounts;
  createdAt: string; // ISO datetime
  acknowledgedAt: string | null;
}

/** Common item fields shared by every category record. */
export interface BaseItem {
  id: string;
  handoverId: string;
  status: ItemStatus;
  priority: Priority;
  flightsAffected?: string | null;
  ownerId?: string | null;
  owner?: UserSummary | null;
  dueTime?: string | null;
  remarks?: string | null;
  resolvedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AircraftItem extends BaseItem {
  registration: string;
  type?: string | null;
  issue: string;
}

export interface AirportItem extends BaseItem {
  airport: string;
  issue: string;
}

export interface FlightScheduleItem extends BaseItem {
  flightNumber: string;
  route?: string | null;
  issue: string;
}

export interface CrewItem extends BaseItem {
  crewId?: string | null;
  crewName?: string | null;
  role?: string | null;
  issue: string;
}

export interface WeatherItem extends BaseItem {
  affectedArea: string;
  weatherType: string;
  issue: string;
}

export interface SystemItem extends BaseItem {
  systemName: string;
  issue: string;
}

export interface AbnormalEvent extends BaseItem {
  eventType: string;
  description: string;
  notificationRef?: string | null;
}

export type AnyItem =
  | AircraftItem
  | AirportItem
  | FlightScheduleItem
  | CrewItem
  | WeatherItem
  | SystemItem
  | AbnormalEvent;

/** Shape returned by `GET /api/v1/handovers/:id`. */
export interface HandoverDetail {
  id: string;
  referenceId: string;
  handoverDate: string;
  shift: Shift;
  preparedBy: UserSummary;
  handedTo: UserSummary | null;
  overallPriority: Priority;
  overallStatus: ItemStatus;
  generalRemarks?: string | null;
  nextShiftActions?: string | null;
  isCarriedForward: boolean;
  carriedFromId?: string | null;
  carriedFromReference?: string | null;
  submittedAt?: string | null;
  acknowledgedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  aircraftItems: AircraftItem[];
  airportItems: AirportItem[];
  flightScheduleItems: FlightScheduleItem[];
  crewItems: CrewItem[];
  weatherItems: WeatherItem[];
  systemItems: SystemItem[];
  abnormalEvents: AbnormalEvent[];
}

export interface AuditLogEntry {
  id: string;
  handoverId: string;
  user: UserSummary;
  action: AuditAction;
  targetModel: string;
  targetId: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

export interface DashboardSummary {
  totalHandovers: number;
  openHandovers: number;
  highOrCritical: number;
  flightsAffected: number;
  awaitingAcknowledgment: number;
  carriedForwardCount: number;
  aircraftIssues: number;
  byCategory: Record<CategoryCode, number>;
  byPriority: Record<Priority, number>;
  byShift: Record<Shift, number>;
  abnormalEventsByType: Record<string, number>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HandoverListResponse {
  data: HandoverListRow[];
  pagination: PaginationMeta;
}

/** Quick-filter chip identifiers used on the dashboard + log. */
export type QuickFilter =
  | 'all'
  | 'today'
  | 'last7'
  | 'highPlus'
  | 'openOnly'
  | 'carryForward'
  | 'awaitingAck';

export type ThemeMode = 'light' | 'dark';

export type Locale = 'vi' | 'en';
