import { useQuery } from '@tanstack/react-query';
import { fetchActiveCities, fetchActiveLocalAreas } from '../lib/api/regions';
import type { RegionSummaryDto } from '../types/region';

export function useRegions(search?: string) {
  return useQuery<RegionSummaryDto[]>({
    queryKey: ['regions', search ?? ''],
    queryFn: () => fetchActiveLocalAreas(search),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useCities(search?: string) {
  return useQuery<RegionSummaryDto[]>({
    queryKey: ['regions', 'cities', search ?? ''],
    queryFn: () => fetchActiveCities(search),
    staleTime: 5 * 60 * 1000,
  });
}
