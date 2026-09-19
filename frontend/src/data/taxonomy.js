export const CONTENT_MODES = [
  { id: 'all', label: 'All' },
  { id: 'fiction', label: 'Fiction' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'non-fiction', label: 'Non-fiction' },
];

export const FORMAT_TABS = [
  { id: 'all', label: 'All formats' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
  { id: 'book', label: 'Books' },
  { id: 'documentary', label: 'Docs' },
];

export const GENRES_BY_MODE = {
  fiction: [
    { id: 'literary', label: 'Literary' },
    { id: 'speculative', label: 'Speculative / Sci-Fi' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'mystery', label: 'Mystery' },
    { id: 'crime-noir', label: 'Crime / Noir' },
    { id: 'historical', label: 'Historical' },
    { id: 'romance', label: 'Romance' },
    { id: 'horror', label: 'Horror' },
    { id: 'magical-realism', label: 'Magical Realism' },
    { id: 'character-study', label: 'Character Study' },
  ],
  entertainment: [
    { id: 'action', label: 'Action' },
    { id: 'thriller', label: 'Thriller' },
    { id: 'comedy', label: 'Comedy' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'animation', label: 'Animation' },
    { id: 'sports', label: 'Sports' },
    { id: 'feel-good', label: 'Feel-good' },
    { id: 'prestige-drama', label: 'Prestige Drama' },
    { id: 'survival', label: 'Survival / Disaster' },
  ],
  'non-fiction': [
    { id: 'documentary', label: 'Documentary' },
    { id: 'biography', label: 'Biography / Memoir' },
    { id: 'history', label: 'History' },
    { id: 'science', label: 'Science' },
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'technology', label: 'Technology' },
    { id: 'nature', label: 'Nature' },
    { id: 'investigative', label: 'Investigative' },
    { id: 'self-improvement', label: 'Self-improvement' },
  ],
};

export const PACING_BANDS = [
  { id: 'glacial', label: 'Glacial / atmospheric', center: 0.12 },
  { id: 'slow-burn', label: 'Slow-burn', center: 0.28 },
  { id: 'measured', label: 'Measured / literary', center: 0.42 },
  { id: 'balanced', label: 'Balanced', center: 0.5 },
  { id: 'plot-forward', label: 'Plot-forward', center: 0.72 },
  { id: 'kinetic', label: 'Kinetic / high-octane', center: 0.9 },
];

export const STYLE_AXES = [
  {
    key: 'romance',
    label: 'Romance Arc',
    options: [
      { id: 'any', label: "Doesn't matter" },
      { id: 'slow-burn', label: 'Slow-burn & atmospheric' },
      { id: 'fast-paced', label: 'Fast-paced & urgent' },
    ],
  },
  {
    key: 'action',
    label: 'Conflict & Action',
    options: [
      { id: 'any', label: "Doesn't matter" },
      { id: 'raw/gritty', label: 'Raw & gritty' },
      { id: 'choreographed', label: 'Choreographed & stylized' },
    ],
  },
  {
    key: 'protagonists',
    label: 'Protagonist Morality',
    options: [
      { id: 'any', label: "Doesn't matter" },
      { id: 'morally-gray', label: 'Morally gray & complex' },
      { id: 'clear-cut', label: 'Clear-cut & idealistic' },
    ],
  },
  {
    key: 'tone',
    label: 'Intellectual & Emotional Depth',
    options: [
      { id: 'any', label: "Doesn't matter" },
      { id: 'challenging', label: 'Challenging & layered' },
      { id: 'comfort', label: 'Comforting & restorative' },
    ],
  },
];

export const SESSION_CONTEXTS = [
  { id: 'binge', label: 'Binge (whole weekend)', hint: 'High-density multi-episode arcs' },
  { id: 'casual', label: 'Ongoing daily', hint: 'One episode or chapter at a time' },
  { id: 'one-off', label: 'One-off feature', hint: 'Self-contained evening experience' },
  { id: 'background', label: 'Contemplative background', hint: 'Ambient, low-attention viewing' },
];

export const CONTENT_INTENTS = [
  { id: 'self-improvement', label: 'Self-improvement & mastery', hint: 'Habits, psychology, personal change' },
  { id: 'deep-learning', label: 'Intellectual deep dive', hint: 'Science, history, philosophy, systems' },
  { id: 'documentary', label: 'Documentaries & real-world', hint: 'Investigative and observational non-fiction' },
];

const TAG_ALIASES = {
  'sci-fi': 'speculative',
  scifi: 'speculative',
  'science-fiction': 'speculative',
  'speculative-fiction': 'speculative',
  'hard-sci-fi': 'speculative',
  cyberpunk: 'speculative',
  dystopia: 'speculative',
  dystopian: 'speculative',
  'kinetic-action': 'action',
  'high-octane': 'action',
  'raw/gritty': 'action',
  noir: 'crime-noir',
  crime: 'crime-noir',
  'morally-gray': 'crime-noir',
  'slice-of-life': 'character-study',
  introspective: 'character-study',
  'slow-burn': 'literary',
  atmospheric: 'literary',
  memoir: 'biography',
  'non-fiction': 'biography',
  docuseries: 'documentary',
  productivity: 'self-improvement',
};

