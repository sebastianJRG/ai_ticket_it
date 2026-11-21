// AI Ticket It — implementación web de referencia de los componentes React Native.
// Misma API de props que en RN (onPress, disabled, loading…). Las clases at-* viven en bundle.css.
import { Icon, iconNames } from './icons.jsx';
import * as format from './format.js';
const {
	formatPrice,
	formatPriceFrom,
	formatRating,
	formatCount,
	formatDaysLeft,
	formatTickets
} = format;

const React = window.React;
const { useState } = React;
const cx = (...a) => a.filter(Boolean).join(' ');

/* ═══════════════ Estados de compra ═══════════════ */
export const STATUS = {
	PENDIENTE: {
		label: 'Pendiente de pago',
		short: 'Pendiente',
		icon: 'hourglass'
	},
	CONFIRMADA: { label: 'Confirmada', short: 'Confirmada', icon: 'checkCircle' },
	UTILIZADA: { label: 'Utilizada', short: 'Utilizada', icon: 'ticketCheck' },
	CANCELADA: { label: 'Cancelada', short: 'Cancelada', icon: 'xCircle' },
	REEMBOLSADA: { label: 'Reembolsada', short: 'Reembolsada', icon: 'undo' }
};
export const CATEGORIES = [
	{ key: 'todo', label: 'Todo', icon: 'grid' },
	{ key: 'recitales', label: 'Recitales', icon: 'music' },
	{ key: 'teatro', label: 'Teatro', icon: 'theater' },
	{ key: 'festivales', label: 'Festivales', icon: 'festival' },
	{ key: 'conferencias', label: 'Conferencias', icon: 'mic' },
	{ key: 'deportes', label: 'Deportes', icon: 'trophy' }
];
const catOf = (k) => CATEGORIES.find((c) => c.key === k) || CATEGORIES[1];

