export interface FormatTemplate {
  key: string;
  name: string;
  description: string;
  rules: any;
  timing_rules: Record<string, number>;
  judging_criteria: Record<string, number>;
}

export const FORMAT_TEMPLATES: Record<string, FormatTemplate> = {
  lincoln_douglas: {
    key: 'lincoln_douglas',
    name: 'Lincoln-Douglas',
    description: 'One-on-one value debate.',
    rules: { speeches: ['AC', 'NC', '1AR', 'NR', '2AR'] },
    timing_rules: { AC: 6, NC: 7, '1AR': 4, NR: 6, '2AR': 3 },
    judging_criteria: { persuasion: 30, evidence: 30, strategy: 40 },
  },
  team_policy: {
    key: 'team_policy',
    name: 'Team Policy',
    description: 'Two-on-two policy debate.',
    rules: { speeches: ['1AC','1NC','2AC','2NC','1NR','1AR','2NR','2AR'] },
    timing_rules: { constructive: 8, rebuttal: 5 },
    judging_criteria: { content: 40, delivery: 30, strategy: 30 },
  },
};
