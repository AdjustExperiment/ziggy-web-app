export interface RawFormat {
  rules?: any;
  timing_rules?: any;
  judging_criteria?: any;
}

export interface ParsedFormat {
  rules: any;
  timingRules: any;
  judgingCriteria: any;
}

export function parseFormat(format: RawFormat): ParsedFormat {
  return {
    rules: typeof format.rules === 'string' ? JSON.parse(format.rules) : format.rules || {},
    timingRules: typeof format.timing_rules === 'string' ? JSON.parse(format.timing_rules) : format.timing_rules || {},
    judgingCriteria: typeof format.judging_criteria === 'string' ? JSON.parse(format.judging_criteria) : format.judging_criteria || {}
  };
}

export function validateFormat(format: ParsedFormat): string[] {
  const errors: string[] = [];
  if (!format.rules || typeof format.rules !== 'object') errors.push('Invalid rules');
  if (!format.timingRules || typeof format.timingRules !== 'object') errors.push('Invalid timing rules');
  if (!format.judgingCriteria || typeof format.judgingCriteria !== 'object') errors.push('Invalid judging criteria');
  return errors;
}
