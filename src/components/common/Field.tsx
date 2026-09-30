import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type FieldProps = {
  icon: ReactNode;
  placeholder: string;
  type?: string;
  trailing?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  /** Renseigne l'attribut `autocomplete` de l'input. */
  autoComplete?: string;
  /**
   * Empêche le navigateur d'écrire tout seul un identifiant/mot de passe
   * enregistré : le champ reste en lecture seule jusqu'au premier focus,
   * et le navigateur ignore les champs non modifiables lors de l'autofill.
   */
  preventAutofill?: boolean;
  inputMode?: 'text' | 'numeric' | 'email' | 'decimal';
  maxLength?: number;
};

export function Field({
  icon,
  placeholder,
  type = 'text',
  trailing,
  value,
  onChange,
  autoComplete,
  preventAutofill = false,
  inputMode,
  maxLength,
}: FieldProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <label className="field">
      <span>{icon}</span>
      <input
        placeholder={placeholder}
        type={inputType}
        required
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        readOnly={preventAutofill && !unlocked}
        onFocus={() => setUnlocked(true)}
        onChange={event => onChange?.(event.target.value)}
      />
      {isPassword ? (
        <button
          type="button"
          className="icon-button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      ) : trailing}
    </label>
  );
}
