import React from 'react';
import { screen } from '@testing-library/react-native';
import { EventCardSkeleton } from '../../src/components/EventCardSkeleton';
import { renderConTema } from '../helpers/renderConTema';

describe.each(['dark', 'light'])('EventCardSkeleton (%s)', (scheme) => {
	it.each(['feature', 'compact'])(
		'renderiza la variante %s',
		async (variante) => {
			await renderConTema(<EventCardSkeleton variante={variante} />, {
				scheme
			});
			expect(
				screen.getByTestId(`event-card-skeleton-${variante}`)
			).toBeTruthy();
			expect(
				screen.getAllByTestId('skeleton', { includeHiddenElements: true })
					.length
			).toBeGreaterThan(1);
		}
	);
});
