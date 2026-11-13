export type StarKey = 5 | 4 | 3 | 2 | 1;
export type RatingDistribution = Record<StarKey, number>;

const STAR_KEYS: StarKey[] = [5, 4, 3, 2, 1];

/**
 * Computes integer percentages for 5..1 star buckets using the largest-remainder
 * (Hamilton) method so the rounded percentages always sum to exactly 100.
 */
export function calculateRatingPercentages(
  distribution: RatingDistribution,
): RatingDistribution {
  const total = STAR_KEYS.reduce((sum, star) => sum + Math.max(0, distribution[star] || 0), 0);

  if (total <= 0) {
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }

  const entries = STAR_KEYS.map((star) => {
    const exact = (Math.max(0, distribution[star] || 0) / total) * 100;
    const floored = Math.floor(exact);
    return {
      star,
      floored,
      remainder: exact - floored,
    };
  });

  let remaining = 100 - entries.reduce((sum, entry) => sum + entry.floored, 0);

  const byRemainder = [...entries].sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    return b.star - a.star;
  });

  const result: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const entry of entries) {
    result[entry.star] = entry.floored;
  }

  for (let i = 0; i < remaining && i < byRemainder.length; i++) {
    result[byRemainder[i].star] += 1;
  }

  return result;
}
