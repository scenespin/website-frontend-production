export interface GenreOption {
  value: string;
  label: string;
}

export const GENRE_OPTIONS: GenreOption[] = [
  { value: 'action', label: 'Action' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'animation', label: 'Animation' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'crime', label: 'Crime' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'drama', label: 'Drama' },
  { value: 'family', label: 'Family' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'historical', label: 'Historical' },
  { value: 'horror', label: 'Horror' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'musical', label: 'Musical' },
  { value: 'romance', label: 'Romance' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'war', label: 'War' },
  { value: 'western', label: 'Western' },
  { value: 'biography', label: 'Biography' },
  { value: 'other', label: 'Other' },
];

const GENRE_VALUES = new Set(GENRE_OPTIONS.map((option) => option.value));
const GENRE_ALIASES: Record<string, string> = {
  scifi: 'sci-fi',
  'science-fiction': 'sci-fi',
  sciencefiction: 'sci-fi',
  biopic: 'biography',
  doc: 'documentary',
  romcom: 'romance',
  'rom-com': 'romance',
};

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, '-')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeGenreValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;

  const token = normalizeToken(value);
  if (!token) return null;

  const canonical = GENRE_ALIASES[token] || token;
  return GENRE_VALUES.has(canonical) ? canonical : null;
}

export function isValidGenreValue(value: unknown): boolean {
  return normalizeGenreValue(value) !== null;
}
