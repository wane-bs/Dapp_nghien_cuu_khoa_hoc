import React from 'react';

/**
 * Card Component - Basic UI Kit
 * Container với shadow và bo góc
 * 
 * @example
 * <Card title="Thông tin sách">
 *   <p>Nội dung card...</p>
 * </Card>
 * <Card variant="highlighted">...</Card>
 */

export type CardVariant = 'default' | 'highlighted' | 'bordered';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    variant?: CardVariant;
    style?: React.CSSProperties;
    headerStyle?: React.CSSProperties;
}

const getVariantStyles = (variant: CardVariant): React.CSSProperties => {
    const variants: Record<CardVariant, React.CSSProperties> = {
        default: {
            backgroundColor: 'var(--color-white)',
            boxShadow: 'var(--shadow-md)',
            border: 'none',
        },
        highlighted: {
            backgroundColor: 'var(--color-primary-light)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-primary)',
        },
        bordered: {
            backgroundColor: 'var(--color-white)',
            boxShadow: 'none',
            border: '1px solid var(--color-gray-300)',
        },
    };
    return variants[variant];
};

export const Card: React.FC<CardProps> = ({
    children,
    title,
    variant = 'default',
    style,
    headerStyle,
}) => {
    const baseStyles: React.CSSProperties = {
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)',
    };

    const combinedStyles: React.CSSProperties = {
        ...baseStyles,
        ...getVariantStyles(variant),
        ...style,
    };

    const titleStyles: React.CSSProperties = {
        margin: 0,
        marginBottom: 'var(--spacing-md)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-bold)' as any,
        color: 'var(--color-gray-800)',
        paddingBottom: 'var(--spacing-sm)',
        borderBottom: '1px solid var(--color-gray-200)',
        ...headerStyle,
    };

    return (
        <div style={combinedStyles}>
            {title && <h3 style={titleStyles}>{title}</h3>}
            {children}
        </div>
    );
};

export default Card;
