import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { DayPicker, type ClassNames, type DateRange } from 'react-day-picker';
import { addDays, format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import styles from './BookingEngine.module.css';

const locations = ['Zaragoza', 'Tudela', 'Soria'];
const vehicleTypes = ['Cualquier tipo', 'Turismos', 'Furgonetas', '4×4', 'Autocaravanas'];

type SelectDropdown = 'location' | 'type' | null;

function getRangeLabel(range: DateRange | undefined) {
  if (range?.from && range?.to) {
    return `${format(range.from, 'dd MMM', { locale: es })} - ${format(range.to, 'dd MMM', { locale: es })}`;
  }

  if (range?.from) {
    return `${format(range.from, 'dd MMM', { locale: es })} - ...`;
  }

  return 'Selecciona fechas';
}

export default function BookingEngine() {
  const navigate = useNavigate();
  const today = startOfToday();
  const [location, setLocation] = useState('Zaragoza');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: today,
    to: addDays(today, 1),
  }));
  const [vehicleType, setVehicleType] = useState('Cualquier tipo');
  const [openDropdown, setOpenDropdown] = useState<SelectDropdown>(null);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const rangeLabel = useMemo(() => getRangeLabel(dateRange), [dateRange]);

  const dayPickerClassNames: Partial<ClassNames> = {
    root: styles.dayPicker,
    months: styles.rdpMonths,
    month: styles.rdpMonth,
    month_caption: styles.rdpMonthCaption,
    caption_label: styles.rdpCaptionLabel,
    nav: styles.rdpNav,
    button_previous: styles.rdpNavButton,
    button_next: styles.rdpNavButton,
    chevron: styles.rdpChevron,
    month_grid: styles.rdpMonthGrid,
    weekdays: styles.rdpWeekdays,
    weekday: styles.rdpWeekday,
    weeks: styles.rdpWeeks,
    week: styles.rdpWeek,
    day: styles.rdpDay,
    day_button: styles.rdpDayButton,
    disabled: styles.rdpDayDisabled,
    outside: styles.rdpDayOutside,
    today: styles.rdpDayToday,
    selected: styles.rdpDaySelected,
    range_start: styles.rdpRangeStart,
    range_middle: styles.rdpRangeMiddle,
    range_end: styles.rdpRangeEnd,
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (event.target.closest('[data-select-root]') || event.target.closest('[data-date-range-root]')) {
        return;
      }

      setOpenDropdown(null);
      setIsDatePopoverOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
        setIsDatePopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleSelectDropdown = (dropdown: NonNullable<SelectDropdown>) => {
    setIsDatePopoverOpen(false);
    setOpenDropdown((current) => (current === dropdown ? null : dropdown));
  };

  const toggleDatePopover = () => {
    setOpenDropdown(null);
    setIsDatePopoverOpen((current) => !current);
  };

  const handleDateRangeSelect = (nextRange: DateRange | undefined) => {
    setDateRange(nextRange);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate('/reserva', {
      state: {
        dateRange,
        location,
        vehicleType,
      },
    });
  };

  return (
    <form className={styles.engine} onSubmit={handleSearch} role="search" aria-label="Motor de búsqueda de vehículos">
      <div className={styles.fields}>
        {/* Location */}
        <div className={styles.field}>
          <label className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Recogida
          </label>

          <div className={styles.customSelect} data-select-root>
            <button
              type="button"
              className={styles.customSelectTrigger}
              aria-haspopup="listbox"
              aria-expanded={openDropdown === 'location'}
              aria-label="Seleccionar ciudad de recogida"
              onClick={() => toggleSelectDropdown('location')}
            >
              <span>{location}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${styles.selectChevron} ${openDropdown === 'location' ? styles.selectChevronOpen : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {openDropdown === 'location' ? (
              <ul className={styles.dropdownMenu} role="listbox" aria-label="Ciudades de recogida">
                {locations.map((city) => (
                  <li key={city}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={location === city}
                      className={`${styles.dropdownItem} ${location === city ? styles.dropdownItemActive : ''}`}
                      onClick={() => {
                        setLocation(city);
                        setOpenDropdown(null);
                      }}
                    >
                      {city}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Date Range */}
        <div className={styles.field}>
          <label className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Fechas
          </label>

          <div className={styles.dateRangeRoot} data-date-range-root>
            <button
              type="button"
              className={styles.dateRangeTrigger}
              aria-haspopup="dialog"
              aria-expanded={isDatePopoverOpen}
              aria-label="Seleccionar rango de fechas"
              onClick={toggleDatePopover}
            >
              <span className={styles.dateRangeLabel}>{rangeLabel}</span>
              <span className={styles.dateRangeIcons}>
                <svg className={styles.dateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <svg
                  className={`${styles.dateChevron} ${isDatePopoverOpen ? styles.dateChevronOpen : ''}`}
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
              </span>
            </button>

            {isDatePopoverOpen ? (
              <div className={styles.dateRangePopover} role="dialog" aria-label="Calendario de rango">
                <DayPicker
                  mode="range"
                  locale={es}
                  weekStartsOn={1}
                  numberOfMonths={1}
                  pagedNavigation
                  showOutsideDays
                  fixedWeeks
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  disabled={{ before: today }}
                  defaultMonth={dateRange?.from ?? today}
                  classNames={dayPickerClassNames}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Vehicle type */}
        <div className={styles.field}>
          <label className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Vehículo
          </label>

          <div className={styles.customSelect} data-select-root>
            <button
              type="button"
              className={styles.customSelectTrigger}
              aria-haspopup="listbox"
              aria-expanded={openDropdown === 'type'}
              aria-label="Seleccionar tipo de vehículo"
              onClick={() => toggleSelectDropdown('type')}
            >
              <span>{vehicleType}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${styles.selectChevron} ${openDropdown === 'type' ? styles.selectChevronOpen : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {openDropdown === 'type' ? (
              <ul className={styles.dropdownMenu} role="listbox" aria-label="Tipos de vehículo">
                {vehicleTypes.map((vehicleOption) => (
                  <li key={vehicleOption}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={vehicleType === vehicleOption}
                      className={`${styles.dropdownItem} ${vehicleType === vehicleOption ? styles.dropdownItemActive : ''}`}
                      onClick={() => {
                        setVehicleType(vehicleOption);
                        setOpenDropdown(null);
                      }}
                    >
                      {vehicleOption}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <button type="submit" className={styles.cta}>
        <span className={styles.ctaText}>Buscar</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </form>
  );
}
