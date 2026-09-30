import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  icon?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  title?: string;
};

export function Button({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false, loading = false, title }: ButtonProps) {
  return <button type={type} onClick={onClick} className={`button button-${variant} ${loading ? 'button-loading' : ''}`} disabled={disabled || loading} title={title}>{loading && <span className="button-spinner" aria-hidden="true" />}{!loading && icon}{children}</button>;
}
