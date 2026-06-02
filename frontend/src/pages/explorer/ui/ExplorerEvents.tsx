import React, { useEffect, useState } from 'react';
import { explorerService, EventInfo } from '../api/ExplorerService';

const ExplorerEvents: React.FC = () => {
    const [events, setEvents] = useState<EventInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const data = await explorerService.getRecentEvents(50); // Fetch last 50 events
            setEvents(data);
            setLoading(false);
        };

        fetchEvents();
        // Poll every 5s
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    const styles = {
        container: {
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        },
        header: {
            fontSize: '1.5rem',
            marginBottom: '20px',
            color: '#333',
            borderBottom: '1px solid #eee',
            paddingBottom: '10px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as 'collapse'
        },
        th: {
            textAlign: 'left' as 'left',
            padding: '12px',
            borderBottom: '2px solid #eee',
            color: '#666',
            fontSize: '0.9rem'
        },
        td: {
            padding: '12px',
            borderBottom: '1px solid #eee',
            fontSize: '0.9rem',
            verticalAlign: 'top' as 'top'
        },
        badge: {
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 'bold' as 'bold',
            display: 'inline-block'
        },
        args: {
            fontFamily: 'monospace',
            backgroundColor: '#f8f9fa',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '0.85rem'
        },
        loading: {
            textAlign: 'center' as 'center',
            padding: '40px',
            color: '#999'
        }
    };

    const getBadgeColor = (name: string) => {
        switch (name) {
            case 'BookVerified': return { bg: '#e6fcf5', color: '#0ca678' }; // Green
            case 'BookStatusChanged': return { bg: '#fff3bf', color: '#f59f00' }; // Yellow
            case 'UpdateUser': return { bg: '#e7f5ff', color: '#1c7ed6' }; // Blue
            case 'Transfer': return { bg: '#f1f3f5', color: '#868e96' }; // Gray
            default: return { bg: '#f8f9fa', color: '#333' };
        }
    };

    if (loading && events.length === 0) {
        return <div style={styles.loading}>Loading events...</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Blockchain Events (Log)</h2>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Event</th>
                        <th style={styles.th}>Block</th>
                        <th style={styles.th}>Arguments (Decoded)</th>
                        <th style={styles.th}>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((evt, idx) => {
                        const badgeStyle = getBadgeColor(evt.name);
                        return (
                            <tr key={idx}>
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor: badgeStyle.bg,
                                        color: badgeStyle.color
                                    }}>
                                        {evt.name}
                                    </span>
                                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                                        {evt.transactionHash.substring(0, 10)}...
                                    </div>
                                </td>
                                <td style={styles.td}>{evt.blockNumber}</td>
                                <td style={styles.td}>
                                    <div style={styles.args}>
                                        {Object.entries(evt.args).map(([key, val]) => (
                                            <div key={key}>
                                                <span style={{ color: '#666' }}>{key}:</span> <strong>{String(val)}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    {evt.timestamp ? new Date(evt.timestamp * 1000).toLocaleString() : '-'}
                                </td>
                            </tr>
                        );
                    })}
                    {events.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                                No events found in the last 100 blocks.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ExplorerEvents;
