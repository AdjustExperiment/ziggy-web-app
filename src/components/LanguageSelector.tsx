import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES, loadLanguage } from '@/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { toast } from 'sonner';

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const { user } = useOptimizedAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLang, setLoadingLang] = useState<string | null>(null);
  
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) 
    || SUPPORTED_LANGUAGES[0];
  
  const changeLanguage = async (code: string) => {
    if (code === i18n.language || isLoading) return;
    
    console.log(`[LanguageSelector] Switching language to: ${code}`);
    setIsLoading(true);
    setLoadingLang(code);
    
    try {
      // FIRST: Preload translations before switching
      console.log(`[LanguageSelector] Preloading translations for: ${code}`);
      await loadLanguage(code);
      
      // THEN: Change language (translations already loaded)
      console.log(`[LanguageSelector] Translations loaded, changing language`);
      await i18n.changeLanguage(code);
      
      // Save to DB if logged in
      if (user?.id) {
        console.log(`[LanguageSelector] Saving preference to profile`);
        await supabase
          .from('profiles')
          .update({ preferred_language: code })
          .eq('user_id', user.id);
      }
      
      console.log(`[LanguageSelector] Language switch complete`);
    } catch (error) {
      console.error('[LanguageSelector] Failed to change language:', error);
      toast.error('Failed to change language. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingLang(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1.5 h-9 px-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {!compact && (
            <>
              <span className="hidden sm:inline text-sm">
                {isLoading ? 'Loading...' : currentLang.nativeName}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 z-[60]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            disabled={isLoading}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </span>
            {loadingLang === lang.code ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : currentLang.code === lang.code ? (
              <Check className="h-4 w-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
