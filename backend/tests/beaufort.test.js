import { kmhToBeaufort } from '../src/utils/beaufort.js';
import assert from 'assert';
console.log('Testing kmhToBeaufort...');
assert.strictEqual(kmhToBeaufort(0), 0);
assert.strictEqual(kmhToBeaufort(5), 1);
assert.strictEqual(kmhToBeaufort(11), 2);
assert.strictEqual(kmhToBeaufort(19), 3);
assert.strictEqual(kmhToBeaufort(25), 4);
assert.strictEqual(kmhToBeaufort(45), 6);
assert.strictEqual(kmhToBeaufort(120), 12);
console.log('Beaufort tests passed!');
//# sourceMappingURL=beaufort.test.js.map