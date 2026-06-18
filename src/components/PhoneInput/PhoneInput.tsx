import { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from './countries';
import styles from './PhoneInput.module.css';

const SORTED_BY_DIAL_LENGTH = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

function parsePhone(value: string): { country: Country; number: string } {
  const trimmed = value.trim();

  if (trimmed.startsWith('+')) {
    const match = SORTED_BY_DIAL_LENGTH.find((country) => trimmed.startsWith(country.dialCode));
    if (match) {
      return { country: match, number: trimmed.slice(match.dialCode.length).trim() };
    }
  }

  return { country: DEFAULT_COUNTRY, number: trimmed };
}

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  variant?: 'boxed' | 'underline';
  placeholder?: string;
  'aria-label'?: string;
};

export default function PhoneInput({
  value,
  onChange,
  name,
  required,
  variant = 'boxed',
  placeholder = '600 000 000',
  'aria-label': ariaLabel = 'Teléfono con prefijo de país',
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(() => parsePhone(value).country);
  const [number, setNumber] = useState<string>(() => parsePhone(value).number);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return COUNTRIES;
    }

    return COUNTRIES.filter(
      (item) => item.name.toLowerCase().includes(query) || item.dialCode.includes(query),
    );
  }, [search]);

  const emit = (nextCountry: Country, nextNumber: string) => {
    onChange(nextNumber ? `${nextCountry.dialCode} ${nextNumber}` : nextCountry.dialCode);
  };

  return (
    <div className={styles.root} data-variant={variant} ref={rootRef}>
      <button
        type="button"
        className={styles.countryButton}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Seleccionar prefijo de país"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className={styles.flag} aria-hidden="true">{country.flag}</span>
        <span className={styles.dialCode}>{country.dialCode}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <span className={styles.divider} />

      <input
        className={styles.numberField}
        type="tel"
        inputMode="tel"
        name={name}
        value={number}
        onChange={(event) => {
          const nextNumber = event.target.value;
          setNumber(nextNumber);
          emit(country, nextNumber);
        }}
        placeholder={placeholder}
        required={required}
        aria-label={ariaLabel}
      />

      {isOpen ? (
        <div className={styles.dropdown} role="listbox" aria-label="Lista de países">
          <input
            className={styles.search}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar país o prefijo..."
            autoFocus
          />
          <ul className={styles.list}>
            {filteredCountries.length === 0 ? (
              <li className={styles.empty}>Sin resultados</li>
            ) : (
              filteredCountries.map((item) => (
                <li key={item.iso}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.iso === country.iso}
                    className={`${styles.option} ${item.iso === country.iso ? styles.optionActive : ''}`}
                    onClick={() => {
                      setCountry(item);
                      setIsOpen(false);
                      setSearch('');
                      emit(item, number);
                    }}
                  >
                    <span className={styles.flag} aria-hidden="true">{item.flag}</span>
                    <span className={styles.countryName}>{item.name}</span>
                    <span className={styles.optionDialCode}>{item.dialCode}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
