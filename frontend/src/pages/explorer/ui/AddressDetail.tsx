import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { explorerService } from '../api/ExplorerService';

const AddressDetail: React.FC = () => {
    const { address } = useParams();
    const [info, setInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAddress = async () => {
            if (!address) return;
            const data = await explorerService.getAddressInfo(address);
            setInfo(data);
            setLoading(false);
        };
        fetchAddress();
    }, [address]);

    const styles = {
        container: { padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
        header: { fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
        row: { display: 'flex', borderBottom: '1px solid #f5f5f5', padding: '12px 0' },
        label: { width: '200px', fontWeight: 'bold', color: '#7f8c8d' },
        value: { flex: 1, wordBreak: 'break-all' as 'break-all' }
    };

    if (loading) return <div>Loading Address Data...</div>;
    if (!info) return <div>Address content not found</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Address Details</h2>

            <div style={styles.row}>
                <div style={styles.label}>Address:</div>
                <div style={styles.value}>{info.address}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Balance:</div>
                <div style={styles.value}>{info.balance} VIC</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Type:</div>
                <div style={styles.value}>{info.isContract ? 'Contract' : 'EOA (External Owned Account)'}</div>
            </div>
            <div style={styles.row}>
                <div style={styles.label}>Transaction Count:</div>
                <div style={styles.value}>{info.txCount}</div>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', color: '#999' }}>
                (Transaction history for address is not fully indexed in this version)
            </div>
        </div>
    );
};

export default AddressDetail;
