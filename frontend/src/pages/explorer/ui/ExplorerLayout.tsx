import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import SearchBar from './components/SearchBar';

const ExplorerLayout: React.FC = () => {
    const location = useLocation();

    // --- Styles ---
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column' as 'column',
            minHeight: '100%',
        },
        hero: {
            backgroundColor: '#1e3799', // Premium Dark Blue
            backgroundImage: 'linear-gradient(135deg, #1e3799 0%, #0c2461 100%)',
            color: 'white',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column' as 'column',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        },
        title: {
            fontSize: '2rem',
            fontWeight: 700,
            margin: 0
        },
        subtitle: {
            opacity: 0.8,
            fontSize: '1rem',
            marginTop: '-10px'
        },
        content: {
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            padding: '0 20px 40px',
            boxSizing: 'border-box' as 'border-box'
        },
        nav: {
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
            borderBottom: '1px solid #eee',
            paddingBottom: '10px'
        },
        navLink: (active: boolean) => ({
            textDecoration: 'none',
            color: active ? '#1e3799' : '#666',
            fontWeight: active ? 'bold' as 'bold' : 'normal',
            borderBottom: active ? '2px solid #1e3799' : 'none',
            paddingBottom: '5px'
        })
    };

    return (
        <div style={styles.container}>
            {/* Hero Section with Search */}
            <div style={styles.hero}>
                <h1 style={styles.title}>SUCHIN Explorer</h1>
                <p style={styles.subtitle}>The VinaLib Blockchain Explorer (Testnet)</p>
                <SearchBar />
            </div>

            {/* Main Content Area */}
            <div style={styles.content}>
                <nav style={styles.nav}>
                    <Link to="/explorer" style={styles.navLink(location.pathname === '/explorer')}>Home</Link>
                    <Link to="/explorer/events" style={styles.navLink(location.pathname === '/explorer/events')}>Events</Link>
                    <Link to="/explorer/onchain" style={styles.navLink(location.pathname === '/explorer/onchain')}>📊 On-Chain Data</Link>
                </nav>

                <Outlet />
            </div>

            <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '0.9rem', borderTop: '1px solid #eee' }}>
                SUCHIN Explorer © 2026 | Powered by VinaLib
            </div>
        </div>
    );
};

export default ExplorerLayout;
