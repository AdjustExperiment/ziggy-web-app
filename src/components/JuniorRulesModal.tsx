import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, Calendar, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JuniorRulesModalProps {
  children: React.ReactNode;
}

export default function JuniorRulesModal({ children }: JuniorRulesModalProps) {
  const juniorRulesContent = [
    {
      type: 'intro',
      content: 'Last updated September 12, 2024'
    },
    {
      type: 'rule',
      number: 1,
      title: 'Team Composition',
      content: 'A team consists of two junior competitors. The team must not switch partners during the Tournament unless permission is obtained from Ziggy.'
    },
    {
      type: 'rule',
      number: 2,
      title: 'Team Roles',
      content: 'There is an affirmative team and a negative team. The affirmative must uphold the resolution. The negative may negate the resolution and/or the affirmative\'s case.'
    },
    {
      type: 'rule',
      number: 3,
      title: 'Preparation Time',
      content: 'Each team has a total budget of 5 minutes of preparation time which may be used or discarded as desired by the teams. The five minutes cover both partners of the team (i.e. if the 1st negative speaker uses all 5 minutes for his/her 1st negative constructive, then no prep time is available for any other negative speech). A debater may take prep time before any speech except the 1st Affirmative Constructive. A debater may not take prep time before a cross examination.'
    },
    {
      type: 'rule',
      number: 4,
      title: 'Evidence Requirements',
      content: 'Evidence from a source must be publicly available. The evidence must be available to be shared and be available to the opposing team and to the judge if requested. If evidence from a physical material such as a book is used, take a picture of what you are quoting so that you will be able to share it if you need to.'
    },
    {
      type: 'rule',
      number: 5,
      title: 'Visual Aids',
      content: 'Debaters may not display props or visual aids to the judge.'
    },
    {
      type: 'rule',
      number: 6,
      title: 'Ballots and Feedback',
      content: 'The judge will fill out a ballot that will be visible to the junior debaters after completion. On the ballot will be the decision about which team won the round as well as specific feedback for each speaker.'
    },
    {
      type: 'rule',
      number: 7,
      title: 'Rebuttal Restrictions',
      content: 'No new arguments are allowed in the rebuttal speeches (see helpful hints #3).'
    },
    {
      type: 'rule',
      number: 8,
      title: 'Age Requirement',
      content: 'Competitors must be 12 or younger.'
    },
    {
      type: 'rule',
      number: 9,
      title: 'Speaking Times',
      content: '1AC: 3 minutes | Cross Examination (CX): 1 min. | 1NC: 3 min. | CX: 1 min. | 2AC: 3 min. | CX: 1 min. | 2NC: 3 min. | CX: 1 min. | 1NR: 3 min. | 1AR: 3 min. | 2NR: 3 min. | 2AR: 3 min.\n\nEach team has 5 minutes of prep time that they can use.'
    },
    {
      type: 'section',
      title: 'Evidence Guidelines',
      content: '• Evidence may be an article, quote, or paragraph from a book, newspaper, or online source.\n• You must include the entire paragraph that your evidence is found in to make sure appropriate context is included. However, you do not have to read the entire paragraph.\n• NO MANIPULATION of the evidence (cutting out or adding words or moving around sentences) is allowed.\n• The source (along with credentials) and date of when the evidence was published must be included in your citation and read aloud to judge and opponents when presenting the evidence.'
    },
    {
      type: 'section',
      title: 'Helpful Hints & Explanations',
      items: [
        {
          number: 1,
          content: 'Debate is a competition between 2 teams, each supporting their side of the resolution. Affirmative is affirming the resolution (yes, the resolution is true). The negative team negates the resolution (no, the resolution isn\'t true).'
        },
        {
          number: 2,
          content: 'Constructive Speech Purpose: Constructive speeches are used to introduce and build arguments in the round and/or to respond to previous speakers.'
        },
        {
          number: 3,
          content: 'Rebuttal Speech Purpose: Rebuttal speeches are used to respond to and extend existing lines of argumentation and to emphasize the most important issues in the round. No new arguments may be presented in rebuttal speeches. New evidence, examples, analysis, analogies, etc. that support previously introduced lines of argumentation, are permitted in rebuttal speeches.'
        },
        {
          number: 4,
          content: 'There will be six rounds of debate providing each team the opportunity to debate the resolution on both the Affirmative and Negative positions.'
        },
        {
          number: 5,
          content: 'An older student or parent is permitted to be present with each team to make sure the junior competitors speak in the correct order and are able to find and/or share their evidence cards. Additionally, they may give advice in between speeches to junior competitors.'
        },
        {
          number: 6,
          content: 'Each debate team member may find it more comfortable having 5-8 "cards" of evidence for both Affirmative and Negative sides of the resolutions.\na. "Tag lines" are helpful titles for each piece of evidence to sum up what the main argument or point of the evidence is.\nb. Practice reading the evidence before the tournament to make sure you know how to pronounce the tricky words and understand what they mean.'
        },
        {
          number: 7,
          content: 'Pens, notebooks/flowpads, sticky-notes, evidence, water, and copy of these rules are allowed in the round.'
        },
        {
          number: 8,
          content: 'HAVE FUN! This is a learning experience for everyone and so make sure to relax and have fun!'
        }
      ]
    },
    {
      type: 'resolution',
      content: 'Resolved: In US history, Benjamin Franklin was more important than Thomas Jefferson.'
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-card/95 backdrop-blur-sm border-primary/20">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Users className="h-6 w-6 text-primary mr-3" />
            Junior Tournament Rules
          </DialogTitle>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline" className="inline-flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Last updated September 12, 2024
            </Badge>
            <Badge variant="secondary" className="inline-flex items-center">
              <FileText className="h-3 w-3 mr-1" />
              Ages 12 & Under
            </Badge>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-6">
          <div className="prose prose-sm max-w-none dark:prose-invert space-y-6">
            {juniorRulesContent.map((item, index) => {
              if (item.type === 'intro') {
                return (
                  <p key={index} className="text-sm text-muted-foreground italic mb-4">
                    {item.content}
                  </p>
                );
              } else if (item.type === 'rule') {
                return (
                  <div key={index} className="mb-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">
                      {item.number}. {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                );
              } else if (item.type === 'section') {
                return (
                  <div key={index} className="mb-6">
                    <h3 className="text-lg font-semibold text-primary mb-3">
                      {item.title}
                    </h3>
                    {item.items ? (
                      <div className="space-y-3">
                        {item.items.map((hint, hintIndex) => (
                          <div key={hintIndex} className="pl-4 border-l-2 border-primary/20">
                            <span className="font-medium text-foreground">{hint.number}. </span>
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {hint.content.split('\n').map((line, lineIndex) => (
                                <span key={lineIndex}>
                                  {line}
                                  {lineIndex < hint.content.split('\n').length - 1 && <br />}
                                </span>
                              ))}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {item.content.split('\n').map((line, lineIndex) => (
                          <div key={lineIndex} className="mb-1">
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else if (item.type === 'resolution') {
                return (
                  <div key={index} className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h3 className="text-lg font-semibold text-primary mb-2">Current Resolution</h3>
                    <p className="text-sm font-medium text-foreground">
                      {item.content}
                    </p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button variant="outline" asChild>
            <a 
              href="https://docs.google.com/document/d/1LcmnVSV0c2WCIuHDNHUh4ANapJite1dTAJLmSvRhtEc/edit?pli=1&tab=t.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Original Document
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}