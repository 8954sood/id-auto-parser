import type { InspectResponse } from '@/types';
import { runPipeline } from './pipeline';
import { getCached, setCache } from './cache';
export { decode } from './decode';

export function inspect(input: string, mode: 'analyze' | 'decode' = 'analyze'): InspectResponse {
  const cacheKey = `${mode}:${input}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result = runPipeline(input, mode);
  setCache(cacheKey, result);
  return result;
}
