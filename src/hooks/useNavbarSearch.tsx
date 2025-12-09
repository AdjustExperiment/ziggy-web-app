import { useState, useEffect, useMemo } from "react";

interface SearchResult {
  id: string;
  title: string;
  type: "page" | "blog";
  url: string;
  description?: string;
  matchedContext?: string;
}

interface SearchablePage {
  id: string;
  title: string;
  url: string;
  description: string;
  keywords: string[];
  content: string;
}

// Comprehensive searchable content index for all public pages
const searchablePages: SearchablePage[] = [
  {
    id: "home",
    title: "Home",
    url: "/",
    description: "Main homepage for Ziggy Online Debate",
    keywords: ["tournament", "debate", "competition", "online", "worldwide", "LD", "TP", "Parli", "Moot Court", "scholarships", "powermatching", "ziggy"],
    content: "The Best Online Debate Tournament. Connecting debaters worldwide. Practice with competitors from all across the country with powermatching, flexible scheduling, and affordable tournaments starting at just $30-35. Multiple debate formats including LD, TP, Parli, and Moot Court. Founded 2011. $2.4M+ in Scholarships. Access exclusive member resources including coaches, sourcebooks, and training materials."
  },
  {
    id: "about",
    title: "About Us",
    url: "/about",
    description: "Learn about Ziggy Online Debate platform",
    keywords: ["history", "team", "mission", "Isaac Sommers", "Perseus Aryani", "Justus Aryani", "Harvard Law", "NCFCA", "Stoa", "founder"],
    content: "Running Online Debate Tournaments Since 2011. Your all-in-one online debate tournament host and resource provider. Team Policy, Lincoln-Douglas, Parliamentary, Moot Court. Founded by Isaac Sommers. Perseus Aryani Director. Justus Aryani Assistant Director. Howard Payne University. Harvard Law School. Power Matching. Convenience and Price. Worldwide Competition. Real-World Success. Flexibility. Awards. No Registration Deadline. Quality Customer Service. Privacy and Security."
  },
  {
    id: "tournaments",
    title: "Tournaments",
    url: "/tournaments",
    description: "Browse and join debate tournaments",
    keywords: ["register", "compete", "schedule", "rounds", "events", "LD", "TP", "Parli", "sign up", "entry"],
    content: "Browse active tournaments. Register for upcoming events. View tournament schedules and rounds. LD Lincoln-Douglas. TP Team Policy. Parliamentary. Moot Court. Fall Tournament. Spring Tournament."
  },
  {
    id: "host-tournament",
    title: "Host a Tournament",
    url: "/host-tournament",
    description: "Host your own debate tournament with Ziggy",
    keywords: ["host", "organize", "custom", "league", "school", "club", "platform", "organization"],
    content: "Host Your Own Tournament. Coming Soon. Bring the Ziggy experience to your debate community. Professional tournament management. Automated scheduling. Real-time results. Judge coordination. Custom branding. Dedicated support. Analytics dashboard. Flexible pricing."
  },
  {
    id: "club-partners",
    title: "Club Partners",
    url: "/club-partners",
    description: "Partner with Ziggy for your debate club",
    keywords: ["partnership", "club", "organization", "discount", "benefits", "priority", "member"],
    content: "Club Partnership Program. Benefits for your debate community. Priority scheduling. Discounted entries. Dedicated support. Club recognition. Partner benefits. Application process."
  },
  {
    id: "ambassador",
    title: "Ambassador Program",
    url: "/ambassador",
    description: "Become a Ziggy Student Ambassador",
    keywords: ["ambassador", "student", "represent", "promote", "free entries", "leadership"],
    content: "Student Ambassador Program. Represent Ziggy in your debate community. Free tournament entries. Exclusive merchandise. Community leadership. Social media promotion. Event representation."
  },
  {
    id: "getting-started",
    title: "Getting Started",
    url: "/getting-started",
    description: "Step-by-step instructions for debaters and judges",
    keywords: ["instructions", "guide", "help", "how to", "debater", "judge", "schedule", "ballot", "tutorial"],
    content: "Getting Started. Instructions for Debaters. Instructions for Judges. Get Familiar With Ziggy. Talk To Your Opponent. Schedule Your Round. Request a Judge. Setting a Room. Show Up and Debate. Judge Orientation. Speaker Points Guide. Zoom. Google Meet. Discord."
  },
  {
    id: "results",
    title: "Results",
    url: "/results",
    description: "Tournament results and standings",
    keywords: ["scores", "rankings", "standings", "winners", "ballots", "records"],
    content: "Tournament results. View rankings and standings. Historical results. Speaker awards. Team rankings."
  },
  {
    id: "sponsors",
    title: "Sponsors",
    url: "/sponsors",
    description: "Our sponsors and partners",
    keywords: ["sponsor", "partner", "support", "Howard Payne University", "Rhetoric LLC", "ASDA", "Lasting Impact"],
    content: "Our Sponsors. Howard Payne University. Rhetoric LLC. Lasting Impact. ASDA. Platinum Partner. Gold Sponsor. Silver Sponsor. Bronze Sponsor."
  },
  {
    id: "become-sponsor",
    title: "Become a Sponsor",
    url: "/sponsor",
    description: "Sponsor Ziggy Online Debate",
    keywords: ["sponsor", "advertise", "partnership", "support", "donate"],
    content: "Become a Sponsor. Support the debate community. Advertising opportunities. Brand visibility. Community impact."
  },
  {
    id: "faq",
    title: "FAQ",
    url: "/faq",
    description: "Frequently asked questions",
    keywords: ["questions", "answers", "help", "support", "common", "troubleshooting"],
    content: "Frequently Asked Questions. Common questions about Ziggy tournaments. How to register. How to schedule. How to find a judge. Payment questions. Technical support."
  },
  {
    id: "contact",
    title: "Contact",
    url: "/contact",
    description: "Get in touch with us",
    keywords: ["email", "phone", "message", "support", "help", "reach"],
    content: "Contact Us. Get in touch with the Ziggy team. Email. Phone. Google Hangouts. Facebook Messenger. Support."
  },
  {
    id: "testimonials",
    title: "Testimonials",
    url: "/testimonials",
    description: "User testimonials and reviews",
    keywords: ["reviews", "feedback", "experience", "success stories", "quotes"],
    content: "What our participants say. User testimonials and success stories. Competitor reviews. Judge feedback."
  },
  {
    id: "blog",
    title: "Blog",
    url: "/blog",
    description: "Latest news and updates",
    keywords: ["news", "updates", "articles", "announcements", "posts"],
    content: "Ziggy Blog. Latest news and updates. Tournament announcements. Debate tips. Community news."
  },
  {
    id: "rules",
    title: "Rules",
    url: "/rules",
    description: "Tournament rules and guidelines",
    keywords: ["rules", "guidelines", "regulations", "policies", "formats", "procedures"],
    content: "Tournament Rules. Official rules and guidelines for all debate formats. LD rules. TP rules. Parli rules. Moot Court rules. Code of conduct. Fair play."
  },
  {
    id: "learn-debate",
    title: "Learn About Debate",
    url: "/learn-about-debate",
    description: "Introduction to debate",
    keywords: ["learn", "education", "formats", "LD", "TP", "Parli", "beginner", "intro", "what is"],
    content: "Learn About Debate. Introduction to debate formats and techniques. Lincoln-Douglas. Team Policy. Parliamentary. Moot Court. How to debate. Debate basics."
  },
  {
    id: "teams",
    title: "Teams",
    url: "/teams",
    description: "Team management and information",
    keywords: ["team", "partner", "duo", "group", "manage"],
    content: "Team management. Partner information. Team registration. Team results."
  }
];

