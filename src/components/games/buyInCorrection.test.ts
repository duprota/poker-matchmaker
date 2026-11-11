import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseBuyIn, previewBuyIn } from './buyInCorrection';

describe('buy-in corrections', () => {
  test('accepts positive amounts and decimal comma', () => {
    assert.equal(parseBuyIn('150,50'), 150.5);
    for (const input of ['', '0', '-100', 'Infinity', 'NaN']) assert.equal(parseBuyIn(input), null);
  });
  test('corrects investment and balance for a player who exited', () => {
    assert.deepEqual(previewBuyIn(150, 2, 567), { invested: 450, balance: 117 });
  });
  test('corrects completed-game losses including zero final chips', () => {
    assert.deepEqual(previewBuyIn(200, 3, 0), { invested: 800, balance: -800 });
  });
  test('keeps an active player active', () => {
    assert.deepEqual(previewBuyIn(100, 1, null), { invested: 200, balance: null });
  });
});