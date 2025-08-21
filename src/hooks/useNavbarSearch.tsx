import { useState, useEffect } from "react";

interface SearchResult {
  id: string;
  title: string;
  type: "page" | "blog";
  url: string;
  description?: string;
}

// Static page results
const staticPages: SearchResult[] = [
  { id: "1", title: "Home", type: "page", url: "/", description: "Main homepage" },
  { id: "2", title: "About Us", type: "page", url: "/about", description: "Learn about our platform" },
  { id: "3", title: "Features", type: "page", url: "/features", description: "Platform features and capabilities" },
  { id: "4", title: "Tournaments", type: "page", url: "/tournaments", description: "Browse and join tournaments" },
  { id: "5", title: "Results", type: "page", url: "/results", description: "Tournament results and standings" },
  { id: "6", title: "Teams", type: "page", url: "/teams", description: "Team management and information" },
  { id: "7", title: "Dashboard", type: "page", url: "/dashboard", description: "User dashboard and analytics" },
  { id: "8", title: "Analytics", type: "page", url: "/analytics", description: "Performance analytics and insights" },
  { id: "9", title: "Contact", type: "page", url: "/contact", description: "Get in touch with us" },
  { id: "10", title: "FAQ", type: "page", url: "/faq", description: "Frequently asked questions" },
  { id: "11", title: "Blog", type: "page", url: "/blog", description: "Latest news and updates" },
  { id: "12", title: "Testimonials", type: "page", url: "/testimonials", description: "User testimonials and reviews" },
];

export function useNavbarSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        
        // Filter static pages
        const filteredPages = staticPages.filter(page =>
          page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (page.description && page.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Simulate search delay for smooth animation
        setTimeout(() => {
          setResults(filteredPages.slice(0, 6)); // Limit to 6 results
          setIsSearching(false);
          setShowResults(true);
        }, 200);
      } else {
        setResults([]);
        setShowResults(false);
        setIsSearching(false);
      }
    }, 300); // Debounce search

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