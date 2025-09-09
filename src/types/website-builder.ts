
// Website Builder Types
export interface SitePage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  seo: any;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  custom_css: string | null;
}

export interface SiteBlock {
  id: string;
  page_id: string;
  type: string;
  content: any;
  position: number;
  parent_block_id: string | null;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SitePageVersion {
  id: string;
  page_id: string;
  version_number: number;
  blocks: SiteBlock[];
  custom_css: string | null;
  created_at: string;
}

export interface AIAnalysis {
  id: string;
  page_id: string;
  analysis: any;
  suggestions: any;
  created_at: string;
}
