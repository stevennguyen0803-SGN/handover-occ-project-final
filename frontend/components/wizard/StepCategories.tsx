'use client';

import { useI18n } from '../../hooks/useI18n';
import { CATEGORIES, PRIORITY_CHOICES } from '../../lib/constants';
import { cn } from '../../lib/cn';
import type { CategoryCode } from '../../lib/types';
import {
  type AbnormalEventDraft,
  type AircraftItemDraft,
  type AirportItemDraft,
  type AnyItemDraft,
  type CrewItemDraft,
  type FlightScheduleItemDraft,
  type SystemItemDraft,
  type WeatherItemDraft,
  emptyItemDraftFor,
} from './itemDrafts';

/**
 * Per-category draft. `enabled` toggles inclusion in the submitted
 * handover; `items` carries one or more concrete category-specific
 * forms. Backend BR-13 rejects an enabled but empty category, so the
 * wizard inserts a single empty item the moment a category is toggled
 * on.
 */
export interface CategoryDraft {
  enabled: boolean;
  items: AnyItemDraft[];
}

export interface StepCategoriesProps {
  value: Partial<Record<CategoryCode, CategoryDraft>>;
  onChange: (next: Partial<Record<CategoryCode, CategoryDraft>>) => void;
}

export function StepCategories({ value, onChange }: StepCategoriesProps) {
  const { t } = useI18n();

  const updateCategory = (
    code: CategoryCode,
    next: CategoryDraft | undefined
  ) => {
    if (!next) {
      const { [code]: _removed, ...rest } = value;
      onChange(rest);
      return;
    }
    onChange({ ...value, [code]: next });
  };

  const toggle = (code: CategoryCode) => {
    const current = value[code];
    if (current?.enabled) {
      updateCategory(code, { ...current, enabled: false });
    } else {
      updateCategory(code, {
        enabled: true,
        items:
          current && current.items.length > 0
            ? current.items
            : [emptyItemDraftFor(code)],
      });
    }
  };

  const addItem = (code: CategoryCode) => {
    const current = value[code];
    if (!current?.enabled) return;
    updateCategory(code, {
      ...current,
      items: [...current.items, emptyItemDraftFor(code)],
    });
  };

  const removeItem = (code: CategoryCode, index: number) => {
    const current = value[code];
    if (!current?.enabled) return;
    const items = current.items.filter((_, i) => i !== index);
    if (items.length === 0) {
      updateCategory(code, { ...current, enabled: false, items: [] });
      return;
    }
    updateCategory(code, { ...current, items });
  };

  const updateItem = (
    code: CategoryCode,
    index: number,
    patch: Partial<AnyItemDraft>
  ) => {
    const current = value[code];
    if (!current?.enabled) return;
    const items = current.items.map((item, i) =>
      i === index ? ({ ...item, ...patch } as AnyItemDraft) : item
    );
    updateCategory(code, { ...current, items });
  };

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-fg-mute">{t('wizard.cat.toggleHint')}</p>
      <div className="grid gap-3">
        {CATEGORIES.map((cat) => {
          const draft = value[cat.code];
          const enabled = draft?.enabled ?? false;
          return (
            <div
              key={cat.code}
              className={cn(
                'rounded-md border bg-bg-elev transition',
                enabled ? 'border-accent' : 'border-line'
              )}
            >
              <button
                type="button"
                onClick={() => toggle(cat.code)}
                className={cn(
                  'flex w-full items-start justify-between gap-3 rounded-md p-3 text-left',
                  enabled ? 'text-accent' : 'text-fg-soft hover:text-accent'
                )}
                data-testid={`category-toggle-${cat.code}`}
              >
                <div>
                  <div className="text-sm font-semibold">{cat.longLabel}</div>
                  <div className="text-xs opacity-80">{cat.hint}</div>
                </div>
                <div className="text-xs">
                  {enabled
                    ? t('wizard.cat.itemCount', {
                        n: draft?.items.length ?? 0,
                      })
                    : t('wizard.cat.enable')}
                </div>
              </button>
              {enabled && draft && (
                <div className="flex flex-col gap-3 border-t border-line p-3">
                  {draft.items.map((item, index) => (
                    <ItemEditor
                      key={index}
                      category={cat.code}
                      item={item}
                      onChange={(patch) => updateItem(cat.code, index, patch)}
                      onRemove={() => removeItem(cat.code, index)}
                      removeDisabled={draft.items.length === 1}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addItem(cat.code)}
                    className="self-start rounded-md border border-line px-3 py-1 text-xs text-fg-soft hover:border-accent hover:text-accent"
                    data-testid={`category-add-item-${cat.code}`}
                  >
                    + {t('wizard.cat.addItem') ?? 'Add item'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface ItemEditorProps {
  category: CategoryCode;
  item: AnyItemDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
  onRemove: () => void;
  removeDisabled: boolean;
}

function ItemEditor({
  category,
  item,
  onChange,
  onRemove,
  removeDisabled,
}: ItemEditorProps) {
  return (
    <div className="grid gap-2 rounded-md border border-line-soft bg-bg-row p-3 md:grid-cols-2">
      {category === 'aircraft' && (
        <AircraftFields item={item as AircraftItemDraft} onChange={onChange} />
      )}
      {category === 'airport' && (
        <AirportFields item={item as AirportItemDraft} onChange={onChange} />
      )}
      {category === 'flightSchedule' && (
        <FlightScheduleFields
          item={item as FlightScheduleItemDraft}
          onChange={onChange}
        />
      )}
      {category === 'crew' && (
        <CrewFields item={item as CrewItemDraft} onChange={onChange} />
      )}
      {category === 'weather' && (
        <WeatherFields item={item as WeatherItemDraft} onChange={onChange} />
      )}
      {category === 'system' && (
        <SystemFields item={item as SystemItemDraft} onChange={onChange} />
      )}
      {category === 'abnormal' && (
        <AbnormalFields item={item as AbnormalEventDraft} onChange={onChange} />
      )}

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-fg-mute">Priority</span>
        <select
          value={item.priority}
          onChange={(e) =>
            onChange({ priority: e.target.value as AnyItemDraft['priority'] })
          }
          className="rounded-md border border-line bg-bg-elev px-2 py-1 text-sm focus:border-accent focus:outline-none"
        >
          {PRIORITY_CHOICES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <div className="md:col-span-2 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          className="text-xs text-fg-mute hover:text-danger disabled:opacity-40"
        >
          Remove item
        </button>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-fg-mute">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-line bg-bg-elev px-2 py-1 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required,
  span,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  span?: 'full';
}) {
  return (
    <label
      className={cn(
        'flex flex-col gap-1 text-xs',
        span === 'full' && 'md:col-span-2'
      )}
    >
      <span className="text-fg-mute">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-bg-elev px-2 py-1 text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function AircraftFields({
  item,
  onChange,
}: {
  item: AircraftItemDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
}) {
  return (
    <>
      <TextField
        label="Registration"
        required
        value={item.registration}
        onChange={(v) => onChange({ registration: v })}
        placeholder="VN-A123"
      />
      <TextField
        label="Type"
        value={item.type}
        onChange={(v) => onChange({ type: v })}
        placeholder="A321"
      />
      <TextAreaField
        label="Issue"
        required
        span="full"
        value={item.issue}
        onChange={(v) => onChange({ issue: v })}
      />
      <TextField
        label="Flights affected"
        value={item.flightsAffected}
        onChange={(v) => onChange({ flightsAffected: v })}
      />
    </>
  );
}

function AirportFields({
  item,
  onChange,
}: {
  item: AirportItemDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
}) {
  return (
    <>
      <TextField
        label="Airport (ICAO)"
        required
        value={item.airport}
        onChange={(v) => onChange({ airport: v.toUpperCase() })}
        placeholder="VVNB"
      />
      <TextField
        label="Flights affected"
        value={item.flightsAffected}
        onChange={(v) => onChange({ flightsAffected: v })}
      />
      <TextAreaField
        label="Issue"
        required
        span="full"
        value={item.issue}
        onChange={(v) => onChange({ issue: v })}
      />
    </>
  );
}

function FlightScheduleFields({
  item,
  onChange,
}: {
  item: FlightScheduleItemDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
}) {
  return (
    <>
      <TextField
        label="Flight number"
        required
        value={item.flightNumber}
        onChange={(v) => onChange({ flightNumber: v.toUpperCase() })}
        placeholder="VN123"
      />
      <TextField
        label="Route"
        value={item.route}
        onChange={(v) => onChange({ route: v.toUpperCase() })}
        placeholder="HAN-SGN"
      />
      <TextAreaField
        label="Issue"
        required
        span="full"
        value={item.issue}
        onChange={(v) => onChange({ issue: v })}
      />
    </>
  );
}

function CrewFields({
  item,
  onChange,
}: {
  item: CrewItemDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
}) {
  return (
    <>
      <TextField
        label="Crew name"
        value={item.crewName}
        onChange={(v) => onChange({ crewName: v })}
      />
      <TextField
        label="Role"
        value={item.role}
        onChange={(v) => onChange({ role: v })}
        placeholder="Captain / FO / FA"
      />
      <TextAreaField
        label="Issue"
        required
        span="full"
        value={item.issue}
        onChange={(v) => onChange({ issue: v })}
      />
    </>
  );
}

function WeatherFields({
  item,
  onChange,
}: {
  item: WeatherItemDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
}) {
  return (
    <>
      <TextField
        label="Affected area"
        required
        value={item.affectedArea}
        onChange={(v) => onChange({ affectedArea: v })}
        placeholder="HAN / North VN"
      />
      <TextField
        label="Weather type"
        required
        value={item.weatherType}
        onChange={(v) => onChange({ weatherType: v })}
        placeholder="Thunderstorm"
      />
      <TextAreaField
        label="Issue"
        required
        span="full"
        value={item.issue}
        onChange={(v) => onChange({ issue: v })}
      />
    </>
  );
}

function SystemFields({
  item,
  onChange,
}: {
  item: SystemItemDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
}) {
  return (
    <>
      <TextField
        label="System name"
        required
        value={item.systemName}
        onChange={(v) => onChange({ systemName: v })}
        placeholder="ACARS / AIMS"
      />
      <TextAreaField
        label="Issue"
        required
        span="full"
        value={item.issue}
        onChange={(v) => onChange({ issue: v })}
      />
    </>
  );
}

function AbnormalFields({
  item,
  onChange,
}: {
  item: AbnormalEventDraft;
  onChange: (patch: Partial<AnyItemDraft>) => void;
}) {
  return (
    <>
      <TextField
        label="Event type"
        required
        value={item.eventType}
        onChange={(v) => onChange({ eventType: v })}
      />
      <TextField
        label="Flights affected"
        value={item.flightsAffected}
        onChange={(v) => onChange({ flightsAffected: v })}
      />
      <TextAreaField
        label="Description (≥ 20 chars)"
        required
        span="full"
        value={item.description}
        onChange={(v) => onChange({ description: v })}
      />
    </>
  );
}
