export type Country = {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
};

function isoToFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const RAW_COUNTRIES: { iso: string; name: string; dialCode: string }[] = [
  { iso: 'ES', name: 'España', dialCode: '+34' },
  { iso: 'FR', name: 'Francia', dialCode: '+33' },
  { iso: 'PT', name: 'Portugal', dialCode: '+351' },
  { iso: 'AD', name: 'Andorra', dialCode: '+376' },
  { iso: 'DE', name: 'Alemania', dialCode: '+49' },
  { iso: 'IT', name: 'Italia', dialCode: '+39' },
  { iso: 'GB', name: 'Reino Unido', dialCode: '+44' },
  { iso: 'IE', name: 'Irlanda', dialCode: '+353' },
  { iso: 'NL', name: 'Países Bajos', dialCode: '+31' },
  { iso: 'BE', name: 'Bélgica', dialCode: '+32' },
  { iso: 'LU', name: 'Luxemburgo', dialCode: '+352' },
  { iso: 'CH', name: 'Suiza', dialCode: '+41' },
  { iso: 'AT', name: 'Austria', dialCode: '+43' },
  { iso: 'PL', name: 'Polonia', dialCode: '+48' },
  { iso: 'CZ', name: 'República Checa', dialCode: '+420' },
  { iso: 'SK', name: 'Eslovaquia', dialCode: '+421' },
  { iso: 'HU', name: 'Hungría', dialCode: '+36' },
  { iso: 'RO', name: 'Rumanía', dialCode: '+40' },
  { iso: 'BG', name: 'Bulgaria', dialCode: '+359' },
  { iso: 'GR', name: 'Grecia', dialCode: '+30' },
  { iso: 'SE', name: 'Suecia', dialCode: '+46' },
  { iso: 'NO', name: 'Noruega', dialCode: '+47' },
  { iso: 'DK', name: 'Dinamarca', dialCode: '+45' },
  { iso: 'FI', name: 'Finlandia', dialCode: '+358' },
  { iso: 'IS', name: 'Islandia', dialCode: '+354' },
  { iso: 'EE', name: 'Estonia', dialCode: '+372' },
  { iso: 'LV', name: 'Letonia', dialCode: '+371' },
  { iso: 'LT', name: 'Lituania', dialCode: '+370' },
  { iso: 'HR', name: 'Croacia', dialCode: '+385' },
  { iso: 'SI', name: 'Eslovenia', dialCode: '+386' },
  { iso: 'RS', name: 'Serbia', dialCode: '+381' },
  { iso: 'UA', name: 'Ucrania', dialCode: '+380' },
  { iso: 'RU', name: 'Rusia', dialCode: '+7' },
  { iso: 'TR', name: 'Turquía', dialCode: '+90' },
  { iso: 'MA', name: 'Marruecos', dialCode: '+212' },
  { iso: 'DZ', name: 'Argelia', dialCode: '+213' },
  { iso: 'TN', name: 'Túnez', dialCode: '+216' },
  { iso: 'EG', name: 'Egipto', dialCode: '+20' },
  { iso: 'ZA', name: 'Sudáfrica', dialCode: '+27' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234' },
  { iso: 'SN', name: 'Senegal', dialCode: '+221' },
  { iso: 'US', name: 'Estados Unidos', dialCode: '+1' },
  { iso: 'CA', name: 'Canadá', dialCode: '+1' },
  { iso: 'MX', name: 'México', dialCode: '+52' },
  { iso: 'GT', name: 'Guatemala', dialCode: '+502' },
  { iso: 'CU', name: 'Cuba', dialCode: '+53' },
  { iso: 'DO', name: 'República Dominicana', dialCode: '+1' },
  { iso: 'CO', name: 'Colombia', dialCode: '+57' },
  { iso: 'VE', name: 'Venezuela', dialCode: '+58' },
  { iso: 'EC', name: 'Ecuador', dialCode: '+593' },
  { iso: 'PE', name: 'Perú', dialCode: '+51' },
  { iso: 'BO', name: 'Bolivia', dialCode: '+591' },
  { iso: 'PY', name: 'Paraguay', dialCode: '+595' },
  { iso: 'UY', name: 'Uruguay', dialCode: '+598' },
  { iso: 'CL', name: 'Chile', dialCode: '+56' },
  { iso: 'AR', name: 'Argentina', dialCode: '+54' },
  { iso: 'BR', name: 'Brasil', dialCode: '+55' },
  { iso: 'CN', name: 'China', dialCode: '+86' },
  { iso: 'JP', name: 'Japón', dialCode: '+81' },
  { iso: 'KR', name: 'Corea del Sur', dialCode: '+82' },
  { iso: 'IN', name: 'India', dialCode: '+91' },
  { iso: 'PK', name: 'Pakistán', dialCode: '+92' },
  { iso: 'ID', name: 'Indonesia', dialCode: '+62' },
  { iso: 'PH', name: 'Filipinas', dialCode: '+63' },
  { iso: 'VN', name: 'Vietnam', dialCode: '+84' },
  { iso: 'TH', name: 'Tailandia', dialCode: '+66' },
  { iso: 'AE', name: 'Emiratos Árabes Unidos', dialCode: '+971' },
  { iso: 'SA', name: 'Arabia Saudí', dialCode: '+966' },
  { iso: 'QA', name: 'Catar', dialCode: '+974' },
  { iso: 'IL', name: 'Israel', dialCode: '+972' },
  { iso: 'AU', name: 'Australia', dialCode: '+61' },
  { iso: 'NZ', name: 'Nueva Zelanda', dialCode: '+64' },
];

export const COUNTRIES: Country[] = RAW_COUNTRIES.map((country) => ({
  ...country,
  flag: isoToFlag(country.iso),
} as Country));

export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

export { isoToFlag };
