/**
 * Shared UI Components - Barrel Export
 * Import tất cả components từ file này
 * 
 * @example
 * import { Button, Badge, Input, Card, Skeleton } from '@/shared/ui';
 */

// Basic UI Kit - Phase 1
export { Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { Badge } from './Badge';
export type { BadgeStatus } from './Badge';

export { Input } from './Input';

export { Card } from './Card';
export type { CardVariant } from './Card';

// Phase 2 - Loading States
export { Skeleton, SkeletonCard, SkeletonTable } from './Skeleton';
export type { SkeletonVariant } from './Skeleton';

// Existing Components
export { default as MainLayout } from './MainLayout';
export { default as SplitLayout } from './SplitLayout';
export { default as ContractPreview } from './ContractPreview';
export { dashboardStyles } from './dashboardStyles';