/* ═══════════════ Button ═══════════════ */
export function Button({
	variant = 'primary',
	size = 'md',
	disabled,
	loading,
	pressed,
	icon,
	iconRight,
	fullWidth,
	glow,
	children,
	onPress,
	accessibilityLabel
}) {
	const iconSize = size === 'sm' ? 16 : 20;
	return (
		<button
			type="button"
			className={cx(
				'at-btn',
				`at-btn-${variant}`,
				`at-btn-${size}`,
				fullWidth && 'at-btn-full',
				pressed && 'is-pressed',
				loading && 'is-loading',
				glow && 'at-btn-glow'
			)}
			disabled={disabled}
			aria-busy={loading || undefined}
			aria-label={accessibilityLabel}
			onClick={loading ? undefined : onPress}
		>
			<span className="at-btn-content">
				{icon ? <Icon name={icon} size={iconSize} /> : null}
				{children}
				{iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
			</span>
			{loading ? (
				<span className="at-spinner" role="progressbar" aria-label="Cargando" />
			) : null}
		</button>
	);
}

export function IconButton({
	icon,
	label,
	variant = 'plain',
	active,
	badge,
	size = 22,
	onPress,
	fill
}) {
	return (
		<button
			type="button"
			className={cx(
				'at-iconbtn',
				`at-iconbtn-${variant}`,
				active && 'is-active'
			)}
			aria-label={label}
			aria-pressed={active ?? undefined}
			onClick={onPress}
		>
			<Icon
				name={icon}
				size={size}
				fill={fill ?? (active && icon === 'heart' ? 'currentColor' : 'none')}
			/>
			{badge ? <span className="at-iconbtn-badge">{badge}</span> : null}
		</button>
	);
}

/* ═══════════════ Inputs ═══════════════ */
export function TextField({
	label,
	value,
	placeholder,
	helper,
	error,
	prefix,
	suffix,
	multiline,
	disabled,
	focused,
	required,
	maxLength,
	onChangeText,
	keyboardType,
	secureTextEntry,
	autoComplete
}) {
	const [v, setV] = useState(value ?? '');
	const [f, setF] = useState(false);
	const [show, setShow] = useState(false);
	const Tag = multiline ? 'textarea' : 'input';
	return (
		<label className="at-field">
			{label ? (
				<span className="at-field-label">
					{label}
					{required ? null : <span className="at-req"> (opcional)</span>}
				</span>
			) : null}
			<span
				className={cx(
					'at-field-box',
					(focused || f) && 'is-focused',
					error && 'is-error',
					disabled && 'is-disabled',
					multiline && 'is-multiline'
				)}
			>
				{prefix ? <span className="at-field-affix">{prefix}</span> : null}
				<Tag
					className="at-field-input"
					value={v}
					placeholder={placeholder}
					disabled={disabled}
					maxLength={maxLength}
					rows={multiline ? 4 : undefined}
					inputMode={
						keyboardType === 'numeric'
							? 'numeric'
							: keyboardType === 'email-address'
								? 'email'
								: undefined
					}
					type={secureTextEntry && !show ? 'password' : undefined}
					autoComplete={autoComplete}
					aria-invalid={!!error || undefined}
					onFocus={() => setF(true)}
					onBlur={() => setF(false)}
					onChange={(e) => {
						setV(e.target.value);
						onChangeText && onChangeText(e.target.value);
					}}
				/>
				{suffix ? <span className="at-field-affix">{suffix}</span> : null}
				{secureTextEntry ? (
					<span
						style={{ marginRight: -12 }}
						onClick={(e) => {
							e.preventDefault();
							setShow(!show);
						}}
					>
						<IconButton
							icon={show ? 'eyeOff' : 'eye'}
							label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
							size={20}
						/>
					</span>
				) : null}
			</span>
			{error || helper || maxLength ? (
				<span className={cx('at-field-help', error && 'is-error')}>
					{error ? <Icon name="alert" size={16} /> : null}
					<span>{error || helper}</span>
					{maxLength && multiline ? (
						<span className="at-counter">
							{v.length}/{maxLength}
						</span>
					) : null}
				</span>
			) : null}
		</label>
	);
}

export function SearchBar({
	value,
	placeholder = 'Buscá artistas, obras, eventos…',
	focused,
	filterCount = 0,
	onFilterPress,
	showFilter = true
}) {
	const [v, setV] = useState(value ?? '');
	const [f, setF] = useState(false);
	return (
		<div className="at-search" role="search">
			<label className={cx('at-search-box', (focused || f) && 'is-focused')}>
				<Icon name="search" size={20} />
				<input
					className="at-field-input"
					value={v}
					placeholder={placeholder}
					aria-label="Buscar eventos"
					onFocus={() => setF(true)}
					onBlur={() => setF(false)}
					onChange={(e) => setV(e.target.value)}
				/>
				{v ? (
					<IconButton
						icon="x"
						label="Borrar búsqueda"
						size={18}
						onPress={() => setV('')}
					/>
				) : null}
			</label>
			{showFilter ? (
				<button
					type="button"
					className={cx('at-search-filter', filterCount > 0 && 'is-active')}
					aria-label={
						filterCount ? `Filtros (${filterCount} activos)` : 'Filtros'
					}
					onClick={onFilterPress}
				>
					<Icon name="sliders" size={20} />
					{filterCount > 0 ? (
						<span className="at-count">{filterCount}</span>
					) : null}
				</button>
			) : null}
		</div>
	);
}

export function Select({
	label,
	value,
	placeholder = 'Elegí una opción',
	options = [],
	open: openProp,
	error,
	helper,
	required = true,
	onChange
}) {
	const [open, setOpen] = useState(!!openProp);
	const [val, setVal] = useState(value);
	const sel = options.find((o) => o.value === val);
	return (
		<div className="at-field">
			{label ? (
				<span className="at-field-label">
					{label}
					{required ? null : <span className="at-req"> (opcional)</span>}
				</span>
			) : null}
			<button
				type="button"
				className={cx(
					'at-field-box',
					open && 'is-focused',
					error && 'is-error'
				)}
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={() => setOpen(!open)}
			>
				{sel && sel.icon ? <Icon name={sel.icon} size={20} /> : null}
				<span className={cx('at-select-value', !sel && 'is-placeholder')}>
					{sel ? sel.label : placeholder}
				</span>
				<Icon
					name="chevronDown"
					size={20}
					style={{
						transform: open ? 'rotate(180deg)' : 'none',
						transition: 'transform var(--duration-fast)'
					}}
				/>
			</button>
			{open ? (
				<div className="at-menu" role="listbox">
					{options.map((o) => (
						<button
							type="button"
							key={o.value}
							role="option"
							aria-selected={o.value === val}
							className={cx('at-menu-item', o.value === val && 'is-selected')}
							onClick={() => {
								setVal(o.value);
								setOpen(false);
								onChange && onChange(o.value);
							}}
						>
							{o.icon ? <Icon name={o.icon} size={20} /> : null}
							<span style={{ flex: 1 }}>{o.label}</span>
							{o.value === val ? <Icon name="check" size={20} /> : null}
						</button>
					))}
				</div>
			) : null}
			{error || helper ? (
				<span className={cx('at-field-help', error && 'is-error')}>
					{error ? <Icon name="alert" size={16} /> : null}
					<span>{error || helper}</span>
				</span>
			) : null}
		</div>
	);
}

export function QuantityStepper({
	value: valueProp = 0,
	min = 0,
	max = 10,
	onChange,
	showHint = true,
	label = 'Cantidad'
}) {
	const [value, setValue] = useState(valueProp);
	const set = (n) => {
		const v = Math.max(min, Math.min(max, n));
		setValue(v);
		onChange && onChange(v);
	};
	const atMax = value >= max;
	return (
		<div className="at-stepper-wrap">
			<div className="at-stepper" role="group" aria-label={label}>
				<button
					type="button"
					className="at-stepper-btn"
					aria-label="Quitar una"
					disabled={value <= min}
					onClick={() => set(value - 1)}
				>
					<Icon name="minus" size={20} />
				</button>
				<span className="at-stepper-value" aria-live="polite">
					{value}
				</span>
				<button
					type="button"
					className="at-stepper-btn is-plus"
					aria-label="Agregar una"
					disabled={atMax}
					onClick={() => set(value + 1)}
				>
					<Icon name="plus" size={20} />
				</button>
			</div>
			{showHint ? (
				<span className={cx('at-stepper-hint', atMax && 'is-max')}>
					{atMax ? `Máximo ${max}` : `Hasta ${max}`}
				</span>
			) : null}
		</div>
	);
}

export function Checkbox({
	checked: c0 = false,
	label,
	error,
	disabled,
	onChange
}) {
	const [c, setC] = useState(c0);
	return (
		<div className="at-field">
			<button
				type="button"
				role="checkbox"
				aria-checked={c}
				disabled={disabled}
				className={cx('at-check', c && 'is-on', error && 'is-error')}
				onClick={() => {
					setC(!c);
					onChange && onChange(!c);
				}}
			>
				<span className="at-check-box">
					{c ? <Icon name="check" size={16} strokeWidth={3} /> : null}
				</span>
				<span className="at-check-label">{label}</span>
			</button>
			{error ? (
				<span className="at-field-help is-error">
					<Icon name="alert" size={16} />
					<span>{error}</span>
				</span>
			) : null}
		</div>
	);
}

export function ChoiceCard({ icon, title, description, selected, onPress }) {
	return (
		<button
			type="button"
			role="radio"
			aria-checked={!!selected}
			className={cx('at-choice', selected && 'is-on')}
			onClick={onPress}
		>
			<span className="at-choice-icon">
				<Icon name={icon} size={22} />
			</span>
			<span className="at-choice-text">
				<span className="at-t-title-sm">{title}</span>
				{description ? (
					<span className="at-t-body-sm at-muted">{description}</span>
				) : null}
			</span>
			<span className={cx('at-radio', selected && 'is-on')} />
		</button>
	);
}

export function RoleSelector({ value: v0 = 'buyer', onChange }) {
	const [v, setV] = useState(v0);
	const pick = (k) => {
		setV(k);
		onChange && onChange(k);
	};
	return (
		<div
			role="radiogroup"
			aria-label="¿Cómo vas a usar AI Ticket It?"
			className="at-stack"
			style={{ gap: 8 }}
		>
			<ChoiceCard
				icon="ticket"
				title="Quiero comprar entradas"
				description="Explorá, comprá y seguí tus compras."
				selected={v === 'buyer'}
				onPress={() => pick('buyer')}
			/>
			<ChoiceCard
				icon="calendar"
				title="Quiero organizar eventos"
				description="Publicá eventos y vendé entradas."
				selected={v === 'organizer'}
				onPress={() => pick('organizer')}
			/>
		</div>
	);
}

/* ═══════════════ Chips & orden ═══════════════ */
export function Chip({
	label,
	icon,
	selected,
	variant = 'category',
	removable,
	count,
	onPress
}) {
	return (
		<button
			type="button"
			className={cx('at-chip', `at-chip-${variant}`, selected && 'is-selected')}
			aria-pressed={!!selected}
			onClick={onPress}
		>
			{variant === 'filter' && selected && !removable ? (
				<Icon name="check" size={16} />
			) : icon ? (
				<Icon name={icon} size={variant === 'filter' ? 16 : 18} />
			) : null}
			{label}
			{count != null ? <span className="at-chip-count">{count}</span> : null}
			{removable ? <Icon name="x" size={16} /> : null}
		</button>
	);
}

export function CategoryChips({
	value = 'todo',
	categories = CATEGORIES,
	onChange
}) {
	const [v, setV] = useState(value);
	return (
		<div className="at-chip-row" role="tablist" aria-label="Categorías">
			{categories.map((c) => (
				<Chip
					key={c.key}
					label={c.label}
					icon={c.icon}
					selected={v === c.key}
					onPress={() => {
						setV(c.key);
						onChange && onChange(c.key);
					}}
				/>
			))}
		</div>
	);
}

export const SORT_OPTIONS = [
	{ value: 'date', label: 'Fecha más próxima', short: 'Fecha' },
	{ value: 'price_asc', label: 'Precio: menor a mayor', short: 'Precio ↑' },
	{ value: 'price_desc', label: 'Precio: mayor a menor', short: 'Precio ↓' },
	{ value: 'rating', label: 'Mejor puntaje del organizador', short: 'Puntaje' }
];

export function SortSelector({
	value = 'date',
	options = SORT_OPTIONS,
	onPress
}) {
	const sel = options.find((o) => o.value === value) || options[0];
	return (
		<button
			type="button"
			className="at-sort-trigger at-focusable"
			aria-label={`Ordenar por ${sel.label}`}
			onClick={onPress}
		>
			<Icon name="sort" size={16} />
			<span className="at-sort-k">Ordenar:</span> {sel.short}
			<Icon name="chevronDown" size={16} />
		</button>
	);
}

export function SortOptions({
	value = 'date',
	options = SORT_OPTIONS,
	onChange
}) {
	const [v, setV] = useState(value);
	return (
		<div role="radiogroup" aria-label="Ordenar por">
			{options.map((o) => (
				<button
					type="button"
					key={o.value}
					role="radio"
					aria-checked={v === o.value}
					className={cx('at-radio-row', v === o.value && 'is-on')}
					onClick={() => {
						setV(o.value);
						onChange && onChange(o.value);
					}}
				>
					<span className="at-radio-label">{o.label}</span>
					<span className={cx('at-radio', v === o.value && 'is-on')} />
				</button>
			))}
		</div>
	);
}

/* ═══════════════ Estado, avatar, rating ═══════════════ */
export function StatusBadge({ status, size = 'md', daysLeft, short }) {
	const s = STATUS[status];
	if (!s) return null;
	return (
		<span
			className={cx(
				'at-badge',
				`at-badge-${status}`,
				size === 'sm' && 'at-badge-sm'
			)}
		>
			<Icon name={s.icon} size={size === 'sm' ? 14 : 16} strokeWidth={2.4} />
			{short || size === 'sm' ? s.short : s.label}
			{status === 'CONFIRMADA' && daysLeft != null ? (
				<span className="at-badge-days">
					· {formatDaysLeft(daysLeft).toLowerCase()}
				</span>
			) : null}
		</span>
	);
}

export function Tag({ tone = 'hot', icon, children }) {
	return (
		<span className={cx('at-tag', `at-tag-${tone}`)}>
			{icon ? <Icon name={icon} size={14} strokeWidth={2.4} /> : null}
			{children}
		</span>
	);
}

export function Avatar({ name = '', size = 40 }) {
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join('');
	const tone = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
	return (
		<span
			className={cx('at-avatar', `at-avatar-${tone}`)}
			style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
			aria-hidden="true"
		>
			{initials}
		</span>
	);
}

export function Rating({
	value = 0,
	count,
	size = 16,
	showValue = true,
	compact
}) {
	if (compact) {
		return (
			<span
				className="at-rating-chip"
				aria-label={`Puntaje ${formatRating(value)} de 5`}
			>
				<Icon name="star" size={size} fill="currentColor" />
				{formatRating(value)}
				{count != null ? (
					<span className="at-rating-count">({formatCount(count)})</span>
				) : null}
			</span>
		);
	}
	return (
		<span
			className="at-rating"
			aria-label={`Puntaje ${formatRating(value)} de 5${count != null ? `, ${count} reseñas` : ''}`}
		>
			<span className="at-rating-stars">
				{[1, 2, 3, 4, 5].map((i) => (
					<Icon
						key={i}
						name="star"
						size={size}
						fill="currentColor"
						strokeWidth={1.5}
						color="currentColor"
						style={{
							color: value >= i - 0.25 ? 'var(--rating)' : 'var(--rating-empty)'
						}}
					/>
				))}
			</span>
			{showValue ? (
				<span
					className="at-rating-value"
					style={{ fontSize: size < 16 ? 13 : 15 }}
				>
					{formatRating(value)}
				</span>
			) : null}
			{count != null ? (
				<span className="at-rating-count" style={{ fontSize: 13 }}>
					({formatCount(count)})
				</span>
			) : null}
		</span>
	);
}

const RATING_LABELS = [
	'Tocá una estrella para puntuar',
	'Malo',
	'Regular',
	'Bueno',
	'Muy bueno',
	'Excelente'
];
export function RatingInput({ value: v0 = 0, onChange }) {
	const [v, setV] = useState(v0);
	return (
		<div className="at-rating-input">
			<div
				className="at-rating-input-stars"
				role="radiogroup"
				aria-label="Puntaje del 1 al 5"
			>
				{[1, 2, 3, 4, 5].map((i) => (
					<button
						type="button"
						key={i}
						role="radio"
						aria-checked={v === i}
						aria-label={`${i} de 5: ${RATING_LABELS[i]}`}
						className="at-rating-input-star at-focusable"
						onClick={() => {
							setV(i);
							onChange && onChange(i);
						}}
					>
						<Icon
							name="star"
							size={36}
							strokeWidth={1.6}
							fill="currentColor"
							style={{
								color: v >= i ? 'var(--rating)' : 'var(--rating-empty)'
							}}
						/>
					</button>
				))}
			</div>
			<span
				className="at-rating-input-caption"
				style={{ color: v ? 'var(--text)' : 'var(--text-subtle)' }}
			>
				{v ? `${v}/5 · ${RATING_LABELS[v]}` : RATING_LABELS[0]}
			</span>
		</div>
	);
}

/* ═══════════════ Navegación ═══════════════ */
export function Tabs({ tabs = [], value, variant = 'underline', onChange }) {
	const [v, setV] = useState(value ?? (tabs[0] && tabs[0].key));
	return (
		<div
			className={variant === 'segmented' ? 'at-segmented' : 'at-tabs'}
			role="tablist"
		>
			{tabs.map((t) => (
				<button
					type="button"
					key={t.key}
					role="tab"
					aria-selected={v === t.key}
					className={cx('at-tab', v === t.key && 'is-active')}
					onClick={() => {
						setV(t.key);
						onChange && onChange(t.key);
					}}
				>
					{t.label}
					{t.count != null ? (
						<span className="at-tab-count">{t.count}</span>
					) : null}
				</button>
			))}
		</div>
	);
}

export const NAV_BUYER = [
	{ key: 'explore', label: 'Explorar', icon: 'compass' },
	{ key: 'search', label: 'Buscar', icon: 'search' },
	{ key: 'favorites', label: 'Favoritos', icon: 'heart' },
	{ key: 'purchases', label: 'Compras', icon: 'ticket' },
	{ key: 'profile', label: 'Perfil', icon: 'user' }
];
export const NAV_ORGANIZER = [
	{ key: 'events', label: 'Mis eventos', icon: 'calendar' },
	{ key: 'create', label: 'Crear', icon: 'plus' },
	{ key: 'messages', label: 'Mensajes', icon: 'message' },
	{ key: 'profile', label: 'Perfil', icon: 'user' }
];

export function BottomNav({
	items = NAV_BUYER,
	active,
	dots = [],
	homeIndicator = true,
	onChange
}) {
	const [a, setA] = useState(active ?? items[0].key);
	return (
		<div>
			<nav className="at-bottomnav" role="tablist">
				{items.map((it) => (
					<button
						type="button"
						key={it.key}
						role="tab"
						aria-selected={a === it.key}
						className={cx('at-bottomnav-item', a === it.key && 'is-active')}
						onClick={() => {
							setA(it.key);
							onChange && onChange(it.key);
						}}
					>
						<span className="at-bottomnav-pill">
							<Icon
								name={it.icon}
								size={22}
								fill={
									a === it.key && it.icon === 'heart' ? 'currentColor' : 'none'
								}
							/>
							{dots.includes(it.key) ? (
								<span className="at-bottomnav-dot" />
							) : null}
						</span>
						{it.label}
					</button>
				))}
			</nav>
			{homeIndicator ? <div className="at-homebar" aria-hidden="true" /> : null}
		</div>
	);
}

export function StatusBar({ time = '21:04', light }) {
	return (
		<div
			className="at-statusbar"
			aria-hidden="true"
			style={
				light
					? {
							color: 'var(--text-on-image)',
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							zIndex: 3
						}
					: null
			}
		>
			<span>{time}</span>
			<span className="at-statusbar-icons">
				<i style={{ width: 17, height: 11 }} />
				<i style={{ width: 15, height: 11, borderRadius: 6 }} />
				<i style={{ width: 25, height: 12, borderRadius: 3.5 }} />
			</span>
		</div>
	);
}

export function AppHeader({
	title,
	subtitle,
	onBack,
	actions = [],
	variant = 'default',
	centered
}) {
	if (variant === 'large') {
		return (
			<header className="at-header-large">
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 8
					}}
				>
					<h1 className="at-t-display-lg">{title}</h1>
					<div style={{ display: 'flex' }}>
						{actions.map((a) => (
							<IconButton key={a.icon} {...a} variant="filled" />
						))}
					</div>
				</div>
				{subtitle ? (
					<div className="at-t-body at-muted" style={{ marginTop: 4 }}>
						{subtitle}
					</div>
				) : null}
			</header>
		);
	}
	return (
		<header
			className={cx(
				'at-header',
				variant === 'transparent' && 'at-header-transparent'
			)}
		>
			{onBack !== false ? (
				<IconButton
					icon="chevronLeft"
					label="Volver"
					variant={variant === 'transparent' ? 'onImage' : 'plain'}
					onPress={onBack}
					size={24}
				/>
			) : (
				<span style={{ width: 8 }} />
			)}
			<div className={cx('at-header-title', centered && 'is-centered')}>
				{variant === 'transparent' ? null : title}
				{subtitle && variant !== 'transparent' ? (
					<span className="at-header-sub">{subtitle}</span>
				) : null}
			</div>
			{actions.map((a) => (
				<IconButton
					key={a.icon}
					{...a}
					variant={variant === 'transparent' ? 'onImage' : a.variant || 'plain'}
				/>
			))}
			{centered && !actions.length ? <span style={{ width: 44 }} /> : null}
		</header>
	);
}

