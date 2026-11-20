import React from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import { act, screen } from '@testing-library/react-native';
import { Skeleton } from '../../src/components/Skeleton';
import { darkTheme, lightTheme } from '../../src/theme/theme';
import { renderConTema } from '../helpers/renderConTema';

describe.each([
	['dark', darkTheme],
	['light', lightTheme]
])('Skeleton (%s)', (scheme, tema) => {
	let loop;
	beforeEach(() => {
		loop = jest
			.spyOn(Animated, 'loop')
			.mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
		jest
			.spyOn(AccessibilityInfo, 'addEventListener')
			.mockReturnValue({ remove: jest.fn() });
	});
	afterEach(() => jest.restoreAllMocks());

	const montar = async (props) => {
		await renderConTema(<Skeleton {...props} />, { scheme });
		await act(async () => {});
	};

	it('aplica ancho, alto, radio y el fondo surfaceRaised del tema', async () => {
		jest
			.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
			.mockResolvedValue(false);
		await montar({ ancho: 120, alto: 24, radio: 'md' });
		const estilo = StyleSheet.flatten(
			screen.getByTestId('skeleton', { includeHiddenElements: true }).props
				.style
		);
		expect(estilo.width).toBe(120);
		expect(estilo.height).toBe(24);
		expect(estilo.borderRadius).toBe(tema.radius.md);
		expect(estilo.backgroundColor).toBe(tema.colors.surfaceRaised);
	});

	it('usa valores por defecto', async () => {
		jest
			.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
			.mockResolvedValue(false);
		await montar({});
		const estilo = StyleSheet.flatten(
			screen.getByTestId('skeleton', { includeHiddenElements: true }).props
				.style
		);
		expect(estilo.width).toBe('100%');
		expect(estilo.height).toBe(16);
		expect(estilo.borderRadius).toBe(tema.radius.sm);
	});

	it('es decorativo (no accesible)', async () => {
		jest
			.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
			.mockResolvedValue(false);
		await montar({});
		expect(
			screen.getByTestId('skeleton', { includeHiddenElements: true }).props
				.accessible
		).toBe(false);
	});

	it('pulsa cuando no está activo "reducir movimiento"', async () => {
		jest
			.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
			.mockResolvedValue(false);
		await montar({});
		expect(loop).toHaveBeenCalled();
	});

	it('no anima con "reducir movimiento"', async () => {
		jest
			.spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
			.mockResolvedValue(true);
		await montar({});
		expect(loop).not.toHaveBeenCalled();
	});
});
