/**
 * Environment detection tests
 */

import { isNodeEnvironment, isBrowserEnvironment, getDefaultTTSize, getRecommendedTTSize } from '../../src/utils/environment';

describe('Environment Detection', () => {
    describe('isNodeEnvironment', () => {
        it('should detect Node.js environment', () => {
            // Running in Jest/Node.js
            expect(isNodeEnvironment()).toBe(true);
        });

        it('should be opposite of isBrowserEnvironment', () => {
            expect(isNodeEnvironment()).toBe(!isBrowserEnvironment());
        });
    });

    describe('isBrowserEnvironment', () => {
        it('should detect browser environment', () => {
            // Running in Jest/Node.js, so should be false
            expect(isBrowserEnvironment()).toBe(false);
        });
    });

    describe('getDefaultTTSize', () => {
        it('should return 8 MB for Node.js', () => {
            // Running in Jest/Node.js
            expect(getDefaultTTSize()).toBe(8);
        });

        it('should return a positive number', () => {
            expect(getDefaultTTSize()).toBeGreaterThan(0);
        });
    });

    describe('getRecommendedTTSize', () => {
        it('should return appropriate sizes for each level in Node.js', () => {
            // Running in Node.js
            expect(getRecommendedTTSize(1)).toBe(1);
            expect(getRecommendedTTSize(2)).toBe(2);
            expect(getRecommendedTTSize(3)).toBe(8);
            expect(getRecommendedTTSize(4)).toBe(16);
            expect(getRecommendedTTSize(5)).toBe(32);
            expect(getRecommendedTTSize(6)).toBe(64);
        });

        it('should return default for unknown levels', () => {
            expect(getRecommendedTTSize(99)).toBe(8); // Node.js default (browser would be 4)
        });

        it('should return positive numbers for all levels', () => {
            for (let level = 1; level <= 6; level++) {
                expect(getRecommendedTTSize(level)).toBeGreaterThan(0);
            }
        });
    });
});
