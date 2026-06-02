export const dashboardStyles = {
    card: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
    },
    statCard: {
        background: '#ffffff',
        color: '#333333',
        border: '1px solid #e0e0e0',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '10px',
        textAlign: 'center' as const
    },
    statNumber: {
        fontSize: '24px',
        fontWeight: 'bold' as const,
        color: '#000000'
    },
    tabGroup: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
    },
    tab: (active: boolean, activeColor: string = '#2196F3') => ({
        padding: '8px 16px',
        borderRadius: '20px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active ? activeColor : '#e0e0e0',
        color: active ? 'white' : '#333',
        fontWeight: 'bold' as const
    }),
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
    },
    th: {
        textAlign: 'left' as const,
        padding: '12px',
        borderBottom: '2px solid #ddd',
        color: '#555'
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #eee'
    }
};
