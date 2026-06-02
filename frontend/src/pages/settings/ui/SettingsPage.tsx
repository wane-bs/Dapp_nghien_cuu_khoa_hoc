import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Button, Input } from '../../../shared/ui';

/**
 * Settings Page - Cài đặt người dùng
 * Mapping với Mockup: 2. NGƯỜI THUÊ/NT_CÀI ĐẶT
 */

interface UserContextType {
    user: {
        username: string;
        email: string;
        address: string;
        role: string;
    };
}

const SettingsPage: React.FC = () => {
    const { user } = useOutletContext<UserContextType>();

    // State cho đổi mật khẩu
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // State cho cài đặt thông báo
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [rentalReminders, setRentalReminders] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword.length < 6) {
            setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Xác nhận mật khẩu không khớp');
            return;
        }

        // Giả lập thành công (Phase 1 - không có backend API)
        setPasswordSuccess('Đã đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleSaveNotifications = () => {
        // Giả lập lưu cài đặt
        alert('Đã lưu cài đặt thông báo!');
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: '600px',
        margin: '0 auto',
        padding: 'var(--spacing-md)',
    };

    const sectionStyle: React.CSSProperties = {
        marginBottom: 'var(--spacing-xl)',
    };

    const checkboxGroupStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
    };

    const checkboxLabelStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-base)',
    };

    const profileInfoStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: 'var(--spacing-sm)',
        fontSize: 'var(--font-size-base)',
    };

    const labelStyle: React.CSSProperties = {
        color: 'var(--color-gray-600)',
        fontWeight: 'var(--font-weight-medium)' as any,
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-2xl)' }}>
                ⚙️ Cài đặt
            </h1>

            {/* Thông tin tài khoản */}
            <div style={sectionStyle}>
                <Card title="Thông tin tài khoản">
                    <div style={profileInfoStyle}>
                        <span style={labelStyle}>Tên đăng nhập:</span>
                        <span>{user?.username || 'N/A'}</span>

                        <span style={labelStyle}>Email:</span>
                        <span>{user?.email || 'N/A'}</span>

                        <span style={labelStyle}>Địa chỉ ví:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {user?.address || 'Chưa kết nối'}
                        </span>

                        <span style={labelStyle}>Vai trò:</span>
                        <span>{user?.role || 'USER'}</span>
                    </div>
                </Card>
            </div>

            {/* Đổi mật khẩu */}
            <div style={sectionStyle}>
                <Card title="Đổi mật khẩu">
                    <form onSubmit={handleChangePassword}>
                        <Input
                            label="Mật khẩu hiện tại"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                        <Input
                            label="Mật khẩu mới"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <Input
                            label="Xác nhận mật khẩu mới"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={passwordError}
                            required
                        />
                        {passwordSuccess && (
                            <div style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }}>
                                ✅ {passwordSuccess}
                            </div>
                        )}
                        <Button type="submit" variant="primary">
                            Đổi mật khẩu
                        </Button>
                    </form>
                </Card>
            </div>

            {/* Cài đặt thông báo */}
            <div style={sectionStyle}>
                <Card title="Cài đặt thông báo">
                    <div style={checkboxGroupStyle}>
                        <label style={checkboxLabelStyle}>
                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => setEmailNotifications(e.target.checked)}
                            />
                            📧 Nhận thông báo qua email
                        </label>
                        <label style={checkboxLabelStyle}>
                            <input
                                type="checkbox"
                                checked={rentalReminders}
                                onChange={(e) => setRentalReminders(e.target.checked)}
                            />
                            ⏰ Nhắc nhở khi sắp hết hạn thuê
                        </label>
                        <label style={checkboxLabelStyle}>
                            <input
                                type="checkbox"
                                checked={marketingEmails}
                                onChange={(e) => setMarketingEmails(e.target.checked)}
                            />
                            📢 Nhận email khuyến mãi và tin tức
                        </label>
                    </div>
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <Button variant="success" onClick={handleSaveNotifications}>
                            Lưu cài đặt
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPage;
