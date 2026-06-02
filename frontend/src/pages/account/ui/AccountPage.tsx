import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import SplitLayout from '../../../shared/ui/SplitLayout';
import axios from 'axios';
import { config } from '../../../config';
import { ethers } from 'ethers';

interface UserContextType {
    user: { username: string; email: string; address: string } | null;
}

const Account: React.FC = () => {
    const { user } = useOutletContext<UserContextType>();
    const [history, setHistory] = useState<any[]>([]);
    const [trustData, setTrustData] = useState<{ score: number; band: string; stats: any } | null>(null);

    useEffect(() => {
        if (user) {
            // Sprint 1: No backend API — read on-chain balance only
            const loadOnChain = async () => {
                try {
                    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
                    const bal = await provider.getBalance(user.address || user.username);
                    const ethBal = parseFloat(ethers.formatEther(bal));
                    // Set a mock trust score based on balance
                    setTrustData({
                        score: ethBal > 9000 ? 90 : 70,
                        band: ethBal > 9000 ? 'HIGH' : 'MEDIUM',
                        stats: { completedRentals: 0, lateReturns: 0, disputes: 0 }
                    });
                } catch {
                    setTrustData(null);
                }
            };
            loadOnChain();
            // Bookings history: not available without backend
            setHistory([]);
        }
    }, [user]);

    const handleReturn = async (code: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn trả sách này?")) return;
        try {
            await axios.post(`${config.API_BASE_URL}/api/booking/${code}/return-request`, {
                deliveryHash: "MOCK_DELIVERY_PROOF_" + Date.now()
            });
            alert("Đã gửi yêu cầu trả sách thành công!");
            // Force refresh (simplified)
            const res = await axios.get(`${config.API_BASE_URL}/api/user/${user!.username}/bookings`);
            setHistory(res.data);
        } catch (error: any) {
            alert("Lỗi: " + (error.response?.data?.error || error.message));
        }
    };

    // Trust Score color config
    const trustBandConfig: Record<string, { color: string; bgColor: string; label: string; description: string }> = {
        'HIGH': { color: '#fff', bgColor: '#28a745', label: '⭐ Cao', description: '🏆 Điểm tín dụng cao (≥80) - Được ưu tiên duyệt tự động, cọc thấp hơn' },
        'MEDIUM': { color: '#000', bgColor: '#ffc107', label: '⚡ Trung bình', description: '📊 Điểm tín dụng trung bình (50-79) - Một số giao dịch cần xét duyệt' },
        'LOW': { color: '#fff', bgColor: '#dc3545', label: '⚠️ Thấp', description: '⚠️ Điểm tín dụng thấp (<50) - Cần cọc cao hơn, có thể bị từ chối sách Tier A' }
    };

    const LeftContent = (
        <div style={{ textAlign: 'left' }}>
            <div style={{ padding: '10px', fontWeight: 'bold' }}>Thông tin tài khoản</div>
            <div style={{ padding: '10px' }}>User: {user?.username}</div>
            <div style={{ padding: '10px', wordBreak: 'break-all', fontSize: '12px' }}>Wallet: {user?.address}</div>

            {/* Trust Score Section */}
            {trustData && (
                <div
                    style={{
                        margin: '15px 10px',
                        padding: '15px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '10px',
                        color: '#fff'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>🎯 Trust Score</span>
                        <span
                            title="Điểm tín dụng dựa trên lịch sử thuê sách. Thuê đúng hẹn +10 điểm, trả muộn -10 điểm, có tranh chấp -20 điểm."
                            style={{ cursor: 'help', fontSize: '12px' }}
                        >
                            ℹ️
                        </span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
                        {trustData.score}/100
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <span
                            title={trustBandConfig[trustData.band]?.description || ''}
                            style={{
                                display: 'inline-block',
                                padding: '4px 14px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: trustBandConfig[trustData.band]?.color || '#000',
                                backgroundColor: trustBandConfig[trustData.band]?.bgColor || '#ccc',
                                borderRadius: '12px',
                                cursor: 'help'
                            }}
                        >
                            {trustBandConfig[trustData.band]?.label || trustData.band}
                        </span>
                    </div>

                    {/* Stats Breakdown */}
                    <div style={{ fontSize: '11px', opacity: 0.9, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>✅ Thuê hoàn thành:</span>
                            <span style={{ fontWeight: 'bold' }}>{trustData.stats?.completedRentals || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>⏰ Trả muộn:</span>
                            <span style={{ fontWeight: 'bold', color: '#ffcccc' }}>{trustData.stats?.lateReturns || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>⚠️ Tranh chấp:</span>
                            <span style={{ fontWeight: 'bold', color: '#ffcccc' }}>{trustData.stats?.disputes || 0}</span>
                        </div>
                    </div>
                </div>
            )}

            <hr />
            <div style={{ padding: '10px' }}>Lịch sử thuê</div>
        </div>
    );

    const RightContent = (
        <div>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Lịch sử thuê ({history.length})</h3>

            {history.length === 0 && <p>Chưa có giao dịch nào.</p>}

            {history.map((item) => (
                <div key={item.code} style={{ display: 'flex', gap: '20px', padding: '20px 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ width: '80px', height: '100px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Book
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.code}</div>
                        <div>Sách ID: {item.assetId}</div>
                        <small>Ngày tạo: {new Date(item.createdAt).toLocaleString()}</small>
                        <br />
                        {/* Return Button */}
                        {(item.status === 'PAID' || item.status === 'ACTIVE' || item.status === 'SIGNED_UNPAID') && (
                            <button
                                onClick={() => handleReturn(item.code)}
                                style={{ marginTop: '5px', fontSize: '12px', padding: '2px 8px', cursor: 'pointer' }}
                            >
                                Trả Sách (Yêu cầu)
                            </button>
                        )}
                    </div>
                    <div style={{ fontWeight: 'bold', color: item.status === 'PAID' ? 'green' : 'orange' }}>
                        {item.status}
                        {item.rentalSBTId && (
                            <div style={{ marginTop: '5px', fontSize: '11px', color: '#8e44ad' }}>
                                SBT #{item.rentalSBTId}
                            </div>
                        )}
                        {item.evidencePackHash && (
                            <div style={{ marginTop: '2px', fontSize: '10px', color: '#666', cursor: 'pointer' }}
                                title={item.evidencePackHash}
                                onClick={() => { navigator.clipboard.writeText(item.evidencePackHash); alert("Copied Hash!"); }}
                            >
                                📜 Copy EVD Hash
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return <SplitLayout left={LeftContent} right={RightContent} />;
};

export default Account;
