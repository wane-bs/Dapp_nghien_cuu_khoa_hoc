import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    // Sprint 4: No backend registration — DApp uses wallet identity
    const handleRegister = async () => {
        if (!username || !email) {
            setMsg('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        setMsg('✅ Thông tin đã lưu! Chuyển hướng đến Connect Wallet...');
        setTimeout(() => navigate('/login'), 1500);
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <div className="auth-title">thông tin đăng ký tài khoản mới</div>

                <div className="form-group">
                    <div className="form-row">
                        <span className="form-label">mail</span>
                        <input
                            type="text"
                            placeholder="'người dùng điền'"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <div className="form-row">
                        <span className="form-label">tên tài khoản</span>
                        <input
                            type="text"
                            placeholder="'người dùng điền'"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                </div>

                {/* Use a button to trigger action instead of just text */}
                <button className="btn-primary" onClick={handleRegister}>
                    Đăng ký
                </button>

                <div style={{ marginTop: '20px', color: 'red', fontWeight: 'bold' }}>
                    {msg || "xác thực sẽ được gửi về mail"}
                </div>

            </div>
        </div>
    );
};

export default Register;
