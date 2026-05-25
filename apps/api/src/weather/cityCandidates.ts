const LOCATION_PATTERN =
  /\b(?:in|near|to|from|at|for)\s+((?!a\b|an\b|the\b|go\b|travel\b|whole\b)[a-zA-Z][a-zA-Z'-]*(?:\s+(?!and\b|then\b|before\b|after\b|today\b|tomorrow\b|next\b|week\b|to\b|from\b|in\b|at\b|near\b|for\b|a\b|an\b|the\b|go\b|travel\b|whole\b)[a-zA-Z][a-zA-Z'-]*){0,2})\b/i;

export const extractCityCandidates = (text: string): string[] => {
  const match = LOCATION_PATTERN.exec(text);

  if (!match?.[1]) {
    return [];
  }

  return [match[1].trim()];
};
