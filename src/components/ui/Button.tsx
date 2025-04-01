import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  className?: string;
}

type LinkButtonProps = {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  external?: boolean;
};

const getVariantClasses = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
      return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
    case 'secondary':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500';
    case 'outline':
      return 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500';
    case 'ghost':
      return 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
    default:
      return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
  }
};

const getSizeClasses = (size: ButtonSize): string => {
  switch (size) {
    case 'sm':
      return 'py-1.5 px-3 text-sm';
    case 'md':
      return 'py-2 px-4 text-base';
    case 'lg':
      return 'py-3 px-6 text-lg';
    default:
      return 'py-2 px-4 text-base';
  }
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...rest
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  const disabledClasses = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !isLoading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export const LinkButton = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  external = false,
}: LinkButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </a>
    );
  }
  
  return (
    <Link
      href={href}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Link>
  );
};

export default Button; 