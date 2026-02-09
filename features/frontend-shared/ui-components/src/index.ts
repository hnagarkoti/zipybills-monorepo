/**
 * @zipybills/ui-components – shadcn-rn pattern
 *
 * Reusable NativeWind components for all FactoryOS frontends.
 */

// ─── Utilities ───────────────────────────────
export { cn } from './cn';

// ─── Core Components ─────────────────────────
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardProps } from './Card';
export { Input, type InputProps } from './Input';
export { Typography, Text, type TextProps, type TextVariant } from './Text';
export { Loading, type LoadingProps } from './Loading';

// ─── Feedback ────────────────────────────────
export { Alert, type AlertProps, type AlertVariant } from './Alert';
export { Badge, type BadgeProps, type BadgeVariant } from './Badge';

// ─── Data Display ────────────────────────────
export { Avatar, type AvatarProps } from './Avatar';
export { StatCard, type StatCardProps, type StatCardColor } from './StatCard';
export { ProgressBar, type ProgressBarProps } from './ProgressBar';
export { StatusDot, type StatusDotProps, type StatusDotColor } from './StatusDot';

// ─── Layout ──────────────────────────────────
export { Divider } from './Divider';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { IconButton, type IconButtonProps } from './IconButton';
export { PageHeader, type PageHeaderProps } from './PageHeader';

// ─── Error Handling & Status Pages ───────────
export { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary';
export { NotFoundPage, type NotFoundPageProps } from './NotFoundPage';
export { ServerErrorPage, type ServerErrorPageProps } from './ServerErrorPage';
