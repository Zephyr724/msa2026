import { useQuery } from '@tanstack/react-query';
import { fetchActiveLocalAreas } from '../lib/api/regions';
import type { RegionSummaryDto } from '../types/region';

export function useRegions(search?: string) {
  return useQuery<RegionSummaryDto[]>({
    queryKey: ['regions', search ?? ''],
    queryFn: () => fetchActiveLocalAreas(search),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}