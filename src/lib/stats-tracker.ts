// Chess Statistics Tracking Utility

export interface StatsData {
  openings: {
    [key: string]: {
      attempts: number;
      correct: number;
      lastPracticed: string;
    };
  };
  lines: {
    [key: string]: {
      attempts: number;
      correct: number;
      lastPracticed: string;
    };
  };
  hasUploadedFile: boolean;
}

const STORAGE_KEY = 'chessStats';

// Initialize or get existing stats
export const getStats = (): StatsData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }

  return {
    openings: {},
    lines: {},
    hasUploadedFile: false
  };
};

// Save stats to localStorage
export const saveStats = (stats: StatsData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

// Build a stable, unique, human-readable key for a game.
// Uses white (opening name) + the game's index position in the PGN file
// so two openings with the same name never collide, and
// retrying the same opening always accumulates on the same key.
export const buildGameKey = (
  white: string | undefined,
  event: string | undefined,
  gameIndex: number
): string => {
  const title = (white && white !== 'Unknown' ? white : null)
    ?? (event && event !== 'Unknown Event' ? event : null)
    ?? `Game ${gameIndex + 1}`;
  return `${title} (Game ${gameIndex + 1})`;
};

// Record an opening attempt (game-level: one attempt = one game session)
export const recordOpeningAttempt = (
  openingName: string,
  wasCorrect: boolean
): void => {
  const stats = getStats();

  if (!stats.openings[openingName]) {
    stats.openings[openingName] = {
      attempts: 0,
      correct: 0,
      lastPracticed: new Date().toISOString()
    };
  }

  stats.openings[openingName].attempts += 1;
  if (wasCorrect) {
    stats.openings[openingName].correct += 1;
  }
  stats.openings[openingName].lastPracticed = new Date().toISOString();

  saveStats(stats);
};

// Record a line attempt (game-level: one attempt = one game session)
export const recordLineAttempt = (
  lineName: string,
  wasCorrect: boolean
): void => {
  const stats = getStats();

  if (!stats.lines[lineName]) {
    stats.lines[lineName] = {
      attempts: 0,
      correct: 0,
      lastPracticed: new Date().toISOString()
    };
  }

  stats.lines[lineName].attempts += 1;
  if (wasCorrect) {
    stats.lines[lineName].correct += 1;
  }
  stats.lines[lineName].lastPracticed = new Date().toISOString();

  saveStats(stats);
};

// Mark that a file has been uploaded
export const setFileUploaded = (uploaded: boolean = true): void => {
  const stats = getStats();
  stats.hasUploadedFile = uploaded;
  saveStats(stats);
};

// Get accuracy for a specific opening
export const getOpeningAccuracy = (openingName: string): number => {
  const stats = getStats();
  const opening = stats.openings[openingName];

  if (!opening || opening.attempts === 0) return 0;
  return Math.round((opening.correct / opening.attempts) * 100);
};

// Get accuracy for a specific line
export const getLineAccuracy = (lineName: string): number => {
  const stats = getStats();
  const line = stats.lines[lineName];

  if (!line || line.attempts === 0) return 0;
  return Math.round((line.correct / line.attempts) * 100);
};

// Get overall statistics
export const getOverallStats = () => {
  const stats = getStats();

  const openingsData = Object.values(stats.openings);
  const linesData = Object.values(stats.lines);

  const totalOpeningAttempts = openingsData.reduce((sum, o) => sum + o.attempts, 0);
  const totalOpeningCorrect = openingsData.reduce((sum, o) => sum + o.correct, 0);
  const totalLineAttempts = linesData.reduce((sum, l) => sum + l.attempts, 0);
  const totalLineCorrect = linesData.reduce((sum, l) => sum + l.correct, 0);

  return {
    openings: {
      count: Object.keys(stats.openings).length,
      totalAttempts: totalOpeningAttempts,
      totalCorrect: totalOpeningCorrect,
      accuracy: totalOpeningAttempts > 0
        ? Math.round((totalOpeningCorrect / totalOpeningAttempts) * 100)
        : 0
    },
    lines: {
      count: Object.keys(stats.lines).length,
      totalAttempts: totalLineAttempts,
      totalCorrect: totalLineCorrect,
      accuracy: totalLineAttempts > 0
        ? Math.round((totalLineCorrect / totalLineAttempts) * 100)
        : 0
    }
  };
};

// Reset all stats
export const resetStats = (): void => {
  const stats: StatsData = {
    openings: {},
    lines: {},
    hasUploadedFile: false
  };
  saveStats(stats);
};

// Reset stats for a specific category
export const resetCategoryStats = (category: 'openings' | 'lines'): void => {
  const stats = getStats();
  stats[category] = {};
  saveStats(stats);
};