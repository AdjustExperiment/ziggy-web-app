export type DebateSide = 'aff' | 'neg' | 'both';

export interface TimingSegment {
  id: string;
  label: string;
  side?: DebateSide;
  type: 'speech' | 'cross-ex' | 'prep';
  duration: number; // minutes
}

export interface JudgingCriterion {
  id: string;
  label: string;
  description?: string;
  maxPoints?: number;
}

export interface FormatEngine {
  timing: TimingSegment[];
  criteria?: JudgingCriterion[];
  prepTime?: number; // minutes of preparation per team
}

/**
 * Parses a rules object into the normalized FormatEngine structure.
 * Accepts either a JSON string or a plain object.
 */
export function parseFormatRules(rules: unknown): FormatEngine {
  let data: any = rules;
  if (typeof rules === 'string') {
    try {
      data = JSON.parse(rules);
    } catch {
      data = {};
    }
  }

  const timing: TimingSegment[] = Array.isArray(data?.timing)
    ? data.timing.map((segment: any, index: number) => ({
        id: segment.id ?? `segment-${index + 1}`,
        label: segment.label ?? segment.id ?? `Segment ${index + 1}`,
        side: segment.side,
        type: segment.type ?? 'speech',
        duration: Number(segment.duration) || 0,
      }))
    : [];

  const criteria: JudgingCriterion[] = Array.isArray(data?.criteria)
    ? data.criteria.map((c: any, index: number) => ({
        id: c.id ?? `criterion-${index + 1}`,
        label: c.label ?? c.id ?? `Criterion ${index + 1}`,
        description: c.description,
        maxPoints: c.maxPoints,
      }))
    : [];

  const prepTime = typeof data?.prepTime === 'number' ? data.prepTime : undefined;

  return { timing, criteria, prepTime };
}
