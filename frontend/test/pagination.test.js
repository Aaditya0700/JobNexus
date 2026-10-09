import test from 'node:test';
import assert from 'node:assert/strict';
import { getPaginationItems } from '../src/utils/pagination.js';

test('pagination controls remain bounded for very large provider result counts', () => {
  const items = getPaginationItems(19638, 1);
  assert.deepEqual(items, [1, 2, 3, 4, 5, 'ellipsis-end', 19638]);
  assert.equal(items.filter((item) => typeof item === 'number').length, 6);
});

test('pagination keeps the current page and nearby pages reachable', () => {
  assert.deepEqual(getPaginationItems(20, 10), [1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]);
  assert.deepEqual(getPaginationItems(8, 8), [1, 'ellipsis-start', 4, 5, 6, 7, 8]);
});

test('pagination handles small and invalid page ranges safely', () => {
  assert.deepEqual(getPaginationItems(4, 2), [1, 2, 3, 4]);
  assert.deepEqual(getPaginationItems(0, 0), [1]);
});
