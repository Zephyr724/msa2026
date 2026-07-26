import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useRegions } from '../../hooks/useRegions';
import {
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_REGISTRATION_MODES,
  type QuestCategory,
  type QuestDifficulty,
  type QuestRegistrationMode,
} from '../../types/quest';
import type {
  CreateQuestInput,
  QuestManagementDetailDto,
} from '../../types/questManagement';
import type { QuestFormValues } from './questFormModel';

type FieldErrors = Partial<Record<keyof QuestFormValues, string>>;

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isCoverUrl(value: string) {
  return /^\/(?!\/)/.test(value) || isHttpsUrl(value);
}

function validate(fields: QuestFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.title.trim()) errors.title = 'Enter a title.';
  else if (fields.title.trim().length > 200) errors.title = 'Use 200 characters or fewer.';

  if (!fields.description.trim()) errors.description = 'Enter a description.';
  else if (fields.description.trim().length > 2_000) {
    errors.description = 'Use 2,000 characters or fewer.';
  }

  if (!QUEST_CATEGORIES.includes(fields.category)) errors.category = 'Choose a category.';
  if (!fields.registrationMode
    || !QUEST_REGISTRATION_MODES.includes(fields.registrationMode)) {
    errors.registrationMode = 'Choose a registration mode.';
  }
  if (!QUEST_DIFFICULTIES.includes(fields.difficulty)) {
    errors.difficulty = 'Choose a difficulty.';
  }

  if (!fields.unlimitedCapacity) {
    const capacity = Number(fields.capacity);
    if (fields.capacity.trim() === '' || !Number.isInteger(capacity) || capacity < 0) {
      errors.capacity = 'Enter a whole number of zero or more.';
    }
  }

  const start = fields.startAtUtc ? new Date(fields.startAtUtc) : null;
  const end = fields.endAtUtc ? new Date(fields.endAtUtc) : null;
  if (start && Number.isNaN(start.valueOf())) errors.startAtUtc = 'Enter a valid start date.';
  if (end && Number.isNaN(end.valueOf())) errors.endAtUtc = 'Enter a valid end date.';
  if (start && end && !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf())
    && end <= start) {
    errors.endAtUtc = 'The end date must be after the start date.';
  }

  if (fields.locationDescription.trim().length > 500) {
    errors.locationDescription = 'Use 500 characters or fewer.';
  }
  if (fields.externalSourceUrl.trim().length > 2_000) {
    errors.externalSourceUrl = 'Use 2,000 characters or fewer.';
  } else if (fields.externalSourceUrl.trim() && !isHttpsUrl(fields.externalSourceUrl.trim())) {
    errors.externalSourceUrl = 'Enter an absolute HTTPS URL.';
  }

  if (!fields.coverImageUrl.trim()) errors.coverImageUrl = 'Enter a cover image URL.';
  else if (fields.coverImageUrl.trim().length > 2_000) {
    errors.coverImageUrl = 'Use 2,000 characters or fewer.';
  } else if (!isCoverUrl(fields.coverImageUrl.trim())) {
    errors.coverImageUrl = 'Enter an HTTPS URL or a root-relative path beginning with /.';
  }

  if (!fields.coverAltText.trim()) errors.coverAltText = 'Describe the cover image.';
  else if (fields.coverAltText.trim().length > 300) {
    errors.coverAltText = 'Use 300 characters or fewer.';
  }
  if (fields.coverCreatorName.trim().length > 200) {
    errors.coverCreatorName = 'Use 200 characters or fewer.';
  }
  if (fields.coverSourceUrl.trim().length > 2_000) {
    errors.coverSourceUrl = 'Use 2,000 characters or fewer.';
  } else if (fields.coverSourceUrl.trim() && !isHttpsUrl(fields.coverSourceUrl.trim())) {
    errors.coverSourceUrl = 'Enter an absolute HTTPS URL.';
  }
  if (fields.coverLicenceNote.trim().length > 500) {
    errors.coverLicenceNote = 'Use 500 characters or fewer.';
  }
  return errors;
}

function toCreateInput(fields: QuestFormValues): CreateQuestInput {
  return {
    title: fields.title.trim(),
    description: fields.description.trim(),
    category: fields.category,
    registrationMode: fields.registrationMode as QuestRegistrationMode,
    difficulty: fields.difficulty,
    capacity: fields.unlimitedCapacity ? null : Number(fields.capacity),
    startAtUtc: fields.startAtUtc ? new Date(fields.startAtUtc).toISOString() : null,
    endAtUtc: fields.endAtUtc ? new Date(fields.endAtUtc).toISOString() : null,
    locationRegionId: fields.locationRegionId || null,
    locationDescription: optionalText(fields.locationDescription),
    externalSourceUrl: optionalText(fields.externalSourceUrl),
    coverImage: {
      imageUrl: fields.coverImageUrl.trim(),
      altText: fields.coverAltText.trim(),
      creatorName: optionalText(fields.coverCreatorName),
      sourceUrl: optionalText(fields.coverSourceUrl),
      licenceNote: optionalText(fields.coverLicenceNote),
    },
  };
}