/* ═══════════════ Feedback ═══════════════ */
const TOAST_ICON = {
	success: 'checkCircle',
	error: 'alert',
	info: 'info',
	warning: 'alert'
};
export function Toast({ tone = 'success', title, message, action, onAction }) {
	return (
		<div
			className={cx('at-toast', `at-toast-${tone}`)}
			role={tone === 'error' ? 'alert' : 'status'}
		>
			<span className="at-toast-icon">
				<Icon name={TOAST_ICON[tone]} size={20} />
			</span>
			<div className="at-toast-body">
				<div className="at-toast-title">{title}</div>
				{message ? <div className="at-toast-msg">{message}</div> : null}
			</div>
			{action ? (
				<Button variant="ghost" size="sm" onPress={onAction}>
					{action}
				</Button>
			) : null}
		</div>
	);
}

export function Modal({
	title,
	body,
	icon,
	tone = 'info',
	confirmLabel = 'Confirmar',
	cancelLabel = 'Volver',
	destructive,
	loading,
	children
}) {
	return (
		<div
			className="at-modal"
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			{icon ? (
				<span
					className={cx(
						'at-modal-icon',
						destructive ? 'is-destructive' : 'is-info'
					)}
				>
					<Icon name={icon} size={24} />
				</span>
			) : null}
			<h2 className="at-t-title-lg">{title}</h2>
			{body ? <p className="at-t-body">{body}</p> : null}
			{children}
			<div className="at-modal-actions">
				<Button
					variant={destructive ? 'destructive' : 'primary'}
					size="lg"
					fullWidth
					loading={loading}
				>
					{confirmLabel}
				</Button>
				<Button variant="secondary" size="lg" fullWidth>
					{cancelLabel}
				</Button>
			</div>
		</div>
	);
}

