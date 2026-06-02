import React from 'react';

/**
 * Badge Component - Basic UI Kit
 * Hiển thị nhãn trạng thái với màu sắc tương ứng
 * 
 * @example
 * <Badge status="success">Hoàn thành</Badge>
 * <Badge status="warning">Đang chờ</Badge>
 */

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
    children: React.ReactNode;
    status?: BadgeStatus;
    style?: React.CSSProperties;
}

const getStatusStyles = (status: BadgeStatus): React.CSSProperties => {
    const statusStyles: Record<BadgeStatus, React.CSSProperties> = {
        success: {
            backgroundColor: 'var(--color-success-light)',
            color: 'var(--color-success-dark)',
            border: '1px solid var(--color-success)',
        },
        warning: {
            backgroundColor: 'var(--color-warning-light)',
            color: 'var(--color-warning-dark)',
            border: '1px solid var(--color-warning)',
        },
        danger: {
            backgroundColor: 'var(--color-danger-light)',
            color: 'var(--color-danger-dark)',
            border: '1px solid var(--color-danger)',
        },
        info: {
            backgroundColor: 'var(--color-info-light)',
            color: 'var(--color-info-dark)',
            border: '1px solid var(--color-info)',
        },
        default: {
            backgroundColor: 'var(--color-gray-200)',
            color: 'var(--color-gray-700)',
            border: '1px solid var(--color-gray-400)',
        },
    };
    return statusStyles[status];
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    status = 'default',
    style,
}) => {
    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)' as any,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap',
    };

    const combinedStyles: React.CSSProperties = {
        ...baseStyles,
        ...getStatusStyles(status),
        ...style,
    };

    return (
        <span style={combinedStyles}>
            {children}
        </span>
    );
};

export default Badge;
