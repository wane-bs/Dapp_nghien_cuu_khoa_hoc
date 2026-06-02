import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { explorerService, TxInfo } from '../api/ExplorerService';

const TxDetail: React.FC = () => {
    const { txHash } = useParams();
    const [tx, setTx] = useState<TxInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTx = async () => {
            if (!txHash) return;
            const data = await explorerService.getTransaction(txHash);
            setTx(data);
            setLoading(false);
        };
        fetchTx();
    }, [txHash]);

    const styles = {
        container: { padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
        header: { fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
        row: { display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '12px 0' },
        label: { width: '200px', fontWeight: 'bold', color: '#7f8c8d' },
        value: { flex: 1, wordBreak: 'break-all' as 'break-all' },
        statusSuccess: { color: '#27ae60', background: '#eafaf1', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' },
        statusFail: { color: '#c0392b', background: '#fdedec', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }
    };

    if (loading) return <div>Loading Transaction...</div>;
    if (!tx) return <div>Transaction not found</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Transaction Details</h2>

            <div style={styles.row}>
                <div style={styles.label}>Transaction Hash:</div>
                <div style={styles.value}>{tx.hash}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Status:</div>
                <div style={styles.value}>
                    {tx.status === 1 ? <span style={styles.statusSuccess}>Success</span> :
                        tx.status === 0 ? <span style={styles.statusFail}>Failed</span> : 'Pending'}
                </div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Block:</div>
                <div style={styles.value}><Link to={`/explorer/block/${tx.blockNumber}`}>{tx.blockNumber}</Link></div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>From:</div>
                <div style={styles.value}><Link to={`/explorer/address/${tx.from}`}>{tx.from}</Link></div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>To:</div>
                <div style={styles.value}>
                    {tx.to ? <Link to={`/explorer/address/${tx.to}`}>{tx.to}</Link> : 'Contract Creation'}
                </div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Value:</div>
                <div style={styles.value}>{tx.value} VIC</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Gas Price:</div>
                <div style={styles.value}>{tx.gasPrice} Gwei</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Gas Used:</div>
                <div style={styles.value}>{parseInt(tx.gasUsed || '0').toLocaleString()}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Transaction Fee:</div>
                <div style={styles.value}>
                    {/* Calculation: (GasUsed * GasPrice(Gwei)) / 1e9 = Fee(VIC) */}
                    {(() => {
                        const used = parseFloat(tx.gasUsed || '0');
                        const price = parseFloat(tx.gasPrice || '0');
                        const fee = (used * price) / 1e9;
                        const fiatRate = 2.5; // Demo Rate: 1 VIC = $2.5
                        const fiatFee = fee * fiatRate;

                        return (
                            <span>
                                <span style={{ fontWeight: 'bold', color: '#1e3799' }}>{fee.toLocaleString(undefined, { maximumFractionDigits: 8 })} VIC</span>
                                <span style={{ marginLeft: '10px', color: '#7f8c8d', fontSize: '0.9em' }}>
                                    (${fiatFee.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                                </span>
                            </span>
                        );
                    })()}
                </div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Input Data:</div>
                <div style={{ ...styles.value, fontFamily: 'monospace', background: '#f8f9fa', padding: '10px' }}>{tx.input}</div>
            </div>
        </div>
    );
};

export default TxDetail;
