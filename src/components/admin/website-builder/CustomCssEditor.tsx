import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import type { SitePage } from '@/types/website-builder';

interface CustomCssEditorProps {
  page: SitePage;
  onUpdate: (data: Partial<SitePage>) => Promise<void>;
}

export const CustomCssEditor = ({ page, onUpdate }: CustomCssEditorProps) => {
  const [css, setCss] = useState(page.custom_css || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCss(page.custom_css || '');
  }, [page.id, page.custom_css]);

  useEffect(() => {
    let styleEl = document.getElementById('live-custom-css') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'live-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = css;
  }, [css]);

  const saveCss = async () => {
    setSaving(true);
    await onUpdate({ custom_css: css });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom CSS</CardTitle>
        <CardDescription>Add custom styles for this page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={css}
          onChange={(e) => setCss(e.target.value)}
          placeholder="/* Enter custom CSS here */"
          rows={10}
        />
        <Button onClick={saveCss} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save CSS'}
        </Button>
      </CardContent>
    </Card>
  );
};