function getMatchedContext(content: string, searchTerm: string): string {
  const lowerContent = content.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerSearch);
  
  if (index === -1) return "";
  
  const start = Math.max(0, index - 30);
  const end = Math.min(content.length, index + searchTerm.length + 50);
  
  let context = content.slice(start, end);
  if (start > 0) context = "..." + context;
  if (end < content.length) context = context + "...";
  
  return context;
}

function calculateRelevance(page: SearchablePage, searchTerm: string): number {
  const term = searchTerm.toLowerCase();
  let score = 0;
  
  // Title match (highest priority)
  if (page.title.toLowerCase().includes(term)) {
    score += 100;
    if (page.title.toLowerCase() === term) score += 50;
  }
  
  // Keyword match (high priority)
  page.keywords.forEach(keyword => {
    if (keyword.toLowerCase().includes(term)) {
      score += 30;
      if (keyword.toLowerCase() === term) score += 20;
    }
  });
  
  // Description match (medium priority)
  if (page.description.toLowerCase().includes(term)) {
    score += 15;
  }
  
  // Content match (lower priority but still important)
  const contentLower = page.content.toLowerCase();
  if (contentLower.includes(term)) {
    score += 10;
    // Bonus for multiple occurrences
    const occurrences = (contentLower.match(new RegExp(term, 'g')) || []).length;
    score += Math.min(occurrences * 2, 10);
  }
  
  return score;
}

export function useNavbarSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        
        const term = searchTerm.toLowerCase().trim();
        
        // Score and filter pages
        const scoredPages = searchablePages
          .map(page => ({
            page,
            score: calculateRelevance(page, term)
          }))
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);
        
        // Convert to SearchResult format
        const searchResults: SearchResult[] = scoredPages.slice(0, 8).map(item => ({
          id: item.page.id,
          title: item.page.title,
          type: "page" as const,
          url: item.page.url,
          description: item.page.description,
          matchedContext: getMatchedContext(item.page.content, term)
        }));

        // Simulate search delay for smooth animation
        setTimeout(() => {
          setResults(searchResults);
          setIsSearching(false);
          setShowResults(true);
        }, 150);
      } else {
        setResults([]);
        setShowResults(false);
        setIsSearching(false);
      }
    }, 200); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
    setIsSearching(false);
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    showResults,
    clearSearch,
    setShowResults
  };
}
