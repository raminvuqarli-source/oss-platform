import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { languages, changeLanguage } from '@/lib/i18n';
import { apiRequest } from '@/lib/queryClient';

interface LanguageSwitcherProps {
  user?: { id: string } | null;
}

export function LanguageSwitcher({ user }: LanguageSwitcherProps = {}) {
  const { i18n, t } = useTranslation();

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const handleLanguageChange = async (code: string) => {
    changeLanguage(code);
    if (user) {
      try {
        await apiRequest("PATCH", "/api/auth/language", { language: code });
      } catch (error) {
        console.error("Failed to save language preference:", error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-language-switcher">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t("languageSwitcher.switchLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={i18n.language === language.code ? 'bg-accent' : ''}
            data-testid={`language-option-${language.code}`}
          >
            <span className="mr-2">{language.nativeName}</span>
            <span className="text-muted-foreground text-xs">({language.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
