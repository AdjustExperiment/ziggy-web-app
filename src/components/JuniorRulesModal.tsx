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
  const juniorRulesContent = `
    <div class="space-y-6">
      <div class="text-sm text-muted-foreground italic mb-4">
        Last updated 09/12/2024 9:47 pm CT
      </div>
      
      <div class="space-y-4">
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">1. Team Composition</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            A team consists of two junior competitors. The team must not switch partners during the Tournament unless permission is obtained from Ziggy.
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">2. Team Roles</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            There is an affirmative team and a negative team. The affirmative must uphold the resolution. The negative may negate the resolution and/or the affirmative's case.
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">3. Preparation Time</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Each team has a total budget of 5 minutes of preparation time which may be used or discarded as desired by the teams. The five minutes cover both partners of the team (i.e. if the 1st negative speaker uses all 5 minutes for his/her 1st negative constructive, then no prep time is available for any other negative speech). A debater may take prep time before any speech except the 1st Affirmative Constructive. A debater may not take prep time before a cross examination.
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">4. Evidence Requirements</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Evidence from a source must be publicly available. The evidence must be available to be shared and be available to the opposing team and to the judge if requested. If evidence from a physical material such as a book is used, take a picture of what you are quoting so that you will be able to share it if you need to.
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">5. Visual Aids</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Debaters may not display props or visual aids to the judge.
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">6. Ballots and Feedback</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            The judge will fill out a ballot that will be visible to the junior debaters after completion. On the ballot will be the decision about which team won the round as well as specific feedback for each speaker.
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">7. Rebuttal Restrictions</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            No new arguments are allowed in the rebuttal speeches (see helpful hints #3).
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">8. Age Requirement</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Competitors must be 12 or younger
          </p>
        </div>
        
        <div class="mb-4 p-4 bg-muted/30 rounded-lg">
          <h4 class="font-semibold text-foreground mb-2">9. Speaking Times</h4>
          <p class="text-sm text-muted-foreground leading-relaxed">
            1AC: 3 minutes | Cross Examination (CX): 1 min. | 1NC: 3 min. | CX: 1 min. | 2AC: 3 min. | CX: 1 min. | 2NC: 3 min. | CX: 1 min. | 1NR: 3 min. | 1AR: 3 min. | 2NR: 3 min. | 2AR: 3 min.
            <br><br>
            Each team has 5 minutes of prep time that they can use.
          </p>
        </div>
      </div>
      
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-foreground mb-3">Evidence Guidelines</h3>
        <div class="text-sm text-muted-foreground leading-relaxed space-y-2">
          <div>• Evidence may be an article, quote, or paragraph from a book, newspaper, or online source.</div>
          <div>• You must include the entire paragraph that your evidence is found in to make sure appropriate context is included. However, you do not have to read the entire paragraph.</div>
          <div>• NO MANIPULATION of the evidence (cutting out or adding words or moving around sentences) is allowed.</div>
          <div>• The source (along with credentials) and date of when the evidence was published must be included in your citation and read aloud to judge and opponents when presenting the evidence.</div>
        </div>
      </div>
      
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-foreground mb-3">Helpful Hints & Explanations</h3>
        <div class="space-y-3">
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">1. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              Debate is a competition between 2 teams, each supporting their side of the resolution. Affirmative is affirming the resolution (yes, the resolution is true). The negative team negates the resolution (no, the resolution isn't true).
            </span>
          </div>
          
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">2. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              Constructive Speech Purpose: Constructive speeches are used to introduce and build arguments in the round and/or to respond to previous speakers.
            </span>
          </div>
          
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">3. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              Rebuttal Speech Purpose: Rebuttal speeches are used to respond to and extend existing lines of argumentation and to emphasize the most important issues in the round. No new arguments may be presented in rebuttal speeches. New evidence, examples, analysis, analogies, etc. that support previously introduced lines of argumentation, are permitted in rebuttal speeches.
            </span>
          </div>
          
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">4. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              There will be six rounds of debate providing each team the opportunity to debate the resolution on both the Affirmative and Negative positions.
            </span>
          </div>
          
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">5. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              An older student or parent is permitted to be present with each team to make sure the junior competitors speak in the correct order and are able to find and/or share their evidence cards. Additionally, they may give advice in between speeches to junior competitors.
            </span>
          </div>
          
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">6. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              Each debate team member may find it more comfortable having 5-8 "cards" of evidence for both Affirmative and Negative sides of the resolutions.<br>
              a. "Tag lines" are helpful titles for each piece of evidence to sum up what the main argument or point of the evidence is.<br>
              b. Practice reading the evidence before the tournament to make sure you know how to pronounce the tricky words and understand what they mean.
            </span>
          </div>
          
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">7. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              Pens, notebooks/flowpads, sticky-notes, evidence, water, and copy of these rules are allowed in the round.
            </span>
          </div>
          
          <div class="pl-4 border-l-2 border-primary/20">
            <span class="font-medium text-foreground">8. </span>
            <span class="text-sm text-muted-foreground leading-relaxed">
              HAVE FUN! This is a learning experience for everyone and so make sure to relax and have fun!
            </span>
          </div>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <h3 class="text-lg font-semibold text-foreground mb-2">Resolution</h3>
        <p class="text-sm font-medium text-foreground">
          Resolved: In US history, Benjamin Franklin was more important than Thomas Jefferson.
        </p>
      </div>
    </div>
  `;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="flex flex-col max-w-4xl max-h-[85vh] overflow-hidden bg-card/95 backdrop-blur-sm border-primary/20">
        <DialogHeader className="pb-4 border-b border-border/50 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Users className="h-6 w-6 text-primary mr-3" />
            Junior Tournament Rules
          </DialogTitle>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline" className="inline-flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Last updated 09/12/2024 9:47 pm CT
            </Badge>
            <Badge variant="secondary" className="inline-flex items-center">
              <FileText className="h-3 w-3 mr-1" />
              Ages 12 & Under
            </Badge>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-6">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: juniorRulesContent }}
          />
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