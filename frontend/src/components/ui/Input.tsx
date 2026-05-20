import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconPosition = 'left', className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const baseClasses = 'input-field';
    const errorClasses = error ? 'input-field-error' : '';
    const iconClasses = icon
      ? iconPosition === 'left'
        ? 'pl-11'
        : 'pr-11'
      : '';

    return (
      <div className="w-full">
        {label && <label className="input-label">{label}</label>}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`${baseClasses} ${errorClasses} ${iconClasses} ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="input-error">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;