export function getSmartFallbackQueries(originalQuery: string): string[] {
  const queries: string[] = [];
  const q = originalQuery.trim().toLowerCase();

  // Base query first
  queries.push(q);

  const fillers = ['high', 'protein', 'sabor', 'flavor', 'flavour', 'zero', 'sin', 'con'];
  const words = q.split(/\s+/).filter((w) => !fillers.includes(w));

  if (words.length > 0 && words.join(' ') !== q) {
    queries.push(words.join(' '));
  }

  // Try Spanish/English synonyms for common problematic searches
  const synonyms: Record<string, string> = {
    natillas: 'pudding',
    pudding: 'natillas',
  };

  const synonymWords = words.map((w) => synonyms[w] || w);
  if (synonymWords.join(' ') !== words.join(' ')) {
    queries.push(synonymWords.join(' '));
  }

  return [...new Set(queries)];
}

export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
