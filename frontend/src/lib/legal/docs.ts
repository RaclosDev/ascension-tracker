import type { LegalDoc } from './texts';

/** Legal pages, each served at /<doc>. Kept apart from the texts so the router stays light. */
export const LEGAL_DOCS: LegalDoc[] = ['privacidad', 'terminos', 'terminos-entrenadores'];
