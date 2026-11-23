import { getContext, setContext } from 'svelte';
import type { Issue } from '../lib/validate';

const KEY = Symbol('form-errors');

/** Makes a form's current errors available to its field components. */
export function provideErrors(get: () => Issue[]) {
  setContext(KEY, get);
}

export function useErrors(): () => Issue[] {
  return getContext<() => Issue[]>(KEY) ?? (() => []);
}

/** Whether an issue at `issuePath` belongs to the field at `path` (or inside it). */
export function under(issuePath: string | undefined, path: string, exact = false): boolean {
  if (!issuePath) return false;
  if (issuePath === path) return true;
  return !exact && (issuePath.startsWith(path + '.') || issuePath.startsWith(path + '['));
}
