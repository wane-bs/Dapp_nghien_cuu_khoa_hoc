import React from 'react';

/**
 * Skeleton Loading Component - Phase 2 UI Kit
 * Thay thế "Đang tải..." bằng skeleton animation
 * 
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="card" height={150} />
 * <Skeleton variant="avatar" />
 */

export type SkeletonVariant = 'text' | 'text-sm' | 'avatar' | 'card' | 'button' | 'custom';

interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    count?: number;
    className?: string;
    style?: React.CSSProperties;
}

const getVariantStyles = (variant: SkeletonVariant): React.CSSProperties => {
    const styles: Record<SkeletonVariant, React.CSSProperties> = {
        text: {
            height: '1em',
            width: '100%',
            marginBottom: '0.5em',
        },
        'text-sm': {
            height: '0.8em',
            width: '60%',
            marginBottom: '0.4em',
        },
        avatar: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
        },
        card: {
            width: '100%',
            height: '150px',
            borderRadius: 'var(--radius-md)',
        },
        button: {
            width: '100px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
        },
        custom: {},
    };
    return styles[variant];
};

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    count = 1,
    className = '',
    style,
}) => {
    const baseStyles: React.CSSProperties = {
        background: 'linear-gradient(90deg, var(--color-gray-200) 0%, var(--color-gray-100) 50%, var(--color-gray-200) 100%)',
        backgroundSize: '200px 100%',
        animation: 'skeleton-loading 1.5s infinite',
        borderRadius: 'var(--radius-sm)',
    };

    const variantStyles = getVariantStyles(variant);

    const combinedStyles: React.CSSProperties = {
        ...baseStyles,
        ...variantStyles,
        ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
        ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
        ...style,
    };

    if (count > 1) {
        return (
            <>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={index} className={`skeleton ${className}`} style={combinedStyles} />
                ))}
            </>
        );
    }

    return <div className={`skeleton ${className}`} style={combinedStyles} />;
};

// Compound components for common patterns
export const SkeletonCard: React.FC<{ showAvatar?: boolean; lines?: number }> = ({
    showAvatar = true,
    lines = 3,
}) => {
    return (
        <div style={{
            padding: 'var(--spacing-md)',
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
        }}>
            {showAvatar && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                    <Skeleton variant="avatar" />
                    <div style={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text-sm" width="40%" />
                    </div>
                </div>
            )}
            <Skeleton variant="text" count={lines} />
            <Skeleton variant="text-sm" width="80%" />
        </div>
    );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4,
}) => {
    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={`h-${i}`} variant="button" style={{ flex: 1 }} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <Skeleton key={`r${rowIdx}-c${colIdx}`} variant="text" style={{ flex: 1 }} />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