export function BottomSheet({ title, children, footer, onClose }) {
	return (
		<div
			className="at-sheet"
			role="dialog"
			aria-modal="true"
			aria-label={title}
		>
			<div className="at-sheet-grabber" aria-hidden="true" />
			{title ? (
				<div className="at-sheet-head">
					<h2 className="at-t-title-lg">{title}</h2>
					<IconButton
						icon="x"
						label="Cerrar"
						variant="filled"
						onPress={onClose}
					/>
				</div>
			) : null}
			{children}
			{footer ? <div className="at-sheet-footer">{footer}</div> : null}
		</div>
	);
}

export function EmptyState({
	icon = 'ticket',
	title,
	body,
	actionLabel,
	onAction
}) {
	return (
		<div className="at-empty">
			<div className="at-empty-art" aria-hidden="true">
				<div className="at-empty-ticket">
					<Icon name={icon} size={28} />
				</div>
			</div>
			<h3 className="at-t-title-md">{title}</h3>
			{body ? <p className="at-t-body">{body}</p> : null}
			{actionLabel ? (
				<Button variant="primary" size="md" onPress={onAction}>
					{actionLabel}
				</Button>
			) : null}
		</div>
	);
}

export function Skeleton({
	width = '100%',
	height = 16,
	radius = 'var(--radius-xs)',
	style
}) {
	return (
		<span
			className="at-skel"
			style={{ width, height, borderRadius: radius, ...style }}
			aria-hidden="true"
		/>
	);
}

