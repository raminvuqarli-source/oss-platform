import { forwardRef } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { cn } from '@/lib/utils';

interface InternationalPhoneInputProps {
  value: string;
  onChange: (value: string, country: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputProps?: Record<string, any>;
}

export const InternationalPhoneInput = forwardRef<HTMLInputElement, InternationalPhoneInputProps>(
  ({ value, onChange, placeholder, disabled, className, inputProps }, ref) => {
    // Ensure the value passed to PhoneInput doesn't have the + prefix (component adds it)
    const normalizedValue = value?.startsWith('+') ? value.slice(1) : value;
    
    // When onChange fires, ensure we pass E.164 format with + prefix
    const handleChange = (phone: string, country: any) => {
      const formattedPhone = phone ? `+${phone}` : '';
      onChange(formattedPhone, country);
    };
    
    return (
      <div className={cn("phone-input-container", className)}>
        <PhoneInput
          country={'az'}
          value={normalizedValue}
          onChange={handleChange}
          placeholder={placeholder || 'Enter phone number'}
          disabled={disabled}
          inputProps={{
            ...inputProps,
            'data-testid': 'input-phone',
          }}
          containerClass="!w-full"
          inputClass="!w-full !h-10 !rounded-md !border !border-input !bg-background !text-sm !ring-offset-background focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2"
          buttonClass="!border !border-input !bg-background !rounded-l-md !h-10"
          dropdownClass="!bg-popover !text-popover-foreground !border !border-input !rounded-md !shadow-md !z-50"
          searchClass="!bg-background !border !border-input !rounded !text-foreground"
          enableSearch
          searchPlaceholder="Search country..."
          preferredCountries={['az', 'us', 'gb', 'de', 'tr', 'ae', 'sa', 'es', 'nl', 'ir']}
        />
        <style>{`
          .phone-input-container .react-tel-input {
            font-family: inherit;
          }
          .phone-input-container .react-tel-input .form-control {
            padding-left: 60px !important;
          }
          .phone-input-container .react-tel-input .flag-dropdown {
            width: 52px;
          }
          .phone-input-container .react-tel-input .selected-flag {
            width: 50px;
            padding: 0 0 0 8px;
          }
          .phone-input-container .react-tel-input .selected-flag .flag {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
          }
          .phone-input-container .react-tel-input .selected-flag .arrow {
            left: 24px;
          }
          .phone-input-container .react-tel-input .country-list {
            max-height: 200px;
            overflow-y: auto;
          }
          .phone-input-container .react-tel-input .country-list .country:hover {
            background-color: hsl(var(--accent));
          }
          .phone-input-container .react-tel-input .country-list .country.highlight {
            background-color: hsl(var(--accent));
          }
          .phone-input-container .react-tel-input .flag-dropdown.open .selected-flag {
            background-color: hsl(var(--accent));
          }
          .phone-input-container .react-tel-input .selected-flag:hover,
          .phone-input-container .react-tel-input .selected-flag:focus {
            background-color: hsl(var(--accent));
          }
          .phone-input-container .react-tel-input .country-list .dial-code {
            color: hsl(var(--muted-foreground));
          }
          .phone-input-container .react-tel-input .country-list .country-name {
            color: hsl(var(--foreground));
          }
          @media (max-width: 640px) {
            .phone-input-container .react-tel-input .country-list {
              width: 260px !important;
              left: 0 !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

InternationalPhoneInput.displayName = 'InternationalPhoneInput';
