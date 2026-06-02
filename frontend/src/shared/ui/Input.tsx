import React from 'react';

/**
 * Input Component - Basic UI Kit
 * Input field với label và error state
 * 
 * @example
 * <Input label="Email" type="email" required />
 * <Input label="Password" type="password" error="Mật khẩu không đúng" />
 */

interface InputProps {
    label?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    placeholder?: string;
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    name?: string;
    id?: string;
    style?: React.CSSProperties;
    inputStyle?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    required = false,
    disabled = false,
    error,
    name,
    id,
    style,
    inputStyle,
}) => {
    const containerStyles: React.CSSProperties = {
        marginBottom: 'var(--spacing-md)',
        ...style,
    };

    const labelStyles: React.CSSProperties = {
        display: 'block',
        marginBottom: 'var(--spacing-xs)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-medium)' as any,
        color: 'var(--color-gray-800)',
    };

    const inputBaseStyles: React.CSSProperties = {
        width: '100%',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        fontSize: 'var(--font-size-base)',
        borderRadius: 'var(--radius-sm)',
        border: error
            ? '1px solid var(--color-danger)'
            : '1px solid var(--color-gray-300)',
        backgroundColor: disabled ? 'var(--color-gray-100)' : 'var(--color-white)',
        transition: 'var(--transition-fast)',
        boxSizing: 'border-box' as const,
        outline: 'none',
        ...inputStyle,
    };

    const errorStyles: React.CSSProperties = {
        marginTop: 'var(--spacing-xs)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-danger)',
    };

    const requiredMarkStyles: React.CSSProperties = {
        color: 'var(--color-danger)',
        marginLeft: '2px',
    };

    return (
        <div style={containerStyles}>
            {label && (
                <label htmlFor={id || name} style={labelStyles}>
                    {label}
                    {required && <span style={requiredMarkStyles}>*</span>}
                </label>
            )}
            <input
                type={type}
                id={id || name}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                style={inputBaseStyles}
            />
            {error && <div style={errorStyles}>{error}</div>}
        </div>
    );
};

export default Input;