export function EventCardSkeleton({ variant = 'feature' }) {
	if (variant === 'compact') {
		return (
			<div
				className="at-ecard-compact"
				aria-busy="true"
				aria-label="Cargando evento"
			>
				<Skeleton width={104} height={104} radius="var(--radius-md)" />
				<div className="at-ecard-info" style={{ gap: 8, paddingTop: 6 }}>
					<Skeleton width="40%" height={12} />
					<Skeleton width="85%" height={18} />
					<Skeleton width="60%" height={12} />
					<Skeleton width="35%" height={16} style={{ marginTop: 'auto' }} />
				</div>
			</div>
		);
	}
	return (
		<div
			className="at-ecard"
			aria-busy="true"
			aria-label="Cargando evento"
			style={{ boxShadow: 'none' }}
		>
			<Skeleton
				height={undefined}
				radius="0"
				style={{ aspectRatio: '1.6', width: '100%' }}
			/>
			<div className="at-ecard-body" style={{ gap: 10 }}>
				<Skeleton width="75%" height={20} />
				<Skeleton width="55%" height={13} />
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						marginTop: 8
					}}
				>
					<Skeleton width={110} height={20} />
					<Skeleton width={70} height={16} />
				</div>
			</div>
		</div>
	);
}

/* ═══════════════ PosterArt (placeholder de imagen de evento) ═══════════════ */
const ART = {
	recitales: { bg: '#24070f', a: '#ff4d6d', b: '#ffb703', c: '#fff1d6' },
	teatro: { bg: '#1f1206', a: '#d9480f', b: '#f2b134', c: '#ffe8c2' },
	festivales: { bg: '#04261f', a: '#3ddbb4', b: '#ffd23f', c: '#ff7ab0' },
	conferencias: { bg: '#0a1626', a: '#6fb1ff', b: '#c8ff3d', c: '#e9f0ff' },
	deportes: { bg: '#0a1f0e', a: '#c8ff3d', b: '#ffffff', c: '#2fbf71' }
};
function rng(seed) {
	let s = seed * 9301 + 49297;
	return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}
export function PosterArt({ category = 'recitales', seed = 1, label }) {
	const p = ART[category] || ART.recitales;
	const r = rng(seed);
	const W = 320,
		H = 200;
	let shapes;
	if (category === 'recitales') {
		const n = 5;
		shapes = [];
		for (let i = 0; i < n; i++) {
			const x = 30 + i * 65 + r() * 20;
			const spread = 40 + r() * 50;
			shapes.push(
				<polygon
					key={'b' + i}
					points={`${x},-10 ${x - spread},${H} ${x + spread},${H}`}
					fill={i % 2 ? p.a : p.b}
					opacity={0.22 + r() * 0.2}
				/>
			);
		}
		shapes.push(
			<circle
				key="sun"
				cx={W * (0.3 + r() * 0.4)}
				cy={H * 0.45}
				r={34 + r() * 14}
				fill={p.a}
			/>
		);
		for (let i = 0; i < 14; i++) {
			const x = (i / 13) * W;
			const h = 30 + r() * 30;
			shapes.push(
				<ellipse
					key={'h' + i}
					cx={x}
					cy={H + 6}
					rx={16}
					ry={h}
					fill="#0b0b10"
				/>
			);
		}
	} else if (category === 'teatro') {
		shapes = [<rect key="bg2" x={0} y={0} width={W} height={H} fill={p.bg} />];
		for (let i = 0; i < 7; i++)
			shapes.push(
				<path
					key={'c' + i}
					d={`M${i * 22} 0 Q ${i * 22 + 10} ${H * 0.6} ${i * 18} ${H}`}
					stroke={i % 2 ? p.a : p.b}
					strokeWidth={12}
					fill="none"
					opacity={0.85}
				/>
			);
		for (let i = 0; i < 7; i++)
			shapes.push(
				<path
					key={'d' + i}
					d={`M${W - i * 22} 0 Q ${W - i * 22 - 10} ${H * 0.6} ${W - i * 18} ${H}`}
					stroke={i % 2 ? p.a : p.b}
					strokeWidth={12}
					fill="none"
					opacity={0.85}
				/>
			);
		shapes.push(
			<ellipse
				key="spot"
				cx={W / 2}
				cy={H * 0.78}
				rx={70 + r() * 20}
				ry={16}
				fill={p.c}
				opacity={0.5}
			/>
		);
		shapes.push(
			<circle key="head" cx={W / 2} cy={H * 0.42} r={14} fill="#0b0b10" />
		);
		shapes.push(
			<path
				key="body"
				d={`M${W / 2 - 22} ${H * 0.8} Q ${W / 2} ${H * 0.45} ${W / 2 + 22} ${H * 0.8}z`}
				fill="#0b0b10"
			/>
		);
	} else if (category === 'festivales') {
		shapes = [
			<circle
				key="sun"
				cx={W * (0.55 + r() * 0.25)}
				cy={H * 0.42}
				r={46}
				fill={p.b}
			/>
		];
		shapes.push(
			<path
				key="h1"
				d={`M0 ${H * 0.7} Q ${W * 0.3} ${H * 0.45} ${W * 0.6} ${H * 0.68} T ${W} ${H * 0.62} V ${H} H 0z`}
				fill={p.a}
			/>
		);
		shapes.push(
			<path
				key="h2"
				d={`M0 ${H * 0.85} Q ${W * 0.4} ${H * 0.65} ${W} ${H * 0.86} V ${H} H 0z`}
				fill="#0b2f27"
			/>
		);
		for (let i = 0; i < 9; i++) {
			const x = 20 + r() * (W - 40),
				y = 20 + r() * 50;
			shapes.push(
				<circle key={'s' + i} cx={x} cy={y} r={1.5 + r() * 2} fill={p.c} />
			);
		}
		for (let i = 0; i < 3; i++) {
			const x = 40 + i * 110 + r() * 30;
			shapes.push(
				<polygon
					key={'t' + i}
					points={`${x},${H * 0.62} ${x - 22},${H * 0.86} ${x + 22},${H * 0.86}`}
					fill={p.c}
					opacity={0.9}
				/>
			);
		}
	} else if (category === 'conferencias') {
		shapes = [];
		for (let i = 0; i <= 10; i++)
			shapes.push(
				<line
					key={'v' + i}
					x1={i * 32}
					y1={0}
					x2={i * 32}
					y2={H}
					stroke={p.a}
					strokeOpacity={0.18}
				/>
			);
		for (let i = 0; i <= 7; i++)
			shapes.push(
				<line
					key={'h' + i}
					x1={0}
					y1={i * 32}
					x2={W}
					y2={i * 32}
					stroke={p.a}
					strokeOpacity={0.18}
				/>
			);
		shapes.push(
			<rect
				key="scr"
				x={W * 0.18}
				y={H * 0.18}
				width={W * 0.64}
				height={H * 0.46}
				rx={6}
				fill={p.a}
				opacity={0.9}
			/>
		);
		shapes.push(
			<rect
				key="bar1"
				x={W * 0.24}
				y={H * 0.3}
				width={W * 0.3}
				height={10}
				rx={5}
				fill={p.c}
			/>
		);
		shapes.push(
			<rect
				key="bar2"
				x={W * 0.24}
				y={H * 0.42}
				width={W * 0.44}
				height={10}
				rx={5}
				fill={p.b}
			/>
		);
		for (let i = 0; i < 9; i++)
			shapes.push(
				<circle
					key={'p' + i}
					cx={W * 0.12 + i * 30}
					cy={H * 0.9}
					r={12}
					fill="#0b0b10"
					stroke={p.a}
					strokeOpacity={0.4}
				/>
			);
	} else {
		shapes = [<rect key="f" x={0} y={0} width={W} height={H} fill={p.bg} />];
		for (let i = 0; i < 6; i++)
			shapes.push(
				<rect
					key={'st' + i}
					x={i * (W / 6)}
					y={0}
					width={W / 12}
					height={H}
					fill={p.c}
					opacity={0.12}
				/>
			);
		shapes.push(
			<rect
				key="ln"
				x={20}
				y={20}
				width={W - 40}
				height={H - 40}
				fill="none"
				stroke={p.b}
				strokeOpacity={0.7}
				strokeWidth={2}
			/>
		);
		shapes.push(
			<line
				key="mid"
				x1={W / 2}
				y1={20}
				x2={W / 2}
				y2={H - 20}
				stroke={p.b}
				strokeOpacity={0.7}
				strokeWidth={2}
			/>
		);
		shapes.push(
			<circle
				key="cc"
				cx={W / 2}
				cy={H / 2}
				r={30}
				fill="none"
				stroke={p.b}
				strokeOpacity={0.7}
				strokeWidth={2}
			/>
		);
		shapes.push(
			<circle
				key="ball"
				cx={W * (0.3 + r() * 0.4)}
				cy={H * (0.3 + r() * 0.4)}
				r={12}
				fill={p.a}
			/>
		);
	}
	return (
		<svg
			className="at-poster"
			viewBox={`0 0 ${W} ${H}`}
			preserveAspectRatio="xMidYMid slice"
			role={label ? 'img' : undefined}
			aria-label={label}
			aria-hidden={label ? undefined : 'true'}
		>
			<rect width={W} height={H} fill={p.bg} />
			{shapes}
		</svg>
	);
}

