import type * as React from 'react';

/** Estados de compra del dominio (CambioEstadoCompra.estado). */
export type PurchaseStatus = 'PENDIENTE' | 'CONFIRMADA' | 'UTILIZADA' | 'CANCELADA' | 'REEMBOLSADA';
export type CategoryKey = 'todo' | 'recitales' | 'teatro' | 'festivales' | 'conferencias' | 'deportes';
export type IconName = 'search' | 'heart' | 'calendar' | 'mapPin' | 'star' | 'clock' | 'hourglass' | 'checkCircle' | 'xCircle' | 'check' | 'checks' | 'ticket' | 'ticketCheck' | 'undo' | 'chevronLeft' | 'chevronRight' | 'chevronDown' | 'plus' | 'minus' | 'home' | 'compass' | 'user' | 'message' | 'send' | 'sliders' | 'sort' | 'bell' | 'x' | 'alert' | 'info' | 'image' | 'trash' | 'upload' | 'music' | 'theater' | 'festival' | 'mic' | 'trophy' | 'grid' | 'lock' | 'card' | 'edit' | 'more' | 'qr' | 'share' | 'barChart' | 'sparkle' | 'eye' | 'eyeOff' | 'mail';

export interface IconProps { name: IconName; size?: 16 | 20 | 24 | number; color?: string; fill?: string; strokeWidth?: number; title?: string }
export declare function Icon(props: IconProps): React.ReactElement;

