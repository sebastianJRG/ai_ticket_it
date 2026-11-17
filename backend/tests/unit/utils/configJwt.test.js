/**
 * Tests de la configuración JWT centralizada.
 *
 * @license ISC
 */
import { describe, it, expect } from '@jest/globals';
import {
	JWT_SECRET,
	JWT_ACCESS_EXPIRATION
} from '../../../src/utils/configJwt.js';

describe('configJwt', () => {
	it('expone un secreto y una expiración de access token no vacíos', () => {
		expect(typeof JWT_SECRET).toBe('string');
		expect(JWT_SECRET.length).toBeGreaterThan(0);
		expect(typeof JWT_ACCESS_EXPIRATION).toBe('string');
	});
});
