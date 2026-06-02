import React, { useState, useCallback, useEffect } from 'react';
import { explorerService, BookAssetInfo, EvidencePackInfo, RentalSBTInfo, SUCTokenInfo } from '../api/ExplorerService';
import { getBookStatusLabel, getRentalStatusLabel } from '../api/ContractABIs';

type QueryType = 'book' | 'evidence' | 'sbt' | 'token';

// Default contract addresses - Updated from deploy_full.js output (2024-02-04 15:50)
const DEFAULT_CONTRACTS = {
    sucToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    bookAsset: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    rentalSBT: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    vinaLibVault: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
};

const OnChainDataExplorer: React.FC = () => {
    // State
    const [contracts, setContracts] = useState(DEFAULT_CONTRACTS);
    const [queryType, setQueryType] = useState<QueryType>('book');
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Results State
    const [bookResult, setBookResult] = useState<BookAssetInfo | null>(null);
    const [evidenceResult, setEvidenceResult] = useState<EvidencePackInfo | null>(null);
    const [sbtResult, setSbtResult] = useState<RentalSBTInfo | null>(null);
    const [tokenResult, setTokenResult] = useState<SUCTokenInfo | null>(null);

    // Initial Fetch of Contract Addresses
    useEffect(() => {
        fetch('/api/config/contracts') // Use relative path for API endpoint
            .then(res => res.json())
            .then(data => {
                // Ensure all expected contract addresses are present before updating
                if (data.sucToken && data.bookAsset && data.rentalSBT && data.vinaLibVault) {
                    console.log("Loaded Dynamic Contracts:", data);
                    setContracts(data);
                } else {
                    console.warn("Fetched contracts are incomplete, using default:", data);
                }
            })
            .catch(err => console.warn("Failed to load contracts, using default:", err));
    }, []);

    const getContractAddress = () => {
        switch (queryType) {
            case 'book': return contracts.bookAsset;
            case 'evidence': return contracts.vinaLibVault;
            case 'sbt': return contracts.rentalSBT;
            case 'token': return contracts.sucToken;
            default: return '';
        }
    };

    const contractAddress = getContractAddress();

    const handleQueryTypeChange = (type: QueryType) => {
        setQueryType(type);
        setError(null);
        setBookResult(null);
        setEvidenceResult(null);
        setSbtResult(null);
        setTokenResult(null);
    };

    const handleQuery = useCallback(async () => {
        // Token query doesn't require input (can query just token info)
        if (!inputValue.trim() && queryType !== 'token') {
            setError('Vui lòng nhập giá trị để query');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            switch (queryType) {
                case 'book': {
                    const result = await explorerService.getBookAssetInfo(contractAddress, parseInt(inputValue));
                    if (result) {
                        setBookResult(result);
                    } else {
                        setError(`Không tìm thấy Book NFT với tokenId: ${inputValue}`);
                    }
                    break;
                }
                case 'evidence': {
                    const result = await explorerService.getEvidencePack(contractAddress, parseInt(inputValue));
                    if (result) {
                        setEvidenceResult(result);
                    } else {
                        setError(`Không tìm thấy Evidence Pack cho bookTokenId: ${inputValue}`);
                    }
                    break;
                }
                case 'sbt': {
                    const result = await explorerService.getRentalSBTInfo(contractAddress, parseInt(inputValue));
                    if (result) {
                        setSbtResult(result);
                    } else {
                        setError(`Không tìm thấy Rental SBT với tokenId: ${inputValue}`);
                    }
                    break;
                }
                case 'token': {
                    const result = await explorerService.getSUCTokenInfo(contractAddress, inputValue || undefined);
                    if (result) {
                        setTokenResult(result);
                    } else {
                        setError('Không thể query thông tin token');
                    }
                    break;
                }
            }
        } catch (e: any) {
            setError(e.message || 'Query failed');
        } finally {
            setLoading(false);
        }
    }, [queryType, inputValue, contractAddress]);

    const styles = {
        container: { padding: '20px' },
        card: {
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginBottom: '20px'
        },
        title: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', color: '#2c3e50' },
        tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
        tab: (active: boolean) => ({
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: active ? 'bold' : 'normal',
            background: active ? '#3498db' : '#ecf0f1',
            color: active ? 'white' : '#2c3e50',
            transition: 'all 0.2s'
        }),
        inputGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '5px', fontWeight: 500, color: '#7f8c8d' },
        input: {
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            boxSizing: 'border-box' as 'border-box'
        },
        button: {
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#27ae60',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
        },
        error: {
            background: '#ffeaea',
            color: '#c0392b',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '15px'
        },
        resultCard: {
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px'
        },
        resultRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: '1px solid #eee'
        },
        resultLabel: { color: '#7f8c8d', fontWeight: 500 },
        resultValue: { color: '#2c3e50', fontFamily: 'monospace', wordBreak: 'break-all' as 'break-all' },
        badge: (color: string) => ({
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            background: color,
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
        })
    };

    const getInputPlaceholder = () => {
        switch (queryType) {
            case 'book': return 'Nhập Token ID (vd: 0, 1, 2...)';
            case 'evidence': return 'Nhập Book Token ID';
            case 'sbt': return 'Nhập SBT Token ID';
            case 'token': return 'Nhập địa chỉ ví (để trống = chỉ xem info)';
        }
    };

    const getInputLabel = () => {
        switch (queryType) {
            case 'book': return 'Book Token ID';
            case 'evidence': return 'Book Token ID';
            case 'sbt': return 'SBT Token ID';
            case 'token': return 'Địa chỉ Ví (Optional)';
        }
    };

    const formatTimestamp = (ts: number) => {
        if (!ts) return 'N/A';
        return new Date(ts * 1000).toLocaleString('vi-VN');
    };

    const shortenAddress = (addr: string | null) => {
        if (!addr) return 'N/A';
        return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
    };
    // Tab descriptions
    const getTabDescription = () => {
        switch (queryType) {
            case 'book':
                return {
                    title: '📖 Book NFT (ERC-721 + ERC-4907)',
                    desc: 'Truy vấn thông tin sách được token hóa. Bao gồm chủ sở hữu, trạng thái xác minh, quyền thuê (ERC-4907), IPFS CID.',
                    fields: 'Owner • Status • CID • Renter • Expiry • Verification'
                };
            case 'evidence':
                return {
                    title: '📋 Evidence Pack (Bằng chứng Pháp lý)',
                    desc: 'Gói bằng chứng lưu trữ bất biến on-chain. Hash điều khoản, PSP reference, trạng thái thuê.',
                    fields: 'Terms Hash • Version • PSP Ref • Renter • Status • Delivery Hash'
                };
            case 'sbt':
                return {
                    title: '🔖 Rental SBT (Soulbound Token)',
                    desc: 'Token hợp đồng thuê KHÔNG THỂ chuyển nhượng, gắn vĩnh viễn với người thuê.',
                    fields: 'Bound Owner • Terms Hash'
                };
            case 'token':
                return {
                    title: '🪙 SuChin Token (ERC-20)',
                    desc: 'Token tiện ích cho thanh toán và đặt cọc trong giao dịch thuê sách.',
                    fields: 'Name • Symbol • Decimals • Total Supply • Balance'
                };
        }
    };

    const tabInfo = getTabDescription();

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>📊 On-Chain Data Explorer</h2>

                {/* On-Chain Only Notice */}
                <div style={{
                    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                    border: '1px solid #81c784',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>🔗</span>
                    <div>
                        <strong style={{ color: '#2e7d32' }}>Chỉ đọc dữ liệu On-Chain</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#558b2f' }}>
                            Truy vấn trực tiếp từ blockchain (Hardhat :8545). Không kết nối backend/database.
                        </p>
                    </div>
                </div>

                {/* Query Type Tabs */}
                <div style={styles.tabs}>
                    <button style={styles.tab(queryType === 'book')} onClick={() => handleQueryTypeChange('book')}>
                        📖 Book NFT
                    </button>
                    <button style={styles.tab(queryType === 'evidence')} onClick={() => handleQueryTypeChange('evidence')}>
                        📋 Evidence
                    </button>
                    <button style={styles.tab(queryType === 'sbt')} onClick={() => handleQueryTypeChange('sbt')}>
                        🔖 Rental SBT
                    </button>
                    <button style={styles.tab(queryType === 'token')} onClick={() => handleQueryTypeChange('token')}>
                        🪙 SUC Token
                    </button>
                </div>

                {/* Tab Description */}
                <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '20px',
                    borderLeft: '4px solid #3498db'
                }}>
                    <h4 style={{ margin: '0 0 6px 0', color: '#2c3e50', fontSize: '1rem' }}>{tabInfo?.title}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#5d6d7e' }}>{tabInfo?.desc}</p>
                    <div style={{ fontSize: '0.75rem', color: '#95a5a6' }}>
                        <strong>Dữ liệu:</strong> {tabInfo?.fields}
                    </div>
                </div>

                {/* Contract Address - READ ONLY */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>
                        🔒 Smart Contract Address
                        <span style={{ fontSize: '0.7rem', color: '#e74c3c', marginLeft: '6px' }}>(Không thể sửa)</span>
                    </label>
                    <div style={{
                        ...styles.input,
                        background: '#ecf0f1',
                        color: '#7f8c8d',
                        cursor: 'not-allowed',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                    }}>
                        {contractAddress}
                    </div>
                </div>

                {/* Query Input */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>{getInputLabel()}</label>
                    <input
                        style={styles.input}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={getInputPlaceholder()}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                    />
                </div>

                <button style={styles.button} onClick={handleQuery} disabled={loading}>
                    {loading ? '⏳ Đang query...' : '🔍 Query On-Chain'}
                </button>

                {error && <div style={styles.error}>❌ {error}</div>}

                {/* Book NFT Result */}
                {bookResult && (
                    <div style={styles.resultCard}>
                        <h3>📖 Book NFT #{bookResult.tokenId}</h3>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Owner</span>
                            <span style={styles.resultValue}>{shortenAddress(bookResult.owner)}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Status</span>
                            <span style={styles.badge(bookResult.isVerified ? '#27ae60' : '#e67e22')}>
                                {getBookStatusLabel(bookResult.status)}
                            </span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>IPFS CID</span>
                            <span style={styles.resultValue}>{bookResult.cid || 'N/A'}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Current User (Renter)</span>
                            <span style={styles.resultValue}>{shortenAddress(bookResult.user)}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>User Expires</span>
                            <span style={styles.resultValue}>{formatTimestamp(bookResult.userExpires)}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Last Verified At</span>
                            <span style={styles.resultValue}>{formatTimestamp(bookResult.lastVerifiedAt)}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Verified By</span>
                            <span style={styles.resultValue}>{shortenAddress(bookResult.lastVerifiedBy)}</span>
                        </div>
                    </div>
                )}

                {/* Evidence Pack Result */}
                {evidenceResult && (
                    <div style={styles.resultCard}>
                        <h3>📋 Evidence Pack (Book #{evidenceResult.bookTokenId})</h3>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Terms Hash</span>
                            <span style={styles.resultValue}>{evidenceResult.termsHash}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Version</span>
                            <span style={styles.resultValue}>{evidenceResult.version}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>PSP Reference</span>
                            <span style={styles.resultValue}>{evidenceResult.pspRef || 'N/A'}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Renter</span>
                            <span style={styles.resultValue}>{shortenAddress(evidenceResult.renter)}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Status</span>
                            <span style={styles.badge(evidenceResult.status === 0 ? '#27ae60' : '#3498db')}>
                                {getRentalStatusLabel(evidenceResult.status)}
                            </span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Created At</span>
                            <span style={styles.resultValue}>{formatTimestamp(evidenceResult.timestamp)}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Delivery Hash</span>
                            <span style={styles.resultValue}>{evidenceResult.deliveryHash}</span>
                        </div>
                    </div>
                )}

                {/* SBT Result */}
                {sbtResult && (
                    <div style={styles.resultCard}>
                        <h3>🔖 Rental SBT #{sbtResult.tokenId}</h3>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Owner (Bound To)</span>
                            <span style={styles.resultValue}>{shortenAddress(sbtResult.owner)}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Terms Hash</span>
                            <span style={styles.resultValue}>{sbtResult.termsHash}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Soulbound</span>
                            <span style={styles.badge('#9b59b6')}>Non-Transferable</span>
                        </div>
                    </div>
                )}

                {/* Token Result */}
                {tokenResult && (
                    <div style={styles.resultCard}>
                        <h3>🪙 {tokenResult.name} ({tokenResult.symbol})</h3>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Decimals</span>
                            <span style={styles.resultValue}>{tokenResult.decimals}</span>
                        </div>
                        <div style={styles.resultRow}>
                            <span style={styles.resultLabel}>Total Supply</span>
                            <span style={styles.resultValue}>{tokenResult.totalSupply} {tokenResult.symbol}</span>
                        </div>
                        {tokenResult.balance && (
                            <div style={styles.resultRow}>
                                <span style={styles.resultLabel}>Balance ({shortenAddress(tokenResult.queryAddress)})</span>
                                <span style={styles.resultValue}>{tokenResult.balance} {tokenResult.symbol}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnChainDataExplorer;
