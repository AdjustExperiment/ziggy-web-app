import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import type { SitePageVersion } from '@/types/website-builder';

interface VersionsSidebarProps {
  pageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: SitePageVersion) => Promise<void>;
}

export const VersionsSidebar = ({ pageId, open, onOpenChange, onRestore }: VersionsSidebarProps) => {
  const [versions, setVersions] = useState<SitePageVersion[]>([]);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pageId]);

  const loadVersions = async () => {
    const { data } = await supabase
      .from('site_page_versions')
      .select('*')
      .eq('page_id', pageId)
      .order('version_number', { ascending: false });
    setVersions((data as SitePageVersion[]) || []);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Versions</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-2">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="text-sm font-medium">Version {v.version_number}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleString()}
                </div>
              </div>
              <Button size="sm" onClick={() => onRestore(v)}>
                Restore
              </Button>
            </div>
          ))}
          {versions.length === 0 && (
            <div className="text-sm text-muted-foreground">No versions found.</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

