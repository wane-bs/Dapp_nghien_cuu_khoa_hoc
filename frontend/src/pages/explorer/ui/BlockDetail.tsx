import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { explorerService, BlockInfo } from '../api/ExplorerService';

const BlockDetail: React.FC = () => {
    const { blockNumber } = useParams();
    const [block, setBlock] = useState<BlockInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlock = async () => {
            if (!blockNumber) return;
            const data = await explorerService.getBlock(blockNumber);
            setBlock(data);
            setLoading(false);
        };
        fetchBlock();
    }, [blockNumber]);

    const styles = {
        container: { padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
        header: { fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
        row: { display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '12px 0' },
        label: { width: '200px', fontWeight: 'bold', color: '#7f8c8d' },
        value: { flex: 1, wordBreak: 'break-all' as 'break-all' }
    };

    if (loading) return <div>Loading Block #{blockNumber}...</div>;
    if (!block) return <div>Block not found</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Block #{block.number}</h2>

            <div style={styles.row}>
                <div style={styles.label}>Block Height:</div>
                <div style={styles.value}>{block.number}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Hash:</div>
                <div style={styles.value}>{block.hash}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Timestamp:</div>
                <div style={styles.value}>{new Date(block.timestamp * 1000).toLocaleString()}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Transactions:</div>
                <div style={styles.value}>{block.transactions} transactions in this block</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Gas Used:</div>
                <div style={styles.value}>
                    {parseInt(block.gasUsed).toLocaleString()}
                    <span style={{ color: '#7f8c8d', fontSize: '0.8em', marginLeft: '8px' }}>
                        ({((parseInt(block.gasUsed) / parseInt(block.gasLimit)) * 100).toFixed(2)}%)
                    </span>
                    {parseInt(block.gasUsed) > 1000000 && (
                        <div style={{ fontSize: '0.8em', color: '#e67e22', marginTop: '4px' }}>
                            ⚠️ High usage likely due to Contract Deployment
                        </div>
                    )}
                </div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Gas Limit:</div>
                <div style={styles.value}>{parseInt(block.gasLimit).toLocaleString()}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Miner:</div>
                <div style={styles.value}><Link to={`/explorer/address/${block.miner}`}>{block.miner}</Link></div>
            </div>
        </div>
    );
};

export default BlockDetail;
