import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import '../../app/styles/App.css';

// Define Props
interface MainLayoutProps {
    user: any;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user }) => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Detect Admin Portal by port
    const isAdminPortal = window.location.port === '3003';

    const getHeaderClass = (path: string) => {
        return location.pathname === path ? 'nav-item active' : 'nav-item';
    };

    const handlePromote = async () => {
        if (!user) return;
        if (!window.confirm("Bạn sẽ được nâng cấp lên tài khoản Lender để cho thuê sách. Tiếp tục?")) return;
        // Sprint 1: Direct role change (no backend)
        alert('Chúc mừng! Bạn đã trở thành Lender. (Local mode - không lưu)');
        window.location.href = '/lender-manage';
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    // Styles
    const headerStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        backgroundColor: isAdminPortal ? '#1a237e' : 'var(--color-primary-dark)',
        color: 'var(--color-white)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-md)',
    };

    const logoStyles: React.CSSProperties = {
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-bold)' as any,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
    };

    const navBarStyles: React.CSSProperties = {
        display: 'flex',
        gap: 'var(--spacing-sm)',
        alignItems: 'center',
    };

    const navPillStyles = (active: boolean): React.CSSProperties => ({
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
        color: 'var(--color-white)',
        textDecoration: 'none',
        fontWeight: active ? 'var(--font-weight-bold)' as any : 'normal',
        transition: 'var(--transition-fast)',
        fontSize: 'var(--font-size-base)',
        whiteSpace: 'nowrap',
    });

    const hamburgerStyles: React.CSSProperties = {
        display: 'none',
        flexDirection: 'column',
        gap: '4px',
        cursor: 'pointer',
        padding: 'var(--spacing-sm)',
        background: 'none',
        border: 'none',
    };

    const hamburgerLineStyles: React.CSSProperties = {
        width: '24px',
        height: '3px',
        backgroundColor: 'var(--color-white)',
        borderRadius: '2px',
        transition: 'var(--transition-fast)',
    };

    const mobileMenuOverlayStyles: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 998,
        opacity: mobileMenuOpen ? 1 : 0,
        visibility: mobileMenuOpen ? 'visible' : 'hidden',
        transition: 'var(--transition-normal)',
    };

    const mobileMenuStyles: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: mobileMenuOpen ? 0 : '-280px',
        width: '280px',
        height: '100vh',
        backgroundColor: 'var(--color-white)',
        zIndex: 999,
        transition: 'left var(--transition-normal)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
    };

    const mobileMenuHeaderStyles: React.CSSProperties = {
        padding: 'var(--spacing-lg)',
        backgroundColor: isAdminPortal ? '#1a237e' : 'var(--color-primary-dark)',
        color: 'var(--color-white)',
    };

    const mobileNavItemStyles = (active: boolean): React.CSSProperties => ({
        display: 'block',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        color: active ? 'var(--color-primary)' : 'var(--color-gray-800)',
        backgroundColor: active ? 'var(--color-primary-light)' : 'transparent',
        textDecoration: 'none',
        borderLeft: active ? '4px solid var(--color-primary)' : '4px solid transparent',
        fontWeight: active ? 'var(--font-weight-bold)' as any : 'normal',
        transition: 'var(--transition-fast)',
    });

    const userInfoStyles: React.CSSProperties = {
        fontSize: 'var(--font-size-sm)',
        color: 'rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
    };

    const mainContentStyles: React.CSSProperties = {
        flex: 1,
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--color-gray-100)',
        minHeight: 'calc(100vh - 60px)',
    };

    // Navigation Items based on role
    const getNavItems = () => {
        const items = [
            { path: '/dashboard', label: '🏠 Trang chủ', roles: ['USER', 'ADMIN', 'LENDER'] },
            { path: '/owner', label: '👮 Admin Dashboard', roles: ['ADMIN'] },
            { path: '/rent-out', label: '➕ Niêm yết sách', roles: ['LENDER'] },
            { path: '/lender-manage', label: '📚 Sách của tôi', roles: ['LENDER'] },
            { path: '/account', label: '👤 Tài khoản', roles: ['USER', 'ADMIN', 'LENDER'] },
            { path: '/wallet', label: '💰 Ví', roles: ['USER', 'ADMIN', 'LENDER'] },
            { path: '/settings', label: '⚙️ Cài đặt', roles: ['USER', 'ADMIN', 'LENDER'] },
            { path: '/explorer', label: '🔍 Explorer', roles: ['USER', 'ADMIN', 'LENDER'] },
        ];
        return items.filter(item => item.roles.includes(user?.role || 'USER'));
    };

    // Admin Portal Mode
    if (isAdminPortal) {
        return (
            <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <header style={headerStyles}>
                    <div style={logoStyles}>🔐 ADMIN PORTAL</div>
                    <nav style={navBarStyles} className="desktop-nav">
                        <Link to="/owner" style={navPillStyles(location.pathname === '/owner')}>📋 Quản lý Đơn hàng</Link>
                        <Link to="/dashboard" style={navPillStyles(location.pathname === '/dashboard')}>📚 Xem Sách</Link>
                    </nav>
                    <div style={userInfoStyles}>
                        {user ? `👤 ${user.username.startsWith('0x') ? user.username.substring(0, 6) + '...' + user.username.slice(-4) : user.username} (${user.role})` : '⚠️ Chưa đăng nhập'}
                    </div>
                </header>
                <main style={mainContentStyles}>
                    <Outlet context={{ user }} />
                </main>
            </div>
        );
    }

    // Normal App Mode
    return (
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Mobile Menu Overlay */}
            <div style={mobileMenuOverlayStyles} onClick={closeMobileMenu} />

            {/* Mobile Sidebar */}
            <div style={mobileMenuStyles} className="mobile-sidebar">
                <div style={mobileMenuHeaderStyles}>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>📚 VinaLib Vault</div>
                    {user && (
                        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>
                            {user.username} ({user.role})
                        </div>
                    )}
                </div>
                <nav style={{ flex: 1, paddingTop: 'var(--spacing-sm)' }}>
                    {getNavItems().map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={mobileNavItemStyles(location.pathname === item.path)}
                            onClick={closeMobileMenu}
                        >
                            {item.label}
                        </Link>
                    ))}
                    {user?.role === 'USER' && (
                        <div
                            style={mobileNavItemStyles(false)}
                            onClick={() => { handlePromote(); closeMobileMenu(); }}
                        >
                            ➕ Trở thành Lender
                        </div>
                    )}
                </nav>
            </div>

            {/* Header */}
            <header style={headerStyles}>
                {/* Hamburger Menu (Mobile) */}
                <button
                    style={{ ...hamburgerStyles, display: 'flex' }}
                    className="mobile-nav-toggle"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Menu"
                >
                    <span style={hamburgerLineStyles} />
                    <span style={hamburgerLineStyles} />
                    <span style={hamburgerLineStyles} />
                </button>

                {/* Logo */}
                <div style={logoStyles}>📚 VinaLib</div>

                {/* Desktop Navigation */}
                <nav style={{ ...navBarStyles, display: 'none' }} className="desktop-nav">
                    {getNavItems().slice(0, 4).map((item) => (
                        <Link key={item.path} to={item.path} style={navPillStyles(location.pathname === item.path)}>
                            {item.label}
                        </Link>
                    ))}
                    {user?.role === 'USER' && (
                        <span style={{ ...navPillStyles(false), cursor: 'pointer' }} onClick={handlePromote}>
                            ➕ Cho thuê sách
                        </span>
                    )}
                </nav>

                {/* User Info */}
                <div style={userInfoStyles}>
                    {user ? `👤 ${user.username.startsWith('0x') ? user.username.substring(0, 6) + '...' + user.username.slice(-4) : user.username}` : '⚠️ Chưa đăng nhập'}
                </div>
            </header>

            {/* Main Content */}
            <main style={mainContentStyles} className="animate-fade-in">
                <Outlet context={{ user }} />
            </main>

            {/* CSS for responsive */}
            <style>{`
                @media (min-width: 768px) {
                    .mobile-nav-toggle { display: none !important; }
                    .desktop-nav { display: flex !important; }
                    .mobile-sidebar { display: none !important; }
                }
                @media (max-width: 767px) {
                    .desktop-nav { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default MainLayout;