interface QuestFormProps {
  initialValues: QuestFormValues;
  readOnly?: boolean;
  submitting: boolean;
  submitLabel: string;
  pendingLabel: string;
  serverError?: string | null;
  disableNavigationProtection?: boolean;
  onClearServerError?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSubmit: (input: CreateQuestInput) => Promise<QuestManagementDetailDto>;
  onSubmitted?: (quest: QuestManagementDetailDto) => void;
}

export default function QuestForm({
  initialValues,
  readOnly = false,
  submitting,
  submitLabel,
  pendingLabel,
  serverError,
  disableNavigationProtection = false,
  onClearServerError,
  onDirtyChange,
  onSubmit,
  onSubmitted,
}: QuestFormProps) {
  const [fields, setFields] = useState(initialValues);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initialValues));
  const [errors, setErrors] = useState<FieldErrors>({});
  const dirty = !readOnly && JSON.stringify(fields) !== baseline;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const blocker = useBlocker(
    () => !disableNavigationProtection && dirtyRef.current,
  );
  const regionsQuery = useRegions();

  useEffect(() => {
    const nextBaseline = JSON.stringify(initialValues);
    if (!dirtyRef.current && nextBaseline !== baseline) {
      setFields(initialValues);
      setBaseline(nextBaseline);
    }
  }, [baseline, initialValues]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const regionOptions = useMemo(() => {
    const active = regionsQuery.data ?? [];
    const preserved = fields.locationRegion;
    return preserved && !active.some((region) => region.id === preserved.id)
      ? [...active, preserved]
      : active;
  }, [fields.locationRegion, regionsQuery.data]);

  function updateField<K extends keyof QuestFormValues>(
    field: K,
    value: QuestFormValues[K],
  ) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    onClearServerError?.();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const quest = await onSubmit(toCreateInput(fields));
      const nextBaseline = JSON.stringify(fields);
      dirtyRef.current = false;
      setBaseline(nextBaseline);
      onSubmitted?.(quest);
    } catch {
      // The owning page maps the typed API error into the form summary.
    }
  }

  const errorMessages = [...new Set(Object.values(errors))];
  const describedBy = (field: keyof QuestFormValues, hint?: string) => {
    const ids = [];
    if (hint) ids.push(hint);
    if (errors[field]) ids.push(`${field}-error`);
    return ids.length ? ids.join(' ') : undefined;
  };

  return (
    <>
      <form className="space-y-6" noValidate onSubmit={handleSubmit}>
        {(errorMessages.length > 0 || serverError) && (
          <div className="alert alert-error items-start" role="alert">
            <div>
              <p className="font-semibold">The quest could not be saved.</p>
              {serverError && <p>{serverError}</p>}
              {errorMessages.length > 0 && (
                <ul className="mt-1 list-inside list-disc">
                  {errorMessages.map((message) => <li key={message}>{message}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        <fieldset className="space-y-8" disabled={readOnly}>
          <section className="kiwi-panel space-y-4 p-5 sm:p-6" aria-labelledby="quest-details-heading">
            <h2 className="text-2xl" id="quest-details-heading">Quest details</h2>
            <FormControl label="Title" error={errors.title} field="title">
              <input
                aria-describedby={describedBy('title')}
                aria-invalid={!!errors.title}
                className="input input-bordered w-full rounded-xl"
                id="title"
                maxLength={200}
                onChange={(event) => updateField('title', event.target.value)}
                required
                type="text"
                value={fields.title}
              />
            </FormControl>
            <FormControl label="Description" error={errors.description} field="description">
              <textarea
                aria-describedby={describedBy('description')}
                aria-invalid={!!errors.description}
                className="textarea textarea-bordered min-h-36 w-full rounded-xl"
                id="description"
                maxLength={2_000}
                onChange={(event) => updateField('description', event.target.value)}
                required
                value={fields.description}
              />
            </FormControl>
            <div className="grid gap-4 md:grid-cols-3">
              <FormControl label="Category" error={errors.category} field="category">
                <select
                  aria-describedby={describedBy('category')}
                  aria-invalid={!!errors.category}
                  className="select select-bordered w-full rounded-xl"
                  id="category"
                  onChange={(event) => updateField('category', event.target.value as QuestCategory)}
                  value={fields.category}
                >
                  {QUEST_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </FormControl>
              <FormControl
                label="Registration mode"
                error={errors.registrationMode}
                field="registrationMode"
              >
                <select
                  aria-describedby={describedBy('registrationMode')}
                  aria-invalid={!!errors.registrationMode}
                  className="select select-bordered w-full rounded-xl"
                  id="registrationMode"
                  onChange={(event) => updateField(
                    'registrationMode',
                    event.target.value as QuestRegistrationMode,
                  )}
                  value={fields.registrationMode}
                >
                  <option disabled value="">Choose a mode</option>
                  {QUEST_REGISTRATION_MODES.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </FormControl>
              <FormControl label="Difficulty" error={errors.difficulty} field="difficulty">
                <select
                  aria-describedby={describedBy('difficulty')}
                  aria-invalid={!!errors.difficulty}
                  className="select select-bordered w-full rounded-xl"
                  id="difficulty"
                  onChange={(event) => updateField(
                    'difficulty',
                    event.target.value as QuestDifficulty,
                  )}
                  value={fields.difficulty}
                >
                  {QUEST_DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </FormControl>
            </div>
          </section>

          <section className="kiwi-panel space-y-4 p-5 sm:p-6" aria-labelledby="schedule-heading">
            <h2 className="text-2xl" id="schedule-heading">Schedule and capacity</h2>
            <label className="label cursor-pointer justify-start gap-3" htmlFor="unlimitedCapacity">
              <input
                checked={fields.unlimitedCapacity}
                className="checkbox"
                id="unlimitedCapacity"
                onChange={(event) => updateField('unlimitedCapacity', event.target.checked)}
                type="checkbox"
              />
              <span>Unlimited capacity</span>
            </label>
            <FormControl label="Capacity" error={errors.capacity} field="capacity">
              <input
                aria-describedby={describedBy('capacity', 'capacity-hint')}
                aria-invalid={!!errors.capacity}
                className="input input-bordered w-full rounded-xl"
                disabled={readOnly || fields.unlimitedCapacity}
                id="capacity"
                min="0"
                onChange={(event) => updateField('capacity', event.target.value)}
                step="1"
                type="number"
                value={fields.capacity}
              />
              <p className="text-sm text-base-content/60" id="capacity-hint">
                Zero is allowed. Select unlimited when no capacity applies.
              </p>
            </FormControl>
            <div className="grid gap-4 md:grid-cols-2">
              <FormControl label="Starts" error={errors.startAtUtc} field="startAtUtc">
                <input
                  aria-describedby={describedBy('startAtUtc')}
                  aria-invalid={!!errors.startAtUtc}
                  className="input input-bordered w-full rounded-xl"
                  id="startAtUtc"
                  onChange={(event) => updateField('startAtUtc', event.target.value)}
                  type="datetime-local"
                  value={fields.startAtUtc}
                />
              </FormControl>
              <FormControl label="Ends" error={errors.endAtUtc} field="endAtUtc">
                <input
                  aria-describedby={describedBy('endAtUtc')}
                  aria-invalid={!!errors.endAtUtc}
                  className="input input-bordered w-full rounded-xl"
                  id="endAtUtc"
                  onChange={(event) => updateField('endAtUtc', event.target.value)}
                  type="datetime-local"
                  value={fields.endAtUtc}
                />
              </FormControl>
            </div>
          </section>

          <section className="kiwi-panel space-y-4 p-5 sm:p-6" aria-labelledby="location-heading">
            <h2 className="text-2xl" id="location-heading">Location</h2>
            <FormControl label="Region" field="locationRegionId">
              <select
                className="select select-bordered w-full rounded-xl"
                id="locationRegionId"
                onChange={(event) => updateField('locationRegionId', event.target.value)}
                value={fields.locationRegionId}
              >
                <option value="">No region</option>
                {regionOptions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                    {fields.locationRegion?.id === region.id
                      && !regionsQuery.data?.some((active) => active.id === region.id)
                      ? ' (current)' : ''}
                  </option>
                ))}
              </select>
              {regionsQuery.isError && (
                <p className="text-sm text-warning">
                  Active Regions could not be loaded. An existing Region is preserved.
                </p>
              )}
            </FormControl>
            <FormControl
              label="Location description"
              error={errors.locationDescription}
              field="locationDescription"
            >
              <input
                aria-describedby={describedBy('locationDescription')}
                aria-invalid={!!errors.locationDescription}
                className="input input-bordered w-full rounded-xl"
                id="locationDescription"
                maxLength={500}
                onChange={(event) => updateField('locationDescription', event.target.value)}
                type="text"
                value={fields.locationDescription}
              />
            </FormControl>
            <FormControl
              label="External source URL"
              error={errors.externalSourceUrl}
              field="externalSourceUrl"
            >
              <input
                aria-describedby={describedBy('externalSourceUrl', 'external-source-hint')}
                aria-invalid={!!errors.externalSourceUrl}
                className="input input-bordered w-full rounded-xl"
                id="externalSourceUrl"
                maxLength={2_000}
                onChange={(event) => updateField('externalSourceUrl', event.target.value)}
                placeholder="https://example.org/quest"
                type="url"
                value={fields.externalSourceUrl}
              />
              <p className="text-sm text-base-content/60" id="external-source-hint">
                Optional. HTTPS links only.
              </p>
            </FormControl>
          </section>

          <section className="kiwi-panel space-y-4 p-5 sm:p-6" aria-labelledby="cover-heading">
            <div>
              <h2 className="text-2xl" id="cover-heading">Cover image</h2>
              <p className="text-sm text-base-content/60">
                Add image metadata and a URL. File upload is not available here.
              </p>
            </div>
            <FormControl
              label="Cover image URL"
              error={errors.coverImageUrl}
              field="coverImageUrl"
            >
              <input
                aria-describedby={describedBy('coverImageUrl')}
                aria-invalid={!!errors.coverImageUrl}
                className="input input-bordered w-full"
                id="coverImageUrl"
                maxLength={2_000}
                onChange={(event) => updateField('coverImageUrl', event.target.value)}
                placeholder="https://example.org/cover.jpg or /images/cover.jpg"
                required
                type="text"
                value={fields.coverImageUrl}
              />
            </FormControl>
            <FormControl
              label="Cover alt text"
              error={errors.coverAltText}
              field="coverAltText"
            >
              <input
                aria-describedby={describedBy('coverAltText')}
                aria-invalid={!!errors.coverAltText}
                className="input input-bordered w-full"
                id="coverAltText"
                maxLength={300}
                onChange={(event) => updateField('coverAltText', event.target.value)}
                required
                type="text"
                value={fields.coverAltText}
              />
            </FormControl>
            <div className="grid gap-4 md:grid-cols-2">
              <FormControl
                label="Creator name"
                error={errors.coverCreatorName}
                field="coverCreatorName"
              >
                <input
                  aria-describedby={describedBy('coverCreatorName')}
                  aria-invalid={!!errors.coverCreatorName}
                  className="input input-bordered w-full"
                  id="coverCreatorName"
                  maxLength={200}
                  onChange={(event) => updateField('coverCreatorName', event.target.value)}
                  type="text"
                  value={fields.coverCreatorName}
                />
              </FormControl>
              <FormControl
                label="Image source URL"
                error={errors.coverSourceUrl}
                field="coverSourceUrl"
              >
                <input
                  aria-describedby={describedBy('coverSourceUrl')}
                  aria-invalid={!!errors.coverSourceUrl}
                  className="input input-bordered w-full"
                  id="coverSourceUrl"
                  maxLength={2_000}
                  onChange={(event) => updateField('coverSourceUrl', event.target.value)}
                  type="url"
                  value={fields.coverSourceUrl}
                />
              </FormControl>
            </div>
            <FormControl
              label="Licence note"
              error={errors.coverLicenceNote}
              field="coverLicenceNote"
            >
              <input
                aria-describedby={describedBy('coverLicenceNote')}
                aria-invalid={!!errors.coverLicenceNote}
                className="input input-bordered w-full"
                id="coverLicenceNote"
                maxLength={500}
                onChange={(event) => updateField('coverLicenceNote', event.target.value)}
                type="text"
                value={fields.coverLicenceNote}
              />
            </FormControl>
          </section>
        </fieldset>

        {!readOnly && (
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {submitting ? pendingLabel : submitLabel}
          </button>
        )}
      </form>

      {blocker.state === 'blocked' && (
        <div className="alert alert-warning fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl shadow-xl" role="alert">
          <div>
            <p className="font-semibold">You have unsaved changes.</p>
            <p>Leave this page and discard them?</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => blocker.reset()} type="button">
              Stay
            </button>
            <button className="btn btn-error btn-sm" onClick={() => blocker.proceed()} type="button">
              Leave page
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FormControl({
  label,
  field,
  error,
  children,
}: {
  label: string;
  field: keyof QuestFormValues;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-control">
      <label className="label font-medium" htmlFor={field}>{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-error" id={`${field}-error`}>{error}</p>
      )}
    </div>
  );
}
