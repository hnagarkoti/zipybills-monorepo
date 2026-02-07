import { describe, expect, it } from 'vitest';

import { exampleUtil } from './utils';

describe('Template Feature', () => {
  it('should work', () => {
    expect(exampleUtil('test')).toBe('TEST');
  });
});
