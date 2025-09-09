export interface ParsedFormat {
  structure: string[];
  timing: Record<string, number>;
  judging: Record<string, number>;
}

export function parseFormat(format: any): ParsedFormat {
  return {
    structure: Array.isArray(format?.rules?.speeches)
      ? format.rules.speeches
      : [],
    timing: typeof format?.timing_rules === 'object' && format?.timing_rules !== null
      ? format.timing_rules
      : {},
    judging: typeof format?.judging_criteria === 'object' && format?.judging_criteria !== null
      ? format.judging_criteria
      : {},
  };
}

export function validateFormat(parsed: ParsedFormat): string[] {
  const errors: string[] = [];
  if (parsed.structure.length === 0) {
    errors.push('Format is missing speech structure');
  }
  for (const [speech, time] of Object.entries(parsed.timing)) {
    if (typeof time !== 'number') {
      errors.push(`Timing for ${speech} must be a number`);
    }
  }
  for (const [criterion, max] of Object.entries(parsed.judging)) {
    if (typeof max !== 'number') {
      errors.push(`Judging criterion ${criterion} must be a number`);
    }
  }
  return errors;
}

export function getSpeechTimer(speech: string, parsed: ParsedFormat): number | undefined {
  return parsed.timing[speech];
}

export function scoreSpeech(scores: Record<string, number>, parsed: ParsedFormat): number {
  return Object.entries(scores).reduce((total, [criterion, value]) => {
    const max = parsed.judging[criterion] ?? 0;
    const clamped = Math.min(value, max);
    return total + clamped;
  }, 0);
}
