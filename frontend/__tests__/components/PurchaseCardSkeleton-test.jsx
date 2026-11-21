import React from 'react';
import { screen } from '@testing-library/react-native';
import { PurchaseCardSkeleton } from '../../src/components/PurchaseCardSkeleton';
import { renderConTema } from '../helpers/renderConTema';

describe('PurchaseCardSkeleton', () => {
	it.each(['dark', 'light'])(
		'renderiza con testID purchase-card-skeleton (%s)',
		async (scheme) => {
			await renderConTema(<PurchaseCardSkeleton />, { scheme });
			expect(screen.getByTestId('purchase-card-skeleton')).toBeTruthy();
		}
	);
});
