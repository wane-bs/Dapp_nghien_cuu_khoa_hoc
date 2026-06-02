import { toast, ToastOptions } from 'react-toastify';

/**
 * Toast Notification Helpers
 * Sử dụng để thay thế alert() / window.confirm()
 * 
 * @example
 * import { showSuccess, showError } from '@/shared/lib/toast';
 * showSuccess('Đã lưu thành công!');
 * showError('Có lỗi xảy ra');
 */

const defaultOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
};

export const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, autoClose: 5000, ...options });
};

export const showWarning = (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options });
};

export const showInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
};

// Export toast instance for advanced usage
export { toast };
