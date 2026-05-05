import type { CategoryCode, Priority } from '../../lib/types';

/**
 * Per-category item draft used by the wizard's "Items" step. Mirrors the
 * required fields from the backend Zod schemas in
 * `backend/src/schemas/item.schema.ts`. Optional fields are omitted to
 * keep the wizard form short — users can edit the rest on the detail
 * page after submission.
 */
export interface AircraftItemDraft {
  registration: string;
  type: string;
  issue: string;
  flightsAffected: string;
  priority: Priority;
}

export interface AirportItemDraft {
  airport: string;
  issue: string;
  flightsAffected: string;
  priority: Priority;
}

export interface FlightScheduleItemDraft {
  flightNumber: string;
  route: string;
  issue: string;
  priority: Priority;
}

export interface CrewItemDraft {
  crewName: string;
  role: string;
  issue: string;
  priority: Priority;
}

export interface WeatherItemDraft {
  affectedArea: string;
  weatherType: string;
  issue: string;
  priority: Priority;
}

export interface SystemItemDraft {
  systemName: string;
  issue: string;
  priority: Priority;
}

export interface AbnormalEventDraft {
  eventType: string;
  description: string;
  flightsAffected: string;
  priority: Priority;
}

export type ItemDraftFor<C extends CategoryCode> = C extends 'aircraft'
  ? AircraftItemDraft
  : C extends 'airport'
    ? AirportItemDraft
    : C extends 'flightSchedule'
      ? FlightScheduleItemDraft
      : C extends 'crew'
        ? CrewItemDraft
        : C extends 'weather'
          ? WeatherItemDraft
          : C extends 'system'
            ? SystemItemDraft
            : C extends 'abnormal'
              ? AbnormalEventDraft
              : never;

export type AnyItemDraft =
  | AircraftItemDraft
  | AirportItemDraft
  | FlightScheduleItemDraft
  | CrewItemDraft
  | WeatherItemDraft
  | SystemItemDraft
  | AbnormalEventDraft;

export function emptyItemDraftFor(category: CategoryCode): AnyItemDraft {
  switch (category) {
    case 'aircraft':
      return {
        registration: '',
        type: '',
        issue: '',
        flightsAffected: '',
        priority: 'Normal',
      };
    case 'airport':
      return { airport: '', issue: '', flightsAffected: '', priority: 'Normal' };
    case 'flightSchedule':
      return { flightNumber: '', route: '', issue: '', priority: 'Normal' };
    case 'crew':
      return { crewName: '', role: '', issue: '', priority: 'Normal' };
    case 'weather':
      return {
        affectedArea: '',
        weatherType: '',
        issue: '',
        priority: 'Normal',
      };
    case 'system':
      return { systemName: '', issue: '', priority: 'Normal' };
    case 'abnormal':
      return {
        eventType: '',
        description: '',
        flightsAffected: '',
        priority: 'Normal',
      };
    default: {
      // Exhaustive check
      const _exhaustive: never = category;
      throw new Error(`Unknown category: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Validates that all required fields are non-empty (per backend schema).
 * Returns null if valid, or a list of missing field labels otherwise.
 */
export function missingFieldsFor(
  category: CategoryCode,
  draft: AnyItemDraft
): string[] {
  const missing: string[] = [];
  const issue = (draft as { issue?: string; description?: string }).issue;
  const description = (draft as { description?: string }).description;

  switch (category) {
    case 'aircraft': {
      const d = draft as AircraftItemDraft;
      if (d.registration.trim().length < 2) missing.push('registration');
      if (d.issue.trim().length < 5) missing.push('issue');
      break;
    }
    case 'airport': {
      const d = draft as AirportItemDraft;
      if (d.airport.trim().length !== 4) missing.push('airport (ICAO 4 chars)');
      if (d.issue.trim().length < 5) missing.push('issue');
      break;
    }
    case 'flightSchedule': {
      const d = draft as FlightScheduleItemDraft;
      if (d.flightNumber.trim().length < 2) missing.push('flightNumber');
      if (d.issue.trim().length < 5) missing.push('issue');
      break;
    }
    case 'crew': {
      if ((issue ?? '').trim().length < 5) missing.push('issue');
      break;
    }
    case 'weather': {
      const d = draft as WeatherItemDraft;
      if (d.affectedArea.trim().length < 2) missing.push('affectedArea');
      if (d.weatherType.trim().length < 2) missing.push('weatherType');
      if (d.issue.trim().length < 5) missing.push('issue');
      break;
    }
    case 'system': {
      const d = draft as SystemItemDraft;
      if (d.systemName.trim().length < 2) missing.push('systemName');
      if (d.issue.trim().length < 5) missing.push('issue');
      break;
    }
    case 'abnormal': {
      const d = draft as AbnormalEventDraft;
      if (d.eventType.trim().length < 2) missing.push('eventType');
      if ((description ?? '').trim().length < 20)
        missing.push('description (≥ 20 chars)');
      break;
    }
  }

  return missing;
}