export interface ButtonProps {
  /** primary: la acción principal (1 por pantalla) · secondary: alternativa · ghost: terciaria/links · destructive: cancelar compra, eliminar */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  /** sm 36 (con hitSlop a 44) · md 44 · lg 52 (CTA inferior) */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Reemplaza el label por un spinner, mantiene el ancho y bloquea onPress. */
  loading?: boolean;
  /** Solo para documentar el estado presionado. */
  pressed?: boolean;
  icon?: IconName; iconRight?: IconName;
  fullWidth?: boolean;
  /** Sombra glow-primary: solo el CTA fijo de detalle/checkout. */
  glow?: boolean;
  accessibilityLabel?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface IconButtonProps { icon: IconName; /** Obligatorio: es el accessibilityLabel. */ label: string; variant?: 'plain' | 'filled' | 'onImage'; active?: boolean; badge?: string | number; size?: number; onPress?: () => void }
export declare function IconButton(props: IconButtonProps): React.ReactElement;

export interface TextFieldProps { label?: string; value?: string; placeholder?: string; helper?: string; error?: string; prefix?: React.ReactNode; suffix?: React.ReactNode; multiline?: boolean; disabled?: boolean; focused?: boolean; /** Sin required el label muestra "(opcional)". */ required?: boolean; maxLength?: number; keyboardType?: 'default' | 'numeric' | 'email-address'; /** Contraseña con botón mostrar/ocultar. */ secureTextEntry?: boolean; autoComplete?: string; onChangeText?: (v: string) => void }
export declare function TextField(props: TextFieldProps): React.ReactElement;

export interface SearchBarProps { value?: string; placeholder?: string; focused?: boolean; filterCount?: number; showFilter?: boolean; onFilterPress?: () => void }
export declare function SearchBar(props: SearchBarProps): React.ReactElement;

export interface SelectOption { value: string; label: string; icon?: IconName }
export interface SelectProps { label?: string; value?: string; placeholder?: string; options: SelectOption[]; open?: boolean; error?: string; helper?: string; required?: boolean; onChange?: (value: string) => void }
export declare function Select(props: SelectProps): React.ReactElement;

export interface QuantityStepperProps { value?: number; min?: number; /** min(cupo restante, máximo por compra). "+" se deshabilita al llegar. */ max: number; showHint?: boolean; label?: string; onChange?: (v: number) => void }
export declare function QuantityStepper(props: QuantityStepperProps): React.ReactElement;

export interface CheckboxProps { checked?: boolean; label: React.ReactNode; error?: string; disabled?: boolean; onChange?: (v: boolean) => void }
export declare function Checkbox(props: CheckboxProps): React.ReactElement;
export interface ChoiceCardProps { icon: IconName; title: string; description?: string; selected?: boolean; onPress?: () => void }
export declare function ChoiceCard(props: ChoiceCardProps): React.ReactElement;
export declare function RoleSelector(props: { value?: 'buyer' | 'organizer'; onChange?: (v: 'buyer' | 'organizer') => void }): React.ReactElement;

export interface ChipProps { label: string; icon?: IconName; selected?: boolean; variant?: 'category' | 'filter'; removable?: boolean; count?: number; onPress?: () => void }
export declare function Chip(props: ChipProps): React.ReactElement;
export interface CategoryChipsProps { value?: CategoryKey; categories?: { key: CategoryKey; label: string; icon: IconName }[]; onChange?: (k: CategoryKey) => void }
export declare function CategoryChips(props: CategoryChipsProps): React.ReactElement;

export type SortValue = 'date' | 'price_asc' | 'price_desc' | 'rating';
export interface SortSelectorProps { value?: SortValue; options?: { value: SortValue; label: string; short: string }[]; onPress?: () => void }
export declare function SortSelector(props: SortSelectorProps): React.ReactElement;
export interface SortOptionsProps { value?: SortValue; onChange?: (v: SortValue) => void }
export declare function SortOptions(props: SortOptionsProps): React.ReactElement;

export interface StatusBadgeProps { status: PurchaseStatus; size?: 'sm' | 'md'; /** Solo CONFIRMADA: agrega "· faltan X días". */ daysLeft?: number; short?: boolean }
export declare function StatusBadge(props: StatusBadgeProps): React.ReactElement;
export interface TagProps { tone?: 'hot' | 'soldout' | 'brand'; icon?: IconName; children: React.ReactNode }
export declare function Tag(props: TagProps): React.ReactElement;

export interface AvatarProps { name: string; size?: 32 | 40 | 64 | number }
export declare function Avatar(props: AvatarProps): React.ReactElement;

export interface RatingProps { /** 0–5, se muestra con coma decimal (4,6). */ value: number; count?: number; size?: number; showValue?: boolean; compact?: boolean }
export declare function Rating(props: RatingProps): React.ReactElement;
export interface RatingInputProps { value?: 0 | 1 | 2 | 3 | 4 | 5; onChange?: (v: number) => void }
export declare function RatingInput(props: RatingInputProps): React.ReactElement;

export interface TabsProps { tabs: { key: string; label: string; count?: number }[]; value?: string; variant?: 'underline' | 'segmented'; onChange?: (k: string) => void }
export declare function Tabs(props: TabsProps): React.ReactElement;

export interface NavItem { key: string; label: string; icon: IconName }
export interface BottomNavProps { items?: NavItem[]; active?: string; /** keys con punto de novedad (compras/mensajes). */ dots?: string[]; homeIndicator?: boolean; onChange?: (k: string) => void }
export declare function BottomNav(props: BottomNavProps): React.ReactElement;

export interface AppHeaderProps { title?: string; subtitle?: string; onBack?: (() => void) | false; actions?: IconButtonProps[]; variant?: 'default' | 'large' | 'transparent'; centered?: boolean }
export declare function AppHeader(props: AppHeaderProps): React.ReactElement;

export interface ToastProps { tone?: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string; action?: string; onAction?: () => void }
export declare function Toast(props: ToastProps): React.ReactElement;

export interface ModalProps { title: string; body?: string; icon?: IconName; destructive?: boolean; loading?: boolean; confirmLabel?: string; cancelLabel?: string; children?: React.ReactNode }
export declare function Modal(props: ModalProps): React.ReactElement;

export interface BottomSheetProps { title?: string; footer?: React.ReactNode[]; onClose?: () => void; children?: React.ReactNode }
export declare function BottomSheet(props: BottomSheetProps): React.ReactElement;

export interface EmptyStateProps { icon?: IconName; title: string; body?: string; actionLabel?: string; onAction?: () => void }
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

export interface SkeletonProps { width?: number | string; height?: number; radius?: string }
export declare function Skeleton(props: SkeletonProps): React.ReactElement;
export declare function EventCardSkeleton(props: { variant?: 'feature' | 'compact' }): React.ReactElement;

/** Placeholder de imagen de evento para diseño. En la app: <Image> con la multimedia real del Evento. */
export declare function PosterArt(props: { category?: CategoryKey; seed?: number; label?: string }): React.ReactElement;

export interface EventSummary { name: string; category: CategoryKey; day: string; month: string; dayMonth: string; time: string; dateLabel: string; venue: string; minPrice: number; maxPrice: number; orgRating: number; orgReviews?: number; organizer: string; seed?: number; lowStock?: boolean; soldOut?: boolean; past?: boolean }
export interface EventCardProps { event: EventSummary; variant?: 'feature' | 'compact'; favorite?: boolean; width?: number; onPress?: () => void; onToggleFavorite?: (fav: boolean) => void }
export declare function EventCard(props: EventCardProps): React.ReactElement;
export declare function DateBlock(props: { day: string; month: string }): React.ReactElement;

export interface TicketTypeRowProps { name: string; description?: string; price: number; remaining: number; capacity: number; maxPerPurchase?: number; quantity?: number; /** false en el detalle del evento (sin stepper). */ interactive?: boolean; onChange?: (q: number) => void }
export declare function TicketTypeRow(props: TicketTypeRowProps): React.ReactElement;

export interface PurchaseSummary { id: string; event: string; category: CategoryKey; seed?: number; dateLabel: string; venue: string; ticketType: string; quantity: number; total: number; status: PurchaseStatus; daysLeft?: number; expires?: string; canReview?: boolean }
export interface PurchaseCardProps { purchase: PurchaseSummary; actions?: React.ReactNode[]; onPress?: () => void }
export declare function PurchaseCard(props: PurchaseCardProps): React.ReactElement;

export interface OrganizerPurchaseRowProps { buyer: string; ticketType: string; quantity: number; total: number; status: PurchaseStatus; dateLabel?: string; unread?: number; onPress?: () => void }
export declare function OrganizerPurchaseRow(props: OrganizerPurchaseRowProps): React.ReactElement;

export interface AvailabilitySummaryProps { title?: string; types: { name: string; sold: number; capacity: number; price?: number }[] }
export declare function AvailabilitySummary(props: AvailabilitySummaryProps): React.ReactElement;
export declare function ProgressBar(props: { value: number; max: number; label: string }): React.ReactElement;

export interface ChatBubbleProps { own?: boolean; text: string; time?: string; author?: string; read?: boolean; /** Mensaje de sistema centrado (cambio de estado). */ system?: boolean; status?: PurchaseStatus }
export declare function ChatBubble(props: ChatBubbleProps): React.ReactElement;
export interface MessageComposerProps { value?: string; placeholder?: string; locked?: boolean; lockedReason?: string }
export declare function MessageComposer(props: MessageComposerProps): React.ReactElement;

export interface ReviewCardProps { user: string; rating: number; comment: string; dateLabel: string; ticketType?: string }
export declare function ReviewCard(props: ReviewCardProps): React.ReactElement;

export interface StatusTimelineProps { events: { status: PurchaseStatus; dateLabel: string; by?: string; note?: string }[] }
export declare function StatusTimeline(props: StatusTimelineProps): React.ReactElement;

export interface TicketTypeFormProps { index?: number; value?: { name?: string; description?: string; price?: string; capacity?: string }; errors?: { name?: string; price?: string; capacity?: string }; removable?: boolean; onRemove?: () => void }
export declare function TicketTypeForm(props: TicketTypeFormProps): React.ReactElement;
export declare function AddTicketTypeButton(props: { onPress?: () => void }): React.ReactElement;

export declare const format: {
  formatPrice(v: number, o?: { free?: string | false }): string;
  formatPriceFrom(min: number, max?: number): string;
  formatPriceRange(min: number, max: number): string;
  formatDate(d: Date | string | number, style?: 'short' | 'long' | 'day' | 'numeric' | 'time'): string;
  daysUntil(d: Date | string | number, now?: Date): number;
  formatDaysLeft(n: number): string;
  formatRating(v: number): string;
  formatCount(n: number): string;
  formatTickets(n: number): string;
};

declare global { interface Window { AITicket: typeof import('./index') } }
