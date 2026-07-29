import { apiFetch } from './apiFetch';
import { validateRegionList } from '../validation/regionDto';
import type { RegionSummaryDto } from '../../types/region';

export async function fetchActiveLocalAreas(search?: string): Promise<RegionSummaryDto[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const qs = params.toString();
  const url = `/v1/regions${qs ? `?${qs}` : ''}`;

  const payload = await apiFetch<unknown>(url);
  return validateRegionList(payload);
}

export async function fetchActiveCities(search?: string): Promise<RegionSummaryDto[]> {
  const params = new URLSearchParams({ type: 'AdministrativeArea' });
  if (search) params.set('search', search);

  const payload = await apiFetch<unknown>(`/v1/regions?${params}`);
  return validateRegionList(payload);
}

export async function fetchActiveRegion(id: string): Promise<RegionSummaryDto> {
  const url = `/v1/regions/${encodeURIComponent(id)}`;

  const payload = await apiFetch<unknown>(url);
  return validateRegionList([payload])[0]!;
}