/* ═══════════════ Dominio ═══════════════ */
export function DateBlock({ day, month }) {
	return (
		<span className="at-dateblock">
			<span className="at-dateblock-day">{day}</span>
			<span className="at-dateblock-month">{month}</span>
		</span>
	);
}

export function EventCard({
	event,
	variant = 'feature',
	favorite: fav0,
	onPress,
	onToggleFavorite,
	width
}) {
	const [fav, setFav] = useState(!!fav0);
	const e = event;
	const cat = catOf(e.category);
	const toggle = (ev) => {
		ev.stopPropagation();
		setFav(!fav);
		onToggleFavorite && onToggleFavorite(!fav);
	};
	const favBtn = (
		<span onClick={toggle}>
			<IconButton
				icon="heart"
				label={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
				variant="onImage"
				active={fav}
			/>
		</span>
	);
	if (variant === 'compact') {
		return (
			<div
				className={cx('at-ecard-compact', e.past && 'is-muted')}
				role="button"
				tabIndex={0}
				onClick={onPress}
				aria-label={`${e.name}, ${e.dateLabel}`}
			>
				<div className="at-ecard-thumb">
					<PosterArt category={e.category} seed={e.seed} />
					{favBtn}
				</div>
				<div className="at-ecard-info">
					<span className="at-t-overline at-overline-accent">
						{cat.label} · {e.dayMonth}
					</span>
					<h3 className="at-t-title-sm">{e.name}</h3>
					<span className="at-meta">
						<Icon name="mapPin" size={14} />
						<span>{e.venue}</span>
					</span>
					<div className="at-ecard-row">
						<span>
							{e.soldOut ? (
								<Tag tone="soldout">Agotado</Tag>
							) : (
								<span className="at-t-price">
									{formatPriceFrom(e.minPrice, e.maxPrice)}
								</span>
							)}
						</span>
						<Rating value={e.orgRating} compact size={14} />
					</div>
				</div>
			</div>
		);
	}
	return (
		<div
			className={cx('at-ecard', e.past && 'is-muted')}
			style={width ? { width } : null}
			role="button"
			tabIndex={0}
			onClick={onPress}
			aria-label={`${e.name}, ${e.dateLabel}, ${formatPriceFrom(e.minPrice, e.maxPrice)}`}
		>
			<div className="at-ecard-media">
				<PosterArt category={e.category} seed={e.seed} />
				<DateBlock day={e.day} month={e.month} />
				{e.lowStock ? (
					<span className="at-ecard-flag">
						<Tag tone="hot" icon="sparkle">
							Últimas entradas
						</Tag>
					</span>
				) : null}
				{e.soldOut ? (
					<span className="at-ecard-flag">
						<Tag tone="soldout">Agotado</Tag>
					</span>
				) : null}
				<span className="at-ecard-fav">{favBtn}</span>
				<span className="at-ecard-cat at-t-overline">
					<Icon name={cat.icon} size={14} />
					{cat.label}
				</span>
			</div>
			<div className="at-ecard-body">
				<h3 className="at-t-title-md">{e.name}</h3>
				<span className="at-meta">
					<Icon name="mapPin" size={14} />
					<span>{e.venue}</span>
					<span aria-hidden="true">·</span>
					<span>{e.time}</span>
				</span>
				<div className="at-ecard-foot">
					<div>
						{e.minPrice !== e.maxPrice ? (
							<span className="at-price-from">Desde</span>
						) : null}
						<span className="at-t-price">{formatPrice(e.minPrice)}</span>
					</div>
					<div className="at-org">
						<Rating
							value={e.orgRating}
							count={e.orgReviews}
							compact
							size={14}
						/>
						<span className="at-org-name">{e.organizer}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export function TicketTypeRow({
	name,
	description,
	price,
	remaining,
	capacity,
	maxPerPurchase = 6,
	quantity = 0,
	interactive = true,
	onChange
}) {
	const [q, setQ] = useState(quantity);
	const soldOut = remaining <= 0;
	const low = !soldOut && (remaining <= 20 || remaining / capacity <= 0.1);
	const max = Math.min(maxPerPurchase, remaining);
	return (
		<div
			className={cx(
				'at-ttrow',
				q > 0 && 'is-selected',
				soldOut && 'is-soldout'
			)}
		>
			<div className="at-ttrow-main">
				<div className="at-ttrow-top">
					<h4 className="at-t-title-sm">{name}</h4>
					{soldOut ? <Tag tone="soldout">Agotado</Tag> : null}
				</div>
				{description ? (
					<p className="at-t-body-sm at-muted">{description}</p>
				) : null}
				<div className="at-ttrow-price">
					<span className={cx('at-t-price', soldOut && 'at-strike')}>
						{formatPrice(price)}
					</span>
					{soldOut ? (
						<span className="at-ttrow-stock">Sin cupo</span>
					) : (
						<span className={cx('at-ttrow-stock', low && 'is-low')}>
							{low
								? remaining === 1
									? '¡Queda 1!'
									: `¡Quedan ${remaining}!`
								: `Quedan ${formatCount(remaining)}`}
						</span>
					)}
				</div>
			</div>
			{interactive && !soldOut ? (
				<QuantityStepper
					value={q}
					max={max}
					onChange={(v) => {
						setQ(v);
						onChange && onChange(v);
					}}
				/>
			) : null}
		</div>
	);
}

function Perforation() {
	return (
		<div className="at-perf" aria-hidden="true">
			<span className="at-perf-notch is-l" />
			<span className="at-perf-notch is-r" />
		</div>
	);
}

export function PurchaseCard({ purchase, onPress, actions }) {
	const p = purchase;
	const muted = p.status === 'CANCELADA' || p.status === 'REEMBOLSADA';
	return (
		<div
			className={cx('at-ticket at-pcard', muted && 'is-muted')}
			role="button"
			tabIndex={0}
			onClick={onPress}
			aria-label={`${p.event}, ${STATUS[p.status].label}`}
		>
			<div className="at-pcard-top">
				<div className="at-pcard-thumb">
					<PosterArt category={p.category} seed={p.seed} />
				</div>
				<div className="at-pcard-info">
					<h3 className="at-t-title-sm">{p.event}</h3>
					<span className="at-meta">
						<Icon name="calendar" size={14} />
						<span>{p.dateLabel}</span>
					</span>
					<span className="at-meta">
						<Icon name="mapPin" size={14} />
						<span>{p.venue}</span>
					</span>
				</div>
			</div>
			<Perforation />
			<div className="at-pcard-stub">
				<div className="at-pcard-stub-l">
					<span className="at-t-body-sm at-muted">
						{p.quantity} × {p.ticketType}
					</span>
					<span className="at-t-price">{formatPrice(p.total)}</span>
				</div>
				<div className="at-pcard-stub-r">
					<StatusBadge status={p.status} />
					{p.status === 'CONFIRMADA' && p.daysLeft != null ? (
						<span className="at-countdown">
							{p.daysLeft > 1 ? (
								<>
									Faltan <b>{p.daysLeft}</b> días
								</>
							) : (
								formatDaysLeft(p.daysLeft)
							)}
						</span>
					) : null}
					{p.status === 'PENDIENTE' && p.expires ? (
						<span
							className="at-t-caption"
							style={{ color: 'var(--status-pending)' }}
						>
							Pagá antes de las {p.expires}
						</span>
					) : null}
					{p.status === 'UTILIZADA' && p.canReview ? (
						<span
							className="at-t-caption"
							style={{ color: 'var(--primary-text)' }}
						>
							Dejá tu reseña
						</span>
					) : null}
				</div>
			</div>
			{actions ? <div className="at-pcard-actions">{actions}</div> : null}
		</div>
	);
}

export function OrganizerPurchaseRow({
	buyer,
	ticketType,
	quantity,
	total,
	status,
	dateLabel,
	unread = 0,
	onPress
}) {
	return (
		<button
			type="button"
			className="at-orow"
			onClick={onPress}
			aria-label={`${buyer}, ${quantity} ${ticketType}, ${STATUS[status].label}${unread ? `, ${unread} mensajes sin leer` : ''}`}
		>
			<Avatar name={buyer} size={40} />
			<div className="at-orow-main">
				<span className="at-orow-name">
					<b>{buyer}</b>
					{unread ? (
						<span className="at-orow-unread">
							<Icon name="message" size={12} strokeWidth={2.6} />
							{unread}
						</span>
					) : null}
				</span>
				<span className="at-t-body-sm at-muted">
					{quantity} × {ticketType} ·{' '}
					<span className="at-num">{formatPrice(total)}</span>
				</span>
				{dateLabel ? (
					<span className="at-t-caption at-subtle">{dateLabel}</span>
				) : null}
			</div>
			<div className="at-orow-right">
				<StatusBadge status={status} size="sm" />
			</div>
			<Icon
				name="chevronRight"
				size={20}
				style={{ color: 'var(--text-subtle)' }}
			/>
		</button>
	);
}

export function ProgressBar({ value, max, label }) {
	const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
	return (
		<div
			className={cx('at-bar', pct >= 100 ? 'is-full' : pct >= 90 && 'is-high')}
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-label={label}
		>
			<i style={{ width: pct + '%' }} />
		</div>
	);
}

export function AvailabilitySummary({ types = [], title = 'Disponibilidad' }) {
	const sold = types.reduce((a, t) => a + t.sold, 0),
		cap = types.reduce((a, t) => a + t.capacity, 0);
	return (
		<section className="at-avail">
			<div className="at-avail-head">
				<div>
					<div className="at-t-overline at-subtle">{title}</div>
					<div className="at-t-title-lg at-num">
						{formatCount(sold)}
						<span className="at-t-body at-muted">
							{' '}
							/ {formatCount(cap)} vendidas
						</span>
					</div>
				</div>
				<span
					className="at-t-label-sm"
					style={{ color: 'var(--primary-text)' }}
				>
					{Math.round((sold / cap) * 100)} %
				</span>
			</div>
			{types.map((t) => {
				const left = t.capacity - t.sold;
				const pct = t.sold / t.capacity;
				return (
					<div className="at-avail-item" key={t.name}>
						<div className="at-avail-line">
							<span className="at-t-body-strong">{t.name}</span>
							<span className="at-t-body-sm at-muted at-num">
								{formatCount(t.sold)} / {formatCount(t.capacity)}
							</span>
						</div>
						<ProgressBar
							value={t.sold}
							max={t.capacity}
							label={`${t.name}: ${t.sold} de ${t.capacity} vendidas`}
						/>
						<span className={cx('at-avail-left', pct >= 0.9 && 'is-high')}>
							{left <= 0
								? 'Agotado'
								: left === 1
									? 'Queda 1'
									: `Quedan ${formatCount(left)}`}
							{t.price != null ? ` · ${formatPrice(t.price)}` : ''}
						</span>
					</div>
				);
			})}
		</section>
	);
}

export function ChatBubble({ own, text, time, author, read, system, status }) {
	if (system) {
		return (
			<div className="at-bubble-system" role="note">
				{status ? (
					<Icon
						name={STATUS[status].icon}
						size={14}
						style={{
							color: `var(--status-${{ PENDIENTE: 'pending', CONFIRMADA: 'confirmed', UTILIZADA: 'used', CANCELADA: 'cancelled', REEMBOLSADA: 'refunded' }[status]})`
						}}
					/>
				) : null}
				{text}
				{time ? <span className="at-subtle">· {time}</span> : null}
			</div>
		);
	}
	return (
		<div className={cx('at-bubble-wrap', own ? 'is-own' : 'is-other')}>
			{author && !own ? (
				<span className="at-bubble-author">{author}</span>
			) : null}
			<div className="at-bubble">{text}</div>
			<span className="at-bubble-time">
				{time}
				{own ? (
					<Icon
						name={read ? 'checks' : 'check'}
						size={14}
						style={{
							color: read ? 'var(--primary-text)' : 'var(--text-subtle)'
						}}
						title={read ? 'Leído' : 'Enviado'}
					/>
				) : null}
			</span>
		</div>
	);
}

export function MessageComposer({
	value = '',
	placeholder = 'Escribí un mensaje…',
	locked,
	lockedReason = 'El chat se cerró porque la compra fue reembolsada.'
}) {
	const [v, setV] = useState(value);
	if (locked)
		return (
			<div className="at-composer-locked">
				<Icon name="lock" size={16} />
				{lockedReason}
			</div>
		);
	return (
		<div className="at-composer">
			<label className="at-composer-box">
				<span className="at-sr">Mensaje</span>
				<textarea
					rows={1}
					value={v}
					placeholder={placeholder}
					onChange={(e) => setV(e.target.value)}
				/>
			</label>
			<button
				type="button"
				className="at-composer-send"
				aria-label="Enviar mensaje"
				disabled={!v.trim()}
			>
				<Icon name="send" size={20} />
			</button>
		</div>
	);
}

export function ReviewCard({ user, rating, comment, dateLabel, ticketType }) {
	return (
		<article className="at-review">
			<div className="at-review-head">
				<Avatar name={user} size={32} />
				<div className="at-review-who">
					<b className="at-t-body-strong">{user}</b>
					<span className="at-t-caption at-subtle">{dateLabel}</span>
				</div>
				<Rating value={rating} size={14} showValue={false} />
			</div>
			<p className="at-t-body">{comment}</p>
			{ticketType ? (
				<span className="at-review-tag">
					<Icon name="ticketCheck" size={14} />
					Asistió con {ticketType}
				</span>
			) : null}
		</article>
	);
}

export function StatusTimeline({ events = [] }) {
	return (
		<ol className="at-timeline">
			{events.map((e, i) => {
				const s = STATUS[e.status];
				const current = i === events.length - 1;
				return (
					<li
						key={i}
						className={cx('at-tl-item', current && 'is-current')}
						aria-current={current ? 'step' : undefined}
					>
						<span
							className={cx('at-tl-node', 's-' + e.status)}
							style={{ color: undefined }}
						>
							<Icon name={s.icon} size={16} strokeWidth={2.4} />
						</span>
						<div className="at-tl-body">
							<b className="at-t-body-strong">{s.label}</b>
							<span className="at-t-body-sm at-muted">
								{e.dateLabel}
								{e.by ? ` · ${e.by}` : ''}
							</span>
							{e.note ? (
								<span className="at-t-body-sm at-subtle">{e.note}</span>
							) : null}
						</div>
					</li>
				);
			})}
		</ol>
	);
}

export function TicketTypeForm({
	index = 1,
	value = {},
	errors = {},
	removable = true,
	onRemove
}) {
	return (
		<fieldset className="at-ttform" style={{ border: 0, margin: 0 }}>
			<div className="at-ttform-head">
				<span className="at-ttform-num">{index}</span>
				<h4 className="at-t-title-sm">Tipo de entrada {index}</h4>
				{removable ? (
					<IconButton
						icon="trash"
						label={`Eliminar tipo de entrada ${index}`}
						onPress={onRemove}
						size={20}
					/>
				) : null}
			</div>
			<TextField
				label="Nombre"
				required
				value={value.name}
				placeholder="General, Platea, VIP…"
				error={errors.name}
			/>
			<TextField
				label="Descripción"
				value={value.description}
				placeholder="Qué incluye, ubicación, acceso…"
				multiline
				maxLength={140}
			/>
			<div className="at-ttform-grid">
				<TextField
					label="Precio"
					required
					prefix="$"
					value={value.price}
					placeholder="0"
					keyboardType="numeric"
					error={errors.price}
					helper={errors.price ? null : '0 = gratis'}
				/>
				<TextField
					label="Cupo"
					required
					value={value.capacity}
					placeholder="0"
					suffix="u."
					keyboardType="numeric"
					error={errors.capacity}
				/>
			</div>
		</fieldset>
	);
}

export function AddTicketTypeButton({ onPress }) {
	return (
		<button
			type="button"
			className="at-add-dashed at-focusable"
			onClick={onPress}
		>
			<Icon name="plus" size={20} />
			Agregar tipo de entrada
		</button>
	);
}

export { Icon, iconNames, format, Perforation };
