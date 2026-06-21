// Lightweight client for the public, unauthenticated chess.com API.
// Docs: https://www.chess.com/news/view/published-data-api
// No login/OAuth is required (or available) for this data — a public
// username is enough, same as visiting chess.com/member/<username>.

export interface OpeningStat {
  move: string; // the player's first move, e.g. "e4" or, as Black, "d5"
  color: 'white' | 'black';
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface ChessComSummary {
  username: string;
  totalGames: number;
  monthsScanned: number;
  gamesAsWhite: number;
  gamesAsBlack: number;
  openingsWhite: OpeningStat[];
  openingsBlack: OpeningStat[];
}

const MAX_MONTHS = 12; // most recent N months of archives, to keep this fast

const WIN_RESULTS = new Set(['win']);
const DRAW_RESULTS = new Set([
  'agreed',
  'repetition',
  'stalemate',
  'insufficient',
  '50move',
  'timevsinsufficient',
]);

function classifyResult(result: string | undefined): 'win' | 'loss' | 'draw' {
  if (!result) return 'loss';
  if (WIN_RESULTS.has(result)) return 'win';
  if (DRAW_RESULTS.has(result)) return 'draw';
  return 'loss';
}

function normalizeMove(move: string): string {
  return move.replace(/[+#!?]+$/g, '');
}

// Pull the player's first move out of a PGN string.
// isWhite=true -> the very first move of the game.
// isWhite=false -> Black's reply (the second SAN token).
function extractOpeningMove(pgn: string, isWhite: boolean): string | null {
  if (!pgn) return null;

  const headerEnd = pgn.lastIndexOf(']');
  const movetext = headerEnd >= 0 ? pgn.slice(headerEnd + 1) : pgn;

  const cleaned = movetext
    .replace(/\{[^}]*\}/g, '') // strip {clock/eval} annotations
    .replace(/\$\d+/g, '');    // strip NAG codes

  const tokens = cleaned.trim().split(/\s+/).filter(Boolean);
  const sanMoves: string[] = [];

  for (const token of tokens) {
    if (/^\d+\.+$/.test(token)) continue; // move numbers like "1." or "1..."
    if (token === '*' || token === '1-0' || token === '0-1' || token === '1/2-1/2') continue;
    sanMoves.push(token);
  }

  const move = isWhite ? sanMoves[0] : sanMoves[1];
  return move ? normalizeMove(move) : null;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`chess.com request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchChessComOpeningStats(rawUsername: string): Promise<ChessComSummary> {
  const username = rawUsername.trim();
  if (!username) throw new Error('Enter a chess.com username.');
  const uname = username.toLowerCase();

  const archivesData = await fetchJson(`https://api.chess.com/pub/player/${uname}/games/archives`);
  if (!archivesData) {
    throw new Error(`No chess.com account found for "${username}".`);
  }

  const archiveUrls: string[] = archivesData.archives || [];
  if (archiveUrls.length === 0) {
    throw new Error(`${username} doesn't have any games on record yet.`);
  }

  const recentArchives = archiveUrls.slice(-MAX_MONTHS);

  const archiveResults = await Promise.all(
    recentArchives.map((url) => fetchJson(url).catch(() => null))
  );

  const openingMapWhite = new Map<string, OpeningStat>();
  const openingMapBlack = new Map<string, OpeningStat>();
  let totalGames = 0;
  let gamesAsWhite = 0;
  let gamesAsBlack = 0;

  for (const archive of archiveResults) {
    if (!archive || !Array.isArray(archive.games)) continue;

    for (const game of archive.games) {
      if (game.rules && game.rules !== 'chess') continue; // skip variants

      const white = game.white;
      const black = game.black;
      if (!white?.username || !black?.username) continue;

      const isWhite = white.username.toLowerCase() === uname;
      const isBlack = black.username.toLowerCase() === uname;
      if (!isWhite && !isBlack) continue;

      const move = extractOpeningMove(game.pgn, isWhite);
      if (!move) continue;

      const result = isWhite ? white.result : black.result;
      const outcome = classifyResult(result);
      const color: 'white' | 'black' = isWhite ? 'white' : 'black';
      const map = isWhite ? openingMapWhite : openingMapBlack;

      const entry = map.get(move) || { move, color, games: 0, wins: 0, losses: 0, draws: 0 };
      entry.games += 1;
      if (outcome === 'win') entry.wins += 1;
      else if (outcome === 'loss') entry.losses += 1;
      else entry.draws += 1;
      map.set(move, entry);

      if (isWhite) gamesAsWhite += 1;
      else gamesAsBlack += 1;
      totalGames += 1;
    }
  }

  if (totalGames === 0) {
    throw new Error(`Couldn't find any standard chess games for ${username} in recent months.`);
  }

  const openingsWhite = Array.from(openingMapWhite.values()).sort((a, b) => b.games - a.games);
  const openingsBlack = Array.from(openingMapBlack.values()).sort((a, b) => b.games - a.games);

  return {
    username,
    totalGames,
    monthsScanned: recentArchives.length,
    gamesAsWhite,
    gamesAsBlack,
    openingsWhite,
    openingsBlack,
  };
}