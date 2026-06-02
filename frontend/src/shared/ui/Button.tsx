import React from 'react';

/**
 * Button Component - Basic UI Kit
 * Sử dụng CSS variables từ variables.css
 * 
 * @example
 * <Button variant="primary" onClick={handleClick}>Submit</Button>
 * <Button variant="danger" size="sm">Delete</Button>
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
    style?: React.CSSProperties;
    className?: string;
}

const getVariantStyles = (variant: ButtonVariant): React.CSSProperties => {
    const variants: Record<ButtonVariant, React.CSSProperties> = {
        primary: {
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-white)',
            border: 'none',
        },
        secondary: {
            backgroundColor: 'var(--color-gray-200)',
            color: 'var(--color-gray-800)',
            border: 'none',
        },
        danger: {
            backgroundColor: 'var(--color-danger)',
            color: 'var(--color-white)',
            border: 'none',
        },
        success: {
            backgroundColor: 'var(--color-success)',
            color: 'var(--color-white)',
            border: 'none',
        },
        warning: {
            backgroundColor: 'var(--color-warning)',
            color: 'var(--color-gray-800)',
            border: 'none',
        },
        outline: {
            backgroundColor: 'transparent',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary)',
        },
    };
    return variants[variant];
};

const getSizeStyles = (size: ButtonSize): React.CSSProperties => {
    const sizes: Record<ButtonSize, React.CSSProperties> = {
        sm: {
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
        },
        md: {
            padding: 'var(--spacing-sm) var(--spacing-md)',
            fontSize: 'var(--font-size-base)',
        },
        lg: {
            padding: 'var(--spacing-md) var(--spacing-lg)',
            fontSize: 'var(--font-size-lg)',
        },
    };
    return sizes[size];
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    onClick,
    style,
    className,
}) => {
    const baseStyles: React.CSSProperties = {
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 'var(--font-weight-medium)' as any,
        transition: 'var(--transition-fast)',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-xs)',
    };

    const combinedStyles: React.CSSProperties = {
        ...baseStyles,
        ...getVariantStyles(variant),
        ...getSizeStyles(size),
        ...style,
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            style={combinedStyles}
            className={className}
        >
            {children}
        </button>
    );
};

export default Button;
