import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
  "data-testid"?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  showClear = true,
  "data-testid": testId,
}: SearchInputProps) {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-10 pr-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      />
      {showClear && value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 px-2"
          onClick={() => onChange("")}
          data-testid={testId ? `${testId}-clear` : "button-clear-search"}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default SearchInput;
