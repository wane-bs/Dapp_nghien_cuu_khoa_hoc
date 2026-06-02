import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import SplitLayout from '../../../shared/ui/SplitLayout';
import ContractPreview from '../../../shared/ui/ContractPreview';
import axios from 'axios';
import { config } from '../../../config';
import { ethers } from 'ethers';
import { ContractService } from '../../../shared/web3/ContractService';
import { showSuccess, showError, showInfo } from '../../../shared/lib/toast';

interface UserContextType {
    user: { username: string; email: string; address: string; role?: string } | null;
}

// Preset button style
const presetBtnStyle = (isActive: boolean) => ({
    padding: '6px 12px',
    fontSize: '12px',
    border: isActive ? '2px solid #007bff' : '1px solid #ccc',
    backgroundColor: isActive ? '#e3f2fd' : '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal' as const
});

const Dashboard: React.FC = () => {
    const { user } = useOutletContext<UserContextType>();

    const [books, setBooks] = useState<any[]>([]);
    const [cartItem, setCartItem] = useState<{ id: number; title: string; price: number } | null>(null);
    const [balance, setBalance] = useState<number>(0);
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");

    // User-selectable duration
    const [selectedDuration, setSelectedDuration] = useState(7);
    const DURATION_OPTIONS = [3, 5, 7, 14, 21, 30];

    // Return evidence
    const [returnEvidence, setReturnEvidence] = useState<File | null>(null);

    // Contract Preview Modal
    const [showPreview, setShowPreview] = useState(false);

    // Trust Score
    const [trustData, setTrustData] = useState<{ score: number; band: string; stats: any } | null>(null);

    useEffect(() => {
        // Sprint 1: Read books from on-chain BookAsset contract
        const loadBooksOnChain = async () => {
            try {
                const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
                const cs = new ContractService(provider);
                const loadedBooks: any[] = [];
                // Changed to query up to 20 tokens to display newly minted ones
                for (let tokenId = 1; tokenId <= 20; tokenId++) {
                    try {
                        const status = await cs.bookAsset.getBookStatus(tokenId);
                        const owner = await cs.bookAsset.ownerOf(tokenId);
                        const cid = await cs.bookAsset.tokenCIDs(tokenId);
                        loadedBooks.push({
                            id: tokenId,
                            title: `Sách #${tokenId}`,
                            author: `Owner: ${String(owner).substring(0, 8)}...`,
                            price: 5000 + tokenId * 1000,
                            riskTier: tokenId <= 2 ? 'A' : tokenId <= 4 ? 'B' : 'C',
                            imageUrl: '',
                            tokenId: tokenId,
                            status: Number(status),
                            cid: cid
                        });
                    } catch { /* token doesn't exist */ }
                }
                setBooks(loadedBooks);
            } catch (e) {
                console.error('On-chain book fetch failed, trying API fallback', e);
                // Fallback to API if available
                axios.get(`${config.API_BASE_URL}/api/books`)
                    .then(res => setBooks(res.data))
                    .catch(e2 => console.error('API fallback also failed', e2));
            }
        };
        loadBooksOnChain();
    }, []);

    useEffect(() => {
        if (user) {
            // Sprint 1: Read ETH balance on-chain
            const loadBalance = async () => {
                try {
                    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
                    const bal = await provider.getBalance(user.address || user.username);
                    // Convert from Wei to display-friendly number
                    const ethBal = parseFloat(ethers.formatEther(bal));
                    setBalance(Math.round(ethBal * 1000)); // Simulate VND-like display
                } catch {
                    setBalance(0);
                }
            };
            loadBalance();
        }
    }, [user, booking]);

    useEffect(() => {
        // Poll on-chain status when booking is active and awaiting Admin confirmation
        let interval: ReturnType<typeof setInterval> | null = null;
        if (booking?.bookId && (booking.status === 'RETURN_REQUESTED' || booking.status === 'PAID')) {
            interval = setInterval(async () => {
                try {
                    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
                    const cs = new ContractService(provider);
                    const info = await cs.vault.getRentalInfo(booking.bookId);
                    const statusNum = Number(info[4]);
                    
                    if (statusNum === 2 && booking.status !== 'COMPLETED') { // 2 = COMPLETED
                        setBooking((prev: any) => ({
                            ...prev,
                            status: 'COMPLETED',
                            evidencePackHash: info[1] !== ethers.ZeroHash ? String(info[1]) : prev?.evidencePackHash
                        }));
                    } else if (statusNum === 1 && booking.status !== 'RETURN_REQUESTED') { // 1 = RETURN_REQUESTED
                        setBooking((prev: any) => ({
                            ...prev,
                            status: 'RETURN_REQUESTED',
                            evidencePackHash: info[1] !== ethers.ZeroHash ? String(info[1]) : prev?.evidencePackHash
                        }));
                    }
                } catch (e) {
                    // ignore errors (e.g. rental doesn't exist)
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [booking?.bookId, booking?.status]);

    // Sprint 3: Create rental directly on Smart Contract via MetaMask
    const handleRent = async (bookId: number, price: number) => {
        if (!user) return alert('Vui lòng đăng nhập!');
        setLoading(true);
        setStatusMsg('Đang mở MetaMask để ký giao dịch createRental...');
        try {
            if (typeof (window as any).ethereum === 'undefined') {
                alert('MetaMask chưa cài đặt!');
                return;
            }
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const cs = new ContractService(signer);
            const userAddr = await signer.getAddress();
            const durationSecs = selectedDuration * 24 * 60 * 60; // days to seconds
            const termsHash = `rent-${bookId}-${Date.now()}`;
            await cs.createRental(userAddr, bookId, durationSecs, termsHash, 1, 'local-psp', 0);
            // Set local booking state
            setBooking({
                code: `onchain-${bookId}`,
                bookingCode: `onchain-${bookId}`,
                assetId: `book-${bookId}`,
                bookId: bookId,
                price: price * selectedDuration,
                status: 'PAID',
                paid: true,
                username: userAddr,
                createdAt: new Date().toISOString()
            });
            setStatusMsg('✅ Thuê sách on-chain thành công! Giao dịch đã được ghi nhận trên Blockchain.');
            showSuccess('Thuê sách on-chain thành công! Giao dịch đã được ghi nhận trên Blockchain.');
        } catch (e: any) {
            alert('Lỗi on-chain: ' + (e.reason || e.message));
            setStatusMsg('');
        } finally {
            setLoading(false);
        }
    };

    // Sprint 3: No backend refresh needed — booking state is local
    const handleAcceptSuccess = () => {
        setShowPreview(false);
        setStatusMsg('✅ Hợp đồng đã được chấp thuận! Vui lòng thanh toán.');
        showSuccess('Hợp đồng đã được chấp thuận! Vui lòng thanh toán.');
        if (booking) {
            setBooking((prev: any) => ({ ...prev, status: 'SIGNED_PENDING_APPROVAL' }));
        }
    };

    const handleRejectSuccess = () => {
        setShowPreview(false);
        setStatusMsg("✅ Đã hủy yêu cầu thuê. Bạn có thể thuê sách mới.");
        showInfo("Đã hủy yêu cầu thuê. Bạn có thể thuê sách mới.");
        setBooking(null);
        setCartItem(null);
    };

    // Sprint 3: Unlock is local-only (no IoT backend)
    const handleUnlock = async () => {
        if (!booking) return;
        setStatusMsg('🔓 Mở khóa thành công! (Local mode - Không có IoT backend)');
        showSuccess('Mở khóa thiết bị IoT thành công!');
    };

    // Sprint 3: Wallet pay is local state update (on-chain rental already paid via createRental)
    const handleWalletPay = async () => {
        if (!booking) return;
        setBooking((prev: any) => ({ ...prev, status: 'PAID', paid: true }));
        setStatusMsg('✅ Thanh toán thành công! (On-chain rental đã bao gồm thanh toán)');
        showSuccess('Thanh toán thành công!');
    };

    // Sprint 3: Request return on-chain via MetaMask
    const handleReturnRequest = async () => {
        if (!booking) return;
        if (!returnEvidence) {
            if (!window.confirm('Bạn chưa upload bằng chứng trả sách. Tiếp tục?')) return;
        }
        try {
            if (typeof (window as any).ethereum === 'undefined') {
                alert('MetaMask chưa cài đặt!');
                return;
            }
            setStatusMsg('Mở MetaMask để ký giao dịch requestReturn...');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const cs = new ContractService(signer);
            const bookId = booking.bookId || parseInt((booking.assetId || '').replace(/\D/g, '')) || 1;
            const deliveryHash = `return-${bookId}-${Date.now()}`;
            await cs.requestReturn(bookId, deliveryHash);
            setStatusMsg('✅ Đã gửi yêu cầu trả on-chain! Chờ Admin xác nhận...');
            showSuccess('Đã gửi yêu cầu trả sách on-chain! Đang chờ Admin xác nhận...');
            setBooking((prev: any) => ({ ...prev, status: 'RETURN_REQUESTED' }));
        } catch (e: any) {
            alert('Lỗi on-chain: ' + (e.reason || e.message));
        }
    };

    // Trust Score color config
    const trustBandConfig: Record<string, { color: string; bgColor: string; label: string; description: string }> = {
        'HIGH': { color: '#fff', bgColor: '#28a745', label: '⭐ Cao', description: '🏆 Điểm tín dụng cao (≥80) - Được ưu tiên duyệt tự động, cọc thấp hơn' },
        'MEDIUM': { color: '#000', bgColor: '#ffc107', label: '⚡ Trung bình', description: '📊 Điểm tín dụng trung bình (50-79) - Một số giao dịch cần xét duyệt' },
        'LOW': { color: '#fff', bgColor: '#dc3545', label: '⚠️ Thấp', description: '⚠️ Điểm tín dụng thấp (<50) - Cần cọc cao hơn, có thể bị từ chối sách Tier A' }
    };

    const LeftContent = (
        <div style={{ textAlign: 'center' }}>
            <h3>Giỏ thuê</h3>

            {/* Trust Score Display */}
            {trustData && (
                <div
                    style={{
                        margin: '10px 0 20px 0',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        color: '#fff'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>🎯 Trust Score</span>
                        <span
                            title="Điểm tín dụng dựa trên lịch sử thuê sách. Thuê đúng hẹn +10 điểm, trả muộn -10 điểm, có tranh chấp -20 điểm."
                            style={{ cursor: 'help', fontSize: '12px' }}
                        >
                            ℹ️
                        </span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' }}>
                        {trustData.score}/100
                    </div>
                    <span
                        title={trustBandConfig[trustData.band]?.description || ''}
                        style={{
                            display: 'inline-block',
                            padding: '4px 12px',
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
            )}

            <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '4px', margin: '20px 0' }}>
                {!booking ? "Chưa có sách nào" : (
                    <div>
                        <strong>Mã: {booking.bookingCode || booking.code}</strong><br />
                        Trạng thái: <span style={{ color: 'red', fontWeight: 'bold' }}>{booking.status}</span>
                    </div>
                )}
            </div>

            {booking && (
                <div style={{ marginTop: '20px', textAlign: 'left' }}>
                    <p>{statusMsg}</p>

                    {(booking.status === 'PENDING_ACCEPTANCE' || booking.status === 'PENDING_SIGN') && (
                        <div>
                            <div style={{ margin: '10px 0', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #1565c0' }}>
                                <p style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: '10px' }}>📜 Hợp đồng đang chờ xác nhận</p>
                                <p style={{ fontSize: '13px', color: '#555', marginBottom: '15px' }}>
                                    Vui lòng xem xét nội dung hợp đồng và chấp thuận hoặc từ chối.
                                </p>
                                <button
                                    className="btn-primary"
                                    style={{ backgroundColor: '#1565c0', width: '100%' }}
                                    onClick={() => setShowPreview(true)}
                                >
                                    📖 Xem & Ký Hợp Đồng
                                </button>
                            </div>
                            {booking.contract?.termsHash && (
                                <div style={{ fontSize: '10px', marginTop: '8px', wordBreak: 'break-all', color: '#666' }}>
                                    <strong>Terms Hash:</strong>
                                    <code style={{ display: 'block', padding: '4px', background: '#f5f5f5', borderRadius: '2px', marginTop: '2px' }}>
                                        {booking.contract.termsHash}
                                    </code>
                                </div>
                            )}
                        </div>
                    )}

                    {booking.status === 'SIGNED_PENDING_APPROVAL' && (
                        <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
                            <p>⏳ <strong>Đang chờ Admin phê duyệt...</strong></p>
                        </div>
                    )}

                    {booking.status === 'SIGNED_UNPAID' && (
                        <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                            <p>Vui lòng thanh toán <strong>{booking.price?.toLocaleString()} VND</strong></p>
                            <button className="btn-primary" style={{ backgroundColor: '#4CAF50', marginTop: '10px' }} onClick={handleWalletPay}>
                                💳 Thanh toán Ví (Số dư: {balance.toLocaleString()} VND)
                            </button>
                        </div>
                    )}

                    {booking.status === 'PAID' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="btn-primary" onClick={handleUnlock}>
                                🔓 Mở Khóa Thiết Bị
                            </button>

                            {/* Return Evidence Upload */}
                            <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                    📸 Upload bằng chứng trả sách (tùy chọn):
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setReturnEvidence(e.target.files?.[0] || null)}
                                    style={{ fontSize: '12px' }}
                                />
                                {returnEvidence && <p style={{ fontSize: '11px', color: '#28a745', marginTop: '5px' }}>✅ Đã chọn: {returnEvidence.name}</p>}
                            </div>

                            <button className="btn-primary" style={{ backgroundColor: '#f44336' }} onClick={handleReturnRequest}>
                                🔄 Trả Sách (Yêu cầu)
                            </button>
                        </div>
                    )}

                    {booking.status === 'RETURN_REQUESTED' && (
                        <div style={{ color: 'orange', fontWeight: 'bold', marginTop: '10px' }}>
                            ⏳ Đang chờ Admin xác nhận tình trạng sách...
                        </div>
                    )}

                    {booking.status === 'COMPLETED' && (
                        <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #28a745' }}>
                            <div style={{ color: '#155724', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
                                ✅ Đã hoàn thành trả sách thành công!
                            </div>
                            <p style={{ color: '#155724', margin: '0 0 10px 0' }}>
                                Cảm ơn bạn đã sử dụng dịch vụ. Bạn có thể tiếp tục thuê sách mới.
                            </p>

                            {/* NEW: On-Chain Evidence Display */}
                            {(booking.evidencePackHash || booking.rentalSBTId) && (
                                <div style={{ backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                                    <strong style={{ fontSize: '12px', color: '#2e7d32' }}>📦 On-Chain Evidence:</strong>
                                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {booking.evidencePackHash && (
                                            <div style={{ fontSize: '11px' }}>
                                                <span style={{ color: '#666' }}>Evidence Pack: </span>
                                                <a href="/explorer/onchain" target="_blank" rel="noopener noreferrer"
                                                    style={{ color: '#1976d2', fontFamily: 'monospace' }}>
                                                    📜 {booking.evidencePackHash}
                                                </a>
                                            </div>
                                        )}
                                        {booking.rentalSBTId && (
                                            <div style={{ fontSize: '11px' }}>
                                                <span style={{ color: '#666' }}>Rental SBT: </span>
                                                <a href="/explorer/onchain" target="_blank" rel="noopener noreferrer"
                                                    style={{ color: '#1976d2', fontFamily: 'monospace' }}>
                                                    🔖 #{booking.rentalSBTId}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                style={{ backgroundColor: '#28a745' }}
                                onClick={() => { setBooking(null); setCartItem(null); setStatusMsg(''); }}
                            >
                                📚 Thuê Sách Mới
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!booking && cartItem && (
                <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #4CAF50', borderRadius: '4px', textAlign: 'left' }}>
                    <h4>Đang chọn:</h4>
                    <p style={{ fontWeight: 'bold' }}>{cartItem.title}</p>
                    <p>Giá/ngày: {cartItem.price.toLocaleString()} VND</p>

                    {/* Duration Selector */}
                    <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                            📅 Chọn thời hạn thuê: <span style={{ color: '#007bff' }}>{selectedDuration} ngày</span>
                        </label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {DURATION_OPTIONS.map(opt => (
                                <button key={opt} type="button" style={presetBtnStyle(selectedDuration === opt)} onClick={() => setSelectedDuration(opt)}>
                                    {opt} ngày
                                </button>
                            ))}
                        </div>
                        <p style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                            💰 Tổng: {(cartItem.price * selectedDuration).toLocaleString()} VND
                        </p>
                    </div>

                    <button className="btn-primary" onClick={() => handleRent(cartItem.id, cartItem.price)} disabled={loading} style={{ marginTop: '15px', width: '100%' }}>
                        {loading ? "Đang xử lý..." : "📝 Tạo Hợp Đồng Thuê"}
                    </button>
                    <button style={{ marginTop: '5px', padding: '5px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCartItem(null)}>
                        Hủy chọn
                    </button>
                </div>
            )}
        </div>
    );

    // Contract Preview Modal
    const ContractModal = showPreview && booking?.previewId ? (
        <ContractPreview
            previewId={booking.previewId}
            onClose={() => setShowPreview(false)}
            onAccept={handleAcceptSuccess}
            onReject={handleRejectSuccess}
        />
    ) : null;

    // Tier configuration with colors and descriptions
    const tierConfig: Record<string, { color: string; bgColor: string; label: string; description: string }> = {
        'A': {
            color: '#fff',
            bgColor: '#dc3545',
            label: 'Tier A',
            description: '📕 Sách hiếm/đắt (>5M VND) - Yêu cầu cọc cao, kiểm duyệt nghiêm ngặt'
        },
        'B': {
            color: '#000',
            bgColor: '#ffc107',
            label: 'Tier B',
            description: '📙 Sách phổ thông (500K-5M VND) - Yêu cầu cọc trung bình'
        },
        'C': {
            color: '#fff',
            bgColor: '#28a745',
            label: 'Tier C',
            description: '📗 Sách bình dân (<500K VND) - Dễ thuê, cọc thấp'
        }
    };

    const RightContent = (
        <div>
            {books.length === 0 && <p>Đang tải danh sách sách...</p>}
            {books.map((b) => {
                const tier = tierConfig[b.riskTier] || tierConfig['C'];
                return (
                    <div key={b.id} style={{ display: 'flex', gap: '20px', padding: '20px 0', borderBottom: '1px solid #eee' }}>
                        <img
                            src={b.imageUrl || '/images/books/placeholder.jpg'}
                            alt={b.title}
                            style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x140?text=No+Image'; }}
                        />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: '8px' }}>{b.title}</h4>
                            <p style={{ margin: '4px 0' }}>Tác giả: {b.author}</p>

                            {/* Token ID + On-Chain Link */}
                            {b.tokenId !== undefined && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#666' }}>Token ID:</span>
                                    <a
                                        href={`/explorer/onchain`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xem on-chain data trong Explorer"
                                        style={{
                                            fontSize: '11px',
                                            color: '#3498db',
                                            textDecoration: 'none',
                                            padding: '2px 6px',
                                            background: '#e8f4fc',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        🔗 #{b.tokenId}
                                    </a>
                                </div>
                            )}

                            {/* Tier Badge with Tooltip */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                <span
                                    title={tier.description}
                                    style={{
                                        display: 'inline-block',
                                        padding: '3px 10px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: tier.color,
                                        backgroundColor: tier.bgColor,
                                        borderRadius: '12px',
                                        cursor: 'help',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    {tier.label}
                                </span>
                                <span
                                    title="Tier phân loại độ hiếm: A = Hiếm/Đắt, B = Phổ thông, C = Bình dân"
                                    style={{ fontSize: '12px', color: '#888', cursor: 'help' }}
                                >
                                    ℹ️
                                </span>
                            </div>

                            <p style={{ fontWeight: 'bold', color: '#28a745', marginTop: '8px' }}>{b.price?.toLocaleString()} VND/ngày</p>
                        </div>
                        <div>
                            <button
                                className="btn-primary"
                                style={{
                                    width: 'auto',
                                    padding: '8px 16px',
                                    backgroundColor: user?.role === 'ADMIN' ? '#999' : (cartItem?.id === b.id ? '#4CAF50' : '#2196F3'),
                                    cursor: user?.role === 'ADMIN' ? 'not-allowed' : 'pointer'
                                }}
                                onClick={() => setCartItem({ id: b.id, title: b.title, price: b.price })}
                                disabled={loading || (booking && booking.status !== 'COMPLETED') || user?.role === 'ADMIN'}
                            >
                                {user?.role === 'ADMIN' ? '👁️ Chỉ xem' : (cartItem?.id === b.id ? "Đã chọn" : "🛒 Chọn")}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            {ContractModal}
            <SplitLayout left={LeftContent} right={RightContent} />
        </>
    );
};

export default Dashboard;
