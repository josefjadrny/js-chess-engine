import { AIEngine } from '../../src/ai/AIEngine';
import { parseFEN } from '../../src/utils/fen';
import { Search } from '../../src/ai/Search';

describe('AI adaptive depth', () => {
    test('searches deeper (more nodes) in simplified positions at same level', () => {
        // Starting position: high branching factor.
        const start = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

        // Simplified endgame: few pieces, low branching factor.
        // White: K on e1, Q on d1. Black: K on e8.
        const simple = parseFEN('4k3/8/8/8/8/8/8/3QK3 w - - 0 1');

        const engine = new AIEngine();

        // Access the underlying Search instance for instrumentation.
        // (TypeScript private is compile-time only; runtime access is fine.)
        const search: Search = (engine as any).search;

        const baseDepthLevel3 = 3;

        const startResult = (search as any).findBestMove(start, baseDepthLevel3);
        const startNodes = startResult?.nodesSearched ?? 0;

        // Reset between calls to avoid TT carry-over affecting node counts.
        (search as any).clear();

        const simpleResult = (search as any).findBestMove(simple, baseDepthLevel3);
        const simpleNodes = simpleResult?.nodesSearched ?? 0;

        expect(simpleNodes).toBeGreaterThan(startNodes);
    });
});