const ALL_GENRE_IDS = new Set(
  Object.values(GENRES_BY_MODE).flatMap((list) => list.map((g) => g.id))
);
const FICTION_IDS = new Set(GENRES_BY_MODE.fiction.map((g) => g.id));
const ENTERTAINMENT_IDS = new Set(GENRES_BY_MODE.entertainment.map((g) => g.id));
const NONFICTION_IDS = new Set(GENRES_BY_MODE['non-fiction'].map((g) => g.id));
const NONFICTION_HINTS = new Set([
  'documentary', 'docuseries', 'non-fiction', 'nonfiction', 'self-improvement',
  'biography', 'memoir', 'history', 'science', 'philosophy', 'psychology',
  'productivity', 'investigative', 'nature', 'technology',
]);

export const canonicalizeTag = (tag) => {
  const raw = String(tag || '').trim().toLowerCase();
  if (!raw) return null;
  if (ALL_GENRE_IDS.has(raw)) return raw;
  if (TAG_ALIASES[raw]) return TAG_ALIASES[raw];
  const compact = raw.replace(/[_\s]/g, '-');
  if (ALL_GENRE_IDS.has(compact)) return compact;
  if (TAG_ALIASES[compact]) return TAG_ALIASES[compact];
  return null;
};

export const canonicalGenresForItem = (item = {}) => {
  const found = [];
  const seen = new Set();
  const sources = [...(item.themes || []), ...(item.sub_genres || [])];
  const category = item.raw_metadata?.category;
  if (category) sources.push(category);
  sources.forEach((tag) => {
    const canon = canonicalizeTag(tag);
    if (canon && !seen.has(canon)) {
      seen.add(canon);
      found.push(canon);
    }
  });
  return found;
};

export const classifyContentModes = (item = {}) => {
  const mtype = String(item.media_type || '').toLowerCase();
  const tags = new Set(
    [...(item.themes || []), ...(item.sub_genres || [])].map((t) => String(t).toLowerCase())
  );
  const genres = new Set(canonicalGenresForItem(item));
  const category = String(item.raw_metadata?.category || '').toLowerCase();
  const modes = new Set();

  const isNonfiction =
    mtype === 'documentary' ||
    ['documentary', 'self-improvement', 'deep-learning', 'non-fiction'].includes(category) ||
    [...tags].some((t) => NONFICTION_HINTS.has(t)) ||
    [...genres].some((g) => NONFICTION_IDS.has(g));

  if (isNonfiction) modes.add('non-fiction');

  const fictionHit = [...genres].some((g) => FICTION_IDS.has(g));
  const entertainmentHit = [...genres].some((g) => ENTERTAINMENT_IDS.has(g));

  if (mtype === 'book' && !isNonfiction) {
    modes.add('fiction');
    if (entertainmentHit) modes.add('entertainment');
  } else if (mtype === 'movie' || mtype === 'tv') {
    if (entertainmentHit || !fictionHit) modes.add('entertainment');
    if (fictionHit || !entertainmentHit) modes.add('fiction');
    if (modes.size === 0) {
      modes.add('fiction');
      modes.add('entertainment');
    }
  } else if (!isNonfiction) {
    if (fictionHit) modes.add('fiction');
    if (entertainmentHit) modes.add('entertainment');
    if (modes.size === 0) modes.add('fiction');
  }

  return ['fiction', 'entertainment', 'non-fiction'].filter((m) => modes.has(m));
};

export const itemMatchesMode = (item, mode) => {
  if (!mode || mode === 'all') return true;
  return classifyContentModes(item).includes(mode);
};

export const genresForMode = (mode) => {
  if (!mode || mode === 'all') {
    return [
      ...GENRES_BY_MODE.fiction,
      ...GENRES_BY_MODE.entertainment,
      ...GENRES_BY_MODE['non-fiction'],
    ];
  }
  return GENRES_BY_MODE[mode] || GENRES_BY_MODE.fiction;
};

export const bandsToPacingValue = (bands, fallback = 0.5) => {
  const centers = (bands || [])
    .map((id) => PACING_BANDS.find((b) => b.id === id)?.center)
    .filter((n) => typeof n === 'number');
  if (!centers.length) return fallback;
  return centers.reduce((a, b) => a + b, 0) / centers.length;
};

export const splitLegacyContext = (contexts = []) => {
  const sessionIds = new Set(SESSION_CONTEXTS.map((c) => c.id));
  const intentIds = new Set(CONTENT_INTENTS.map((c) => c.id));
  const session = [];
  const intent = [];
  contexts.forEach((ctx) => {
    if (sessionIds.has(ctx)) session.push(ctx);
    else if (intentIds.has(ctx)) intent.push(ctx);
  });
  return { session, intent };
};

export const defaultStyleAxes = {
  romance: 'any',
  action: 'any',
  protagonists: 'any',
  tone: 'any',
};

export const MODE_SHELF_TITLES = {
  all: 'Cross-mode picks from your taste priors',
  fiction: 'Narrative fiction — invented worlds and character arcs',
  entertainment: 'Watch-first entertainment — plot, spectacle, comfort',
  'non-fiction': 'Real-world non-fiction — docs, essays, and learning',
};
