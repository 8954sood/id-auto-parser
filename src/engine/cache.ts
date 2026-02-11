import type { InspectResponse } from '@/types';

const MAX_CACHE_SIZE = 100;

const cache = new Map<string, InspectResponse>();

export function getCached(input: string): InspectResponse | undefined {
  return cache.get(input);
}

export function setCache(input: string, result: InspectResponse): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
  cache.set(input, result);
}
