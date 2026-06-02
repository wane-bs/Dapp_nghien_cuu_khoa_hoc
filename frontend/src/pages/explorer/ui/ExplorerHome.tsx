import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { explorerService, BlockInfo, TxInfo } from '../api/ExplorerService';

const ExplorerHome: React.FC = () => {
    const [blocks, setBlocks] = useState<BlockInfo[]>([]);
    const [txs, setTxs] = useState<TxInfo[]>([]);
    const [stats, setStats] = useState({ blockNumber: 0, gasPrice: '0' });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [netStats, recentBlocks, recentTxs] = await Promise.all([
                explorerService.getNetworkStats(),
                explorerService.getRecentBlocks(6), // Get 6 to fill space
                explorerService.getRecentTxs(10)
            ]);

            setStats(netStats);
            setBlocks(recentBlocks);
            setTxs(recentTxs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const styles = {
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '30px'
        },
        card: {
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden'
        },
        cardHeader: {
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f0',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            color: '#2c3e50',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        list: {
            padding: '0'
        },
        listItem: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #f9f9f9',
            alignItems: 'center'
        },
        blockBox: {
            background: '#f1f2f6',
            color: '#2f3542',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            minWidth: '50px',
            textAlign: 'center' as 'center',
            marginRight: '15px'
        },
        link: {
            color: '#3498db',
            textDecoration: 'none',
            fontWeight: 500
        },
        statCard: {
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
        },
        icon: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#e3f2fd',
            color: '#2196f3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
        },
        label: { color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '5px' },
        value: { fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }
    };

    if (loading) return <div>Loading Blockchain Data...</div>;

    return (
        <div>
            {/* Stats Row */}
            <div style={{ ...styles.grid, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div style={styles.statCard}>
                    <div style={styles.icon}>📦</div>
                    <div>
                        <div style={styles.label}>Block Height</div>
                        <div style={styles.value}>#{stats.blockNumber}</div>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.icon}>⛽</div>
                    <div>
                        <div style={styles.label}>Gas Price</div>
                        <div style={styles.value}>{stats.gasPrice} <small style={{ fontSize: '0.6em' }}>Gwei</small></div>
                    </div>
                </div>
                {/* Placeholder Stat */}
                <div style={styles.statCard}>
                    <div style={styles.icon}>⏱️</div>
                    <div>
                        <div style={styles.label}>Avg Block Time</div>
                        <div style={styles.value}>~12.0s</div>
                    </div>
                </div>
            </div>

            <div style={{ ...styles.grid, gridTemplateColumns: '1fr 1fr' }}>
                {/* Latest Blocks */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>Latest Blocks</div>
                    <div style={styles.list}>
                        {blocks.map(block => (
                            <div key={block.hash} style={styles.listItem}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={styles.blockBox}>Bk</div>
                                    <div>
                                        <div style={{ marginBottom: '4px' }}>
                                            <Link to={`/explorer/block/${block.number}`} style={styles.link}>{block.number}</Link>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
                                            {new Date(block.timestamp * 1000).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem' }}>Txns: {block.transactions}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Miner: {block.miner.substring(0, 8)}...</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '15px', textAlign: 'center', background: '#fafafa' }}>
                        <Link to="/explorer/blocks" style={styles.link}>View all blocks →</Link>
                    </div>
                </div>

                {/* Latest Transactions */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>Latest Transactions</div>
                    <div style={styles.list}>
                        {txs.map(tx => (
                            <div key={tx.hash} style={styles.listItem}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ ...styles.blockBox, background: '#fff3e0', color: '#e67e22' }}>Tx</div>
                                    <div style={{ maxWidth: '150px' }}>
                                        <div style={{ marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Link to={`/explorer/tx/${tx.hash}`} style={styles.link}>{tx.hash.substring(0, 14)}...</Link>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#95a5a6' }}>
                                            From {tx.from.substring(0, 8)}...
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{parseFloat(tx.value).toFixed(4)} VIC</div>
                                </div>
                            </div>
                        ))}
                        {txs.length === 0 && <div style={{ padding: '20px', textAlign: 'center' }}>No recent transactions</div>}
                    </div>
                    <div style={{ padding: '15px', textAlign: 'center', background: '#fafafa' }}>
                        <Link to="/explorer/txs" style={styles.link}>View all transactions →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExplorerHome;
