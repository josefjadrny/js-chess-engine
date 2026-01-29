/**
 * Unit tests for user-provided FEN validation
 */

import { Game } from '../../src';

describe('FEN validation (user input)', () => {
    it('should accept a valid starting FEN', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        expect(() => new Game(fen)).not.toThrow();
    });

    it('should reject FEN with wrong number of ranks', () => {
        const fen = '8/8/8/8/8/8/8 w - - 0 1';
        expect(() => new Game(fen)).toThrow(/expected 8 ranks/i);
    });

    it('should reject FEN where a rank does not sum to 8 files', () => {
        // First rank sums to 7 ("7"), should be 8
        const fen = '7/8/8/8/8/8/8/8 w - - 0 1';
        expect(() => new Game(fen)).toThrow(/has 7 files instead of 8/i);
    });

    it('should reject FEN with unknown piece character', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1';
        expect(() => new Game(fen)).toThrow(/unknown piece character/i);
    });

    it('should reject FEN with invalid active color', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1';
        expect(() => new Game(fen)).toThrow(/active color/i);
    });

    it('should reject en passant square with invalid rank', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e2 0 1';
        expect(() => new Game(fen)).toThrow(/en passant/i);
    });

    it('should reject non-numeric halfmove clock', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x 1';
        expect(() => new Game(fen)).toThrow(/half-move clock/i);
    });

    it('should reject non-numeric fullmove number', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 x';
        expect(() => new Game(fen)).toThrow(/full move number/i);
    });

    it('should reject FEN with wrong number of parts', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0';
        expect(() => new Game(fen)).toThrow(/expected 6 parts/i);
    });

    it('should reject invalid castling rights', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqa - 0 1';
        expect(() => new Game(fen)).toThrow(/castling/i);
    });

    it('should reject duplicate castling rights', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KK - 0 1';
        expect(() => new Game(fen)).toThrow(/duplicate castling/i);
    });

    it('should reject invalid en passant square', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e4 0 1';
        expect(() => new Game(fen)).toThrow(/en passant/i);
    });

    it('should reject negative halfmove clock', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1';
        expect(() => new Game(fen)).toThrow(/half-move/i);
    });

    it('should reject fullmove number < 1', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0';
        expect(() => new Game(fen)).toThrow(/full move number/i);
    });

    it('should reject missing white king', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR w KQkq - 0 1';
        expect(() => new Game(fen)).toThrow(/one white king/i);
    });

    it('should reject missing black king', () => {
        const fen = 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1';
        expect(() => new Game(fen)).toThrow(/one white king and one black king/i);
    });
});
