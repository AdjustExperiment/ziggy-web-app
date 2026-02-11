import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { ExternalLink, FileText, Calendar, ScrollText } from 'lucide-react';
import JuniorRulesModal from '@/components/JuniorRulesModal';

interface Rule {
  number: number;
  title: string;
  content: string;
  anchor: string;
}

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('February 1, 2025');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRulesContent();
  }, []);

  const fetchRulesContent = async () => {
    // Use static rules directly - external WordPress API is unreliable
    // This ensures instant loading without skeleton flicker
    setRules(getStaticRules());
    setIsLoading(false);
  };

  const parseRulesFromHTML = (html: string): Rule[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rules: Rule[] = [];
    
    // Find all elements that contain numbered rules
    const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    let currentRule: Partial<Rule> | null = null;
    let contentBuffer: string[] = [];
    
    elements.forEach((element) => {
      const text = element.textContent || '';
      
      // Check if this is a rule title (starts with number followed by period)
      const ruleMatch = text.match(/^(\d+)\.\s*(.+)/);
      
      if (ruleMatch) {
        // Save previous rule if it exists
        if (currentRule && currentRule.number && currentRule.title) {
          rules.push({
            number: currentRule.number,
            title: currentRule.title,
            content: contentBuffer.join('\n\n'),
            anchor: `rule${currentRule.number}`
          });
        }
        
        // Start new rule
        currentRule = {
          number: parseInt(ruleMatch[1]),
          title: ruleMatch[2].trim()
        };
        contentBuffer = [];
      } else if (currentRule && text.trim()) {
        // Add content to current rule
        contentBuffer.push(text.trim());
      }
    });
    
    // Add the last rule
    if (currentRule && currentRule.number && currentRule.title) {
      rules.push({
        number: currentRule.number,
        title: currentRule.title,
        content: contentBuffer.join('\n\n'),
        anchor: `rule${currentRule.number}`
      });
    }
    
    return rules;
  };

  const getStaticRules = (): Rule[] => {
    return [
      {
        number: 1,
        title: "Aff team is responsible for contacting the judge.",
        content: "The Affirmative team/debater is responsible for contacting the judge, unless the Negative team volunteers to do so. Regardless of who contacts the judge, it should be done as soon as possible.",
        anchor: "rule1"
      },
      {
        number: 2,
        title: "Aff must share their case before the round for Team Policy.",
        content: "(a) Timeline for sharing the case.\n\n(i) During the Spring or Fall Semester tournaments: If you are the Aff team, you need to send at least an OUTLINE of your TP case to your opponents (whether to send the full case is up to you) within 72 hours of the time you get your round pairing, or 48 hours before the debate round is scheduled, whichever is sooner. Since you don't always know when your round will be scheduled, the best option is to send your opponents a copy or an outline of your 1AC as soon as you get your round pairing.\n\n(ii) During a faster-paced or real-time tournament: If you are doing a fast-paced or real-time tournament (see Rule 21), the Aff team must send an outline or copy of their 1AC to the Neg team during (not before) the round, upon request. (Teams are, of course, welcome to share their case earlier if so desired, but it is not mandatory.)\n\n(b) Deletion of shared case by Neg team. All teams will need to delete the copies/outlines after the round ends, and the copies/outlines of the case that are sent to you may not be shared with anyone in any form.",
        anchor: "rule2"
      },
      {
        number: 3,
        title: "Flow sharing, but not case/case details-sharing, is permitted.",
        content: "The only information you are allowed to share outside of Ziggy is what you handwrite in notes on your flowpad during a given round. You may share your flows with others, but these need to be based solely on what you handwrite from what you hear in the round, NO DETAILS whatsoever may be taken from the 1AC sent to you.",
        anchor: "rule3"
      },
      {
        number: 4,
        title: "Judge requests for evidence.",
        content: "(a) What may be shared with judges. Judges may request specific pieces of evidence that were read in the round. Judges may not request a complete copy of a case or of a brief.\n\n(b) How evidence must be shared with judges. The team requested must either send the evidence to the judge in an email and CC their opponent, or must copy/paste the evidence into the chat box of the group chat platform that the debaters are using.",
        anchor: "rule4"
      },
      {
        number: 5,
        title: "Judge qualifications and expectations.",
        content: "You are qualified to judge for Ziggy Online Debate if you have graduated high school and are not competing in Ziggy yourself. Contact Ziggy if you have questions about specific individuals who you'd like to sign up to judge, or if you are a debate coach who also debates and would like to request an exemption to this rule.\n\nEach judge should try to judge a total of 5 rounds. If every person judges 5 rounds, all rounds should be covered.",
        anchor: "rule5"
      },
      {
        number: 6,
        title: "Judges with conflicts.",
        content: "(a) Definition. A \"conflicted judge\" is a judge who has either judged one or both of the teams before, or who is a family member, friend, or coach of one of the teams.\n\n(b) When conflicted judges can judge. If (i) no other judge can be found, (ii) the judge believes they can judge without being biased, and (iii) both teams agree to have the conflicted judge, it is allowed. This should only be a last-resort option.",
        anchor: "rule6"
      }
      // Add more static rules as needed for fallback
    ];
  };

  const scrollToRule = (anchor: string) => {
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ScrollText className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold font-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Official Ziggy Tournament Rules
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground mb-4 font-secondary">
            These are the official Rules of Ziggy Tournaments. For Junior Tournament specific rules, please{' '}
            <JuniorRulesModal>
              <button className="text-primary hover:text-primary/80 underline inline-flex items-center cursor-pointer">
                click here <FileText className="ml-1 h-4 w-4" />
              </button>
            </JuniorRulesModal>
          </p>
          
          <Badge variant="outline" className="inline-flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Last updated {lastUpdated}
          </Badge>
        </div>

        {/* Table of Contents */}
        {rules.length > 0 && (
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Table of Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {rules.map((rule) => (
                <Button
                  key={rule.number}
                  variant="ghost"
                  onClick={() => scrollToRule(rule.anchor)}
                  className="justify-start text-left h-auto p-2 hover:bg-muted/50"
                  title={`${rule.number}. ${rule.title}`}
                  aria-label={`Jump to rule ${rule.number}: ${rule.title}`}
                >
                  <div className="flex items-center w-full min-w-0">
                    <span className="font-medium text-primary mr-2 shrink-0">{rule.number}.</span>
                    <span className="text-sm truncate min-w-0">{rule.title}</span>
                  </div>
                </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rules Accordion */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-4">
              {rules.map((rule) => (
                <AccordionItem 
                  key={rule.number} 
                  value={`rule-${rule.number}`}
                  id={rule.anchor}
                  className="scroll-mt-24 border border-border/50 rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <div className="flex items-start space-x-3">
                      <Badge variant="secondary" className="mt-1">
                        {rule.number}
                      </Badge>
                      <span className="font-medium">{rule.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {rule.content.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-3 text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Questions about the rules?</h3>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these rules, please contact us.
            </p>
            <Button asChild variant="outlineCta">
              <a href="mailto:rules@ziggyonlinedebate.com?subject=Rules%20Question">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Rules Committee
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}