import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const Login: React.FC<{ setUser: (u: any) => void }> = ({ setUser }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isAdminPortal, setIsAdminPortal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'USER' | 'LENDER' | 'ADMIN'>('USER');

    // Detect if running on Admin Portal (port 3003)
    useEffect(() => {
        const port = window.location.port;
        if (port === '3003') {
            setIsAdminPortal(true);
            setFormData({ username: 'admin1', password: '' });
        }
    }, []);

    const mockLogin = (username: string, role: 'USER' | 'LENDER' | 'ADMIN', address?: string) => {
        const mockAddress = address || ethers.Wallet.createRandom().address;
        setUser({
            username: username || mockAddress.substring(0, 8),
            email: `${username || 'wallet'}@demo.local`,
            address: mockAddress,
            role: role
        });

        switch (role) {
            case 'ADMIN': navigate('/owner'); break;
            case 'LENDER': navigate('/lender-manage'); break;
            default: navigate('/dashboard'); break;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const role = isAdminPortal ? 'ADMIN' : (formData.username.includes('admin') ? 'ADMIN' : (formData.username.includes('lender') ? 'LENDER' : 'USER'));
        mockLogin(formData.username, role);
    };

    const quickLogin = async (username: string) => {
        const role = username.includes('admin') ? 'ADMIN' : (username.includes('lender') ? 'LENDER' : 'USER');
        mockLogin(username, role);
    };

    const connectWallet = async () => {
        if (typeof (window as any).ethereum === 'undefined') {
            setError('MetaMask chưa được cài đặt trên trình duyệt của bạn!');
            return;
        }
        try {
            setError('');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            if (accounts.length > 0) {
                const address = accounts[0].toLowerCase();
                const role = isAdminPortal ? 'ADMIN' : selectedRole;
                mockLogin('', role, address);
            }
        } catch (err: any) {
            setError('Lỗi kết nối ví: ' + (err.message || ''));
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2>{isAdminPortal ? '🔐 Admin Portal' : 'Đăng Nhập'}</h2>

            {isAdminPortal && (
                <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px', marginBottom: '15px', fontSize: '12px' }}>
                    ℹ️ Đây là cổng dành cho Admin. Nhấn "Quick Login Admin" để vào nhanh.
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ marginBottom: '20px' }}>
                {!isAdminPortal && (
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Vai trò kiểm thử (DApp Mock Role):</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as any)}
                            style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="USER">Khách hàng (Renter)</option>
                            <option value="LENDER">Chủ sách (Lender)</option>
                            <option value="ADMIN">Quản trị viên (Admin)</option>
                        </select>
                    </div>
                )}
                <button
                    type="button"
                    onClick={connectWallet}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#f6851b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                    🦊 Connect Wallet (MetaMask)
                </button>
                <div style={{ textAlign: 'center', margin: '15px 0', position: 'relative' }}>
                    <div style={{ borderBottom: '1px solid #ddd', position: 'absolute', top: '50%', width: '100%', zIndex: 1 }}></div>
                    <span style={{ background: '#fff', padding: '0 10px', color: '#888', fontSize: '13px', position: 'relative', zIndex: 2 }}>
                        Hoặc dùng tài khoản Web2 thử nghiệm
                    </span>
                </div>
            </div>

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Password (Optional):</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="No password needed"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
            </form>

            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>⚡ Quick Login (Tự động tạo nếu chưa có):</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => quickLogin('user1')}
                        style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        👤 User
                    </button>
                    <button
                        type="button"
                        onClick={() => quickLogin('admin1')}
                        style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        👮 Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => quickLogin('lender1')}
                        style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        🏠 Lender
                    </button>
                </div>
            </div>

            {!isAdminPortal && (
                <p style={{ marginTop: '15px', textAlign: 'center' }}>
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
            )}
        </div>
    );
};

export default Login;
