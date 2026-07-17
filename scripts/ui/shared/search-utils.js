export const MIN_SEARCH_LENGTH = 3;
export const SEARCH_DEBOUNCE_MS = 250;
export const SEARCH_RESULT_LIMIT = 200;

const searchTimers = new WeakMap();
const appliedSearchQueries = new WeakMap();

export function normalizeSearchQuery(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

export function getActiveSearchQuery(value, minLength = MIN_SEARCH_LENGTH) {
  const query = normalizeSearchQuery(value);
  return query.length >= minLength ? query : '';
}

export function scheduleSearch(input, callback, delay = SEARCH_DEBOUNCE_MS) {
  const previous = searchTimers.get(input);
  if (previous) clearTimeout(previous);

  const timer = setTimeout(() => {
    searchTimers.delete(input);
    const query = getActiveSearchQuery(input?.value);
    const previousQuery = appliedSearchQueries.has(input)
      ? appliedSearchQueries.get(input)
      : getActiveSearchQuery(input?.defaultValue);
    if (query === previousQuery) return;
    appliedSearchQueries.set(input, query);
    callback(query);
  }, delay);
  searchTimers.set(input, timer);
}

export function limitSearchResults(items, limit = SEARCH_RESULT_LIMIT) {
  const capped = items.length > limit;
  return {
    capped,
    items: capped ? items.slice(0, limit) : items,
  };
}
