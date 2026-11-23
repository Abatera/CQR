/**
 * Shared logic for the editor forms: validation (the same schema the build uses),
 * saving and deleting through the dev server, and tracking unsaved changes.
 */
import { SCHEMAS, type Collection } from '../lib/schema';
import { zodIssues, type Issue } from '../lib/validate';
import { app } from '../state/app.svelte';
import { deleteItem, saveItem } from './api';

export class FormRunner<M> {
  model = $state() as M;
  attempted = $state(false);
  serverErrors = $state<Issue[]>([]);
  busy = $state(false);
  message = $state('');
  readonly collection: Collection;
  readonly isNew: boolean;
  private readonly toData: (m: M) => unknown;
  private snapshot = $state('');

  constructor(collection: Collection, initial: M, toData: (m: M) => unknown, isNew: boolean) {
    this.collection = collection;
    this.isNew = isNew;
    this.toData = toData;
    this.model = initial;
    this.snapshot = JSON.stringify(toData(initial));
  }

  data = $derived.by(() => this.toData(this.model));

  clientErrors = $derived.by((): Issue[] => {
    const res = SCHEMAS[this.collection].safeParse(this.data);
    if (res.success) return [];
    const id = (this.data as { id?: string } | undefined)?.id;
    return zodIssues(res.error, this.collection, '', id);
  });

  /** Errors to show: the form's own checks once a save has been attempted, plus the server's. */
  errors = $derived.by((): Issue[] => (this.attempted ? [...this.clientErrors, ...this.serverErrors] : this.serverErrors));

  dirty = $derived(JSON.stringify(this.data) !== this.snapshot);

  /** Saves; returns the saved ID, or null if there were errors. */
  async save(): Promise<string | null> {
    this.attempted = true;
    this.serverErrors = [];
    this.message = '';
    if (this.clientErrors.length) {
      this.message = 'Please fix the problems marked below.';
      return null;
    }
    this.busy = true;
    const res = await saveItem(this.collection, this.data, this.isNew);
    this.busy = false;
    if (!res.ok) {
      this.serverErrors = res.errors;
      this.message = res.message ?? 'The change was not saved, because it would introduce the problems listed below.';
      return null;
    }
    app.setContent(res.content);
    this.snapshot = JSON.stringify(this.data);
    this.message = `Saved to ${res.file}.`;
    return (this.data as { id: string }).id;
  }

  async remove(id: string, what: string): Promise<boolean> {
    if (!confirm(`Delete ${what} "${id}"? This changes the files in content/. You can restore it with git.`)) return false;
    this.busy = true;
    const res = await deleteItem(this.collection, id);
    this.busy = false;
    if (!res.ok) {
      this.serverErrors = res.errors;
      this.message = res.message ?? 'Could not delete.';
      return false;
    }
    app.setContent(res.content);
    this.snapshot = JSON.stringify(this.data);
    return true;
  }
}
