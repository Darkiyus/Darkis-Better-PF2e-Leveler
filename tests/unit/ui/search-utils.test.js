import {
  getActiveSearchQuery,
  limitSearchResults,
  normalizeSearchQuery,
  scheduleSearch,
} from '../../../scripts/ui/shared/search-utils.js';

describe('search utilities', () => {
  test('normalizes whitespace and case', () => {
    expect(normalizeSearchQuery('  Rapier  ')).toBe('rapier');
  });

  test('does not activate a search before three characters', () => {
    expect(getActiveSearchQuery('')).toBe('');
    expect(getActiveSearchQuery('r')).toBe('');
    expect(getActiveSearchQuery('ra')).toBe('');
    expect(getActiveSearchQuery('rap')).toBe('rap');
  });

  test('debounces repeated searches for the same input', () => {
    jest.useFakeTimers();
    const input = document.createElement('input');
    input.value = 'rap';
    const callback = jest.fn();

    scheduleSearch(input, callback);
    scheduleSearch(input, callback);
    jest.advanceTimersByTime(249);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('does not run DOM searches until the effective query changes', () => {
    jest.useFakeTimers();
    const input = document.createElement('input');
    const callback = jest.fn();

    input.value = 'r';
    scheduleSearch(input, callback);
    jest.advanceTimersByTime(250);
    input.value = 'ra';
    scheduleSearch(input, callback);
    jest.advanceTimersByTime(250);
    expect(callback).not.toHaveBeenCalled();

    input.value = 'rap';
    scheduleSearch(input, callback);
    jest.advanceTimersByTime(250);
    expect(callback).toHaveBeenLastCalledWith('rap');

    input.value = 'ra';
    scheduleSearch(input, callback);
    jest.advanceTimersByTime(250);
    expect(callback).toHaveBeenLastCalledWith('');
    expect(callback).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test('clears a search that was already active in the rendered input', () => {
    jest.useFakeTimers();
    const input = document.createElement('input');
    input.defaultValue = 'rapier';
    input.value = 'ra';
    const callback = jest.fn();

    scheduleSearch(input, callback);
    jest.advanceTimersByTime(250);

    expect(callback).toHaveBeenCalledWith('');
    jest.useRealTimers();
  });

  test('caps rendered results without changing the source array', () => {
    const source = Array.from({ length: 250 }, (_, index) => index);
    const result = limitSearchResults(source);

    expect(result.capped).toBe(true);
    expect(result.items).toHaveLength(200);
    expect(source).toHaveLength(250);
  });
});
