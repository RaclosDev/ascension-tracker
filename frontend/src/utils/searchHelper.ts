export function getSmartFallbackQueries(originalQuery) {
  const queries = [];
  let q = originalQuery.trim().toLowerCase();
  
  // Base query first
  queries.push(q);
  
  // Remove filler words
  const fillers = ['high', 'protein', 'sabor', 'flavor', 'flavour', 'zero', 'sin', 'con'];
  const words = q.split(/\s+/).filter(w => !fillers.includes(w));
  
  if (words.length > 0 && words.join(' ') !== q) {
    queries.push(words.join(' '));
  }
  
  // Try Spanish/English synonyms for common problematic searches
  const synonyms = {
    'natillas': 'pudding',
    'pudding': 'natillas'
  };
  
  const synonymWords = words.map(w => synonyms[w] || w);
  if (synonymWords.join(' ') !== words.join(' ')) {
    queries.push(synonymWords.join(' '));
  }

  // Deduplicate
  return [...new Set(queries)];
}

function normalizeText(text) {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getWordVariants(word) {
  if (!word) return [];
  const variants = [word];
  
  // Remove simple plurals
  if (word.endsWith('s') && word.length > 3) {
    variants.push(word.slice(0, -1));
  }
  if (word.endsWith('es') && word.length > 4) {
    variants.push(word.slice(0, -2));
  }
  
  // Example synonyms for word level
  const synonyms = {
    'natillas': 'pudding',
    'pudding': 'natillas'
  };
  
  if (synonyms[word]) {
    variants.push(synonyms[word]);
  }
  
  return [...new Set(variants)];
}
