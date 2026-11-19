import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDodgeOffset } from './dodgePhysics';

test('computeDodgeOffset always stays within safe bounds and moves away', () => {
  const bounds = { maxX: 90, maxY: 44 };
  let offset = { x: 0, y: 0 };

  for (let attempt = 1; attempt <= 12; attempt++) {
    const next = computeDodgeOffset({
      currentOffset: offset,
      bounds,
      attempt,
      seed: 2,
    });

    assert.ok(next.x >= -bounds.maxX && next.x <= bounds.maxX);
    assert.ok(next.y >= -bounds.maxY && next.y <= bounds.maxY);
    assert.ok(next.x !== offset.x || next.y !== offset.y);
    offset = next;
  }
});
