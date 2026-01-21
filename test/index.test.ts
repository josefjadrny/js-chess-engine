import { ChessEngine } from '../src/index';

describe('ChessEngine', () => {
  let engine: ChessEngine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  it('should create an instance', () => {
    expect(engine).toBeInstanceOf(ChessEngine);
  });

  it('should return correct version', () => {
    expect(engine.getVersion()).toBe('2.0.0');
  });
});
