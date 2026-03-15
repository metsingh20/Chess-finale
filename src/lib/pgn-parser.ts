import { Chess } from 'chess.js';

export interface GameData {
  index: number;
  white: string;
  black: string;
  result: string;
  date: string;
  event: string;
  moves: string[];
  totalMoves: number;
}

/**
 * Parse PGN text and extract all games with their moves
 */
export function parsePGN(pgnText: string): GameData[] {
  const games: GameData[] = [];
  
  // Split PGN text into individual games
  const gameTexts = splitPGNGames(pgnText);
  
  gameTexts.forEach((gameText, index) => {
    try {
      const chess = new Chess();
      
      // Extract headers
      const headers = extractHeaders(gameText);
      
      // Extract moves portion (everything after headers)
      const movesText = gameText.replace(/\[.*?\]\s*/g, '').trim();
      
      if (!movesText) return;
      
      // Try loading the PGN
      try {
        chess.loadPgn(gameText);
      } catch {
        // If full PGN load fails, try just the moves
        try {
          chess.loadPgn(movesText);
        } catch {
          return;
        }
      }
      
      // Extract moves in SAN notation
      const history = chess.history();
      
      if (history.length === 0) return;
      
      games.push({
        index,
        white: headers['White'] || 'Unknown',
        black: headers['Black'] || 'Unknown',
        result: headers['Result'] || '*',
        date: headers['Date'] || '????.??.??',
        event: headers['Event'] || 'Unknown Event',
        moves: history,
        totalMoves: history.length,
      });
    } catch (e) {
      console.error(`Error parsing game ${index}:`, e);
    }
  });
  
  return games;
}

function splitPGNGames(pgnText: string): string[] {
  const games: string[] = [];
  const lines = pgnText.split('\n');
  let currentGame = '';
  let inHeaders = false;
  let hasContent = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      if (hasContent && !inHeaders) {
        // New game starting - save previous
        if (currentGame.trim()) {
          games.push(currentGame.trim());
        }
        currentGame = '';
        hasContent = false;
      }
      inHeaders = true;
      hasContent = true;
      currentGame += line + '\n';
    } else if (trimmed === '') {
      inHeaders = false;
      currentGame += '\n';
    } else {
      inHeaders = false;
      hasContent = true;
      currentGame += line + '\n';
    }
  }
  
  if (currentGame.trim()) {
    games.push(currentGame.trim());
  }
  
  return games;
}

function extractHeaders(gameText: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerRegex = /\[(\w+)\s+"(.*)"\]/g;
  let match;
  
  while ((match = headerRegex.exec(gameText)) !== null) {
    headers[match[1]] = match[2];
  }
  
  return headers;
}
