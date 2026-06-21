// Lightweight client for the public, unauthenticated chess.com API.
// Docs: https://www.chess.com/news/view/published-data-api
// No login/OAuth is required (or available) for this data — a public
// username is enough, same as visiting chess.com/member/<username>.

export interface OpeningStat {
  move: string; // the OPPONENT's opening move against this user — e.g. when
                // the user played White, this is Black's first reply; when
                // the user played Black, this is White's first move.
  color: 'white' | 'black'; // the color the user (not the opponent) played
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

const SAN_MOVE_RE = /^(O-O-O|O-O|[KQRNB]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?)$/;

function normalizeMove(move: string): string {
  return move.replace(/[+#!?]+$/g, '');
}

// Pull the OPPONENT's opening move out of a PGN string, relative to the
// user's color in that game.
// isWhite=true  (user played White)  -> opponent is Black -> their reply is
//                                        the 2nd SAN token.
// isWhite=false (user played Black)  -> opponent is White -> their move is
//                                        the 1st SAN token.
function extractOpponentOpeningMove(pgn: string, isWhite: boolean): string | null {
  if (!pgn) return null;

  // PGN headers are lines of the exact form `[Tag "Value"]`. We can't just
  // find the LAST "]" in the whole string to locate where headers end —
  // chess.com's inline clock comments in the movetext (e.g. "{[%clk
  // 0:02:58]}") also contain "]", so that would slice into the middle of
  // the movetext instead of skipping past the header block. Filtering out
  // whole header lines is robust regardless of what's inside the movetext.
  const movetext = pgn
    .split('\n')
    .filter((line) => !/^\s*\[.*\]\s*$/.test(line))
    .join(' ');

  const cleaned = movetext
    .replace(/\{[^}]*\}/g, '') // strip {clock/eval} annotations
    .replace(/\$\d+/g, '');    // strip NAG codes

  const tokens = cleaned.trim().split(/\s+/).filter(Boolean);
  const sanMoves: string[] = [];

  for (const token of tokens) {
    if (/^\d+\.+$/.test(token)) continue; // move numbers like "1." or "1..."
    if (token === '*' || token === '1-0' || token === '0-1' || token === '1/2-1/2') continue;
    if (!SAN_MOVE_RE.test(token)) continue; // skip anything that isn't a real SAN move
    sanMoves.push(token);
  }

  // Opponent's move is at the opposite index from the user's own move.
  const move = isWhite ? sanMoves[1] : sanMoves[0];
  return move ? normalizeMove(move) : null;
}

async function fetchJson(url: string) {
  // Cache-bust + disable HTTP caching so we never silently reuse a stale
  // response across different usernames.
  const bustUrl = url + (url.includes('?') ? '&' : '?') + `_=${Date.now()}`;
  const res = await fetch(bustUrl, { cache: 'no-store' });
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

  // Verify the account actually exists AND that the response really
  // corresponds to the requested username (guards against a stale/cached
  // or mocked response silently being reused across different lookups).
  const profile = await fetchJson(`https://api.chess.com/pub/player/${uname}`);
  if (!profile) {
    throw new Error(`No chess.com account found for "${username}".`);
  }
  if (typeof profile.username !== 'string' || profile.username.toLowerCase() !== uname) {
    console.error('chess.com profile mismatch', { requested: uname, got: profile.username });
    throw new Error(
      `Got an unexpected response while looking up "${username}" — please try again. ` +
      `(If this keeps happening, check the browser console/network tab for blocked requests to api.chess.com.)`
    );
  }

  const archivesData = await fetchJson(`https://api.chess.com/pub/player/${uname}/games/archives`);
  if (!archivesData) {
    throw new Error(`No chess.com account found for "${username}".`);
  }

  const archiveUrls: string[] = archivesData.archives || [];
  if (archiveUrls.length === 0) {
    throw new Error(`${username} doesn't have any games on record yet.`);
  }

  // Sanity-check that the archive URLs actually belong to this user.
  if (archiveUrls.length > 0 && !archiveUrls[0].toLowerCase().includes(`/${uname}/`)) {
    console.error('chess.com archive URL mismatch', { requested: uname, sample: archiveUrls[0] });
    throw new Error(`Got mismatched data while looking up "${username}" — please try again.`);
  }

  const recentArchives = archiveUrls.slice(-MAX_MONTHS);

  console.debug('[chesscom] fetching', { username: uname, monthsRequested: recentArchives.length });

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

      const move = extractOpponentOpeningMove(game.pgn, isWhite);
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

  console.debug('[chesscom] result', { username: uname, totalGames, gamesAsWhite, gamesAsBlack });

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