import { Chess, Square } from 'chess.js';

export interface LegalMove {
  from: string;
  to: string;
  san: string;
}

export interface MoveResult {
  valid: boolean;
  fen?: string;
  lastMove?: { from: string; to: string };
  nextMoveIndex?: number;
  expectedMove?: string;
  promotion?: string;
}

/**
 * Chess engine that manages game state for practice/view modes
 */
export class ChessEngine {
  private chess: Chess;
  private gameMoves: string[] = [];
  private moveIndex: number = 0;

  constructor() {
    this.chess = new Chess();
  }

  /**
   * Load a game's moves for practice/viewing
   */
  loadGame(moves: string[]): void {
    this.gameMoves = moves;
    this.moveIndex = 0;
    this.chess.reset();
  }

  /**
   * Get the current FEN
   */
  getFen(): string {
    return this.chess.fen();
  }

  /**
   * Get current move index
   */
  getMoveIndex(): number {
    return this.moveIndex;
  }

  /**
   * Get total moves
   */
  getTotalMoves(): number {
    return this.gameMoves.length;
  }

  /**
   * Get legal moves from a specific square
   */
  getLegalMovesFrom(square: string): LegalMove[] {
    const moves = this.chess.moves({ square: square as Square, verbose: true });
    return moves.map(m => ({
      from: m.from,
      to: m.to,
      san: m.san,
    }));
  }

  /**
   * Get all legal moves for current position
   */
  getAllLegalMoves(): LegalMove[] {
    const moves = this.chess.moves({ verbose: true });
    return moves.map(m => ({
      from: m.from,
      to: m.to,
      san: m.san,
    }));
  }

  /**
   * Validate a move against the expected game sequence (for guess mode)
   */
  validateMove(from: string, to: string, promotion?: string): MoveResult {
    if (this.moveIndex >= this.gameMoves.length) {
      return { valid: false, expectedMove: 'Game complete' };
    }

    const expectedSan = this.gameMoves[this.moveIndex];

    try {
      // Try making the move
      const moveObj: { from: string; to: string; promotion?: string } = { from, to };
      if (promotion) {
        moveObj.promotion = promotion.toLowerCase();
      }

      // Try the move on a clone to check SAN
      const testChess = new Chess(this.chess.fen());
      const result = testChess.move(moveObj);

      if (!result) {
        return { valid: false, expectedMove: expectedSan };
      }

      // Check if it matches expected
      if (result.san === expectedSan) {
        // Apply the move
        this.chess.move(moveObj);
        this.moveIndex++;

        return {
          valid: true,
          fen: this.chess.fen(),
          lastMove: { from, to },
          nextMoveIndex: this.moveIndex,
          promotion: promotion || undefined,
        };
      } else {
        return { valid: false, expectedMove: expectedSan };
      }
    } catch {
      return { valid: false, expectedMove: expectedSan };
    }
  }

  /**
   * Navigate through moves (for view mode)
   */
  navigateTo(direction: 'first' | 'prev' | 'next' | 'last'): {
    fen: string;
    moveIndex: number;
    lastMove: { from: string; to: string } | null;
    currentMoveSan: string | null;
  } {
    let targetIndex = this.moveIndex;

    switch (direction) {
      case 'first':
        targetIndex = 0;
        break;
      case 'prev':
        targetIndex = Math.max(0, this.moveIndex - 1);
        break;
      case 'next':
        targetIndex = Math.min(this.gameMoves.length, this.moveIndex + 1);
        break;
      case 'last':
        targetIndex = this.gameMoves.length;
        break;
    }

    // Replay to target position
    this.chess.reset();
    let lastMove: { from: string; to: string } | null = null;
    let currentMoveSan: string | null = null;

    for (let i = 0; i < targetIndex; i++) {
      const result = this.chess.move(this.gameMoves[i]);
      if (result && i === targetIndex - 1) {
        lastMove = { from: result.from, to: result.to };
        currentMoveSan = result.san;
      }
    }

    this.moveIndex = targetIndex;

    return {
      fen: this.chess.fen(),
      moveIndex: this.moveIndex,
      lastMove,
      currentMoveSan,
    };
  }

  /**
   * Play the next move automatically (for auto-respond)
   */
  playNextMove(): {
    fen: string;
    moveIndex: number;
    lastMove: { from: string; to: string } | null;
    moveSan: string | null;
  } | null {
    if (this.moveIndex >= this.gameMoves.length) return null;

    const san = this.gameMoves[this.moveIndex];
    const result = this.chess.move(san);
    if (!result) return null;

    this.moveIndex++;

    return {
      fen: this.chess.fen(),
      moveIndex: this.moveIndex,
      lastMove: { from: result.from, to: result.to },
      moveSan: result.san,
    };
  }

  /**
   * Reset to starting position
   */
  reset(): void {
    this.chess.reset();
    this.moveIndex = 0;
  }
}
