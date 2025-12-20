import { FormatEngine } from './index';

export interface FormatTemplate {
  key: string;
  name: string;
  description: string;
  rules: FormatEngine;
}

export const FORMAT_TEMPLATES: FormatTemplate[] = [
  {
    key: 'team-policy',
    name: 'Team Policy',
    description: '8-3-5 team policy debate with 5 minutes prep time',
    rules: {
      prepTime: 5,
      timing: [
        { id: '1AC', label: '1AC', side: 'aff', type: 'speech', duration: 8 },
        { id: 'CX1', label: 'Cross-Ex 1', side: 'neg', type: 'cross-ex', duration: 3 },
        { id: '1NC', label: '1NC', side: 'neg', type: 'speech', duration: 8 },
        { id: 'CX2', label: 'Cross-Ex 2', side: 'aff', type: 'cross-ex', duration: 3 },
        { id: '2AC', label: '2AC', side: 'aff', type: 'speech', duration: 8 },
        { id: 'CX3', label: 'Cross-Ex 3', side: 'neg', type: 'cross-ex', duration: 3 },
        { id: '2NC', label: '2NC', side: 'neg', type: 'speech', duration: 8 },
        { id: 'CX4', label: 'Cross-Ex 4', side: 'aff', type: 'cross-ex', duration: 3 },
        { id: '1NR', label: '1NR', side: 'neg', type: 'speech', duration: 5 },
        { id: '1AR', label: '1AR', side: 'aff', type: 'speech', duration: 5 },
        { id: '2NR', label: '2NR', side: 'neg', type: 'speech', duration: 5 },
        { id: '2AR', label: '2AR', side: 'aff', type: 'speech', duration: 5 }
      ],
      criteria: [
        { id: 'content', label: 'Content' },
        { id: 'strategy', label: 'Strategy' },
        { id: 'speaking', label: 'Speaking' }
      ]
    }
  },
  {
    key: 'lincoln-douglas',
    name: 'Lincoln-Douglas',
    description: 'Standard LD with 4 minutes prep time',
    rules: {
      prepTime: 4,
      timing: [
        { id: '1AC', label: '1AC', side: 'aff', type: 'speech', duration: 6 },
        { id: 'CX1', label: 'Cross-Ex 1', side: 'neg', type: 'cross-ex', duration: 3 },
        { id: '1NC', label: '1NC', side: 'neg', type: 'speech', duration: 7 },
        { id: 'CX2', label: 'Cross-Ex 2', side: 'aff', type: 'cross-ex', duration: 3 },
        { id: '1AR', label: '1AR', side: 'aff', type: 'speech', duration: 4 },
        { id: '1NR', label: '1NR', side: 'neg', type: 'speech', duration: 6 },
        { id: '2AR', label: '2AR', side: 'aff', type: 'speech', duration: 3 }
      ],
      criteria: [
        { id: 'content', label: 'Content' },
        { id: 'strategy', label: 'Strategy' },
        { id: 'speaking', label: 'Speaking' }
      ]
    }
  }
];
