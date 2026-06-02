import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Card, Button, Badge } from '../../../shared/ui';
import ContractPreview from '../../../shared/ui/ContractPreview';
import { ethers } from 'ethers';
import { ContractService } from '../../../shared/web3/ContractService';

/**
 * Book Detail Page - Chi tiết sách
 * Route: /books/:id
 * Mapping với Mockup: 2. NGƯỜI THUÊ/NT_TỦ SÁCH_CHI TIẾT SÁCH
 */

interface Book {
    id: number;
    title: string;
    author: string;
    price: number;
    owner: string;
    verified: boolean;
    riskTier?: string;
    collateralPercent?: number;
    lateFeePercent?: number;
    minRentalDays?: number;
}

interface UserContextType {
    user: {
        username: string;
        email: string;
        address: string;
        role: string;
    };
}

const BookDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useOutletContext<UserContextType>();

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDuration, setSelectedDuration] = useState(7);
    const [renting, setRenting] = useState(false);

    const [showPreview, setShowPreview] = useState(false);
    const [previewId, setPreviewId] = useState<string>('');

    useEffect(() => {
        // Sprint 4: Read book on-chain from BookAsset contract
        const fetchBook = async () => {
            try {
                const tokenId = parseInt(id || '0');
                const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
                const cs = new ContractService(provider);
                const owner = await cs.bookAsset.ownerOf(tokenId);
                const status = await cs.bookAsset.getBookStatus(tokenId);
                const cid = await cs.bookAsset.tokenCIDs(tokenId);
                setBook({
                    id: tokenId,
                    title: `Sách #${tokenId}`,
                    author: 'On-chain Author',
                    price: 5000 + tokenId * 1000,
                    owner: String(owner).substring(0, 10) + '...',
                    verified: Number(status) === 1,
                    riskTier: 'B',
                    collateralPercent: 100,
                });
            } catch (err) {
                setError('Không tìm thấy sách on-chain');
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    // Sprint 4: Create rental on-chain via MetaMask
    const handleRent = async () => {
        if (!book || !user) return;
        setRenting(true);
        try {
            if (typeof (window as any).ethereum === 'undefined') {
                alert('MetaMask chưa cài đặt!');
                return;
            }
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const cs = new ContractService(signer);
            const userAddr = await signer.getAddress();
            const durationSecs = selectedDuration * 24 * 60 * 60;
            const termsHash = `rent-${book.id}-${Date.now()}`;
            await cs.createRental(userAddr, book.id, durationSecs, termsHash, 1, 'local-psp', 0);
            alert('✅ Thuê sách on-chain thành công!');
            navigate('/dashboard');
        } catch (err: any) {
            alert('Lỗi on-chain: ' + (err.reason || err.message));
        } finally {
            setRenting(false);
        }
    };

    const handleAcceptSuccess = () => {
        setShowPreview(false);
        navigate('/dashboard');
    };

    const handleRejectSuccess = () => {
        setShowPreview(false);
        // Maybe stay on page or refresh?
    };

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Đã sao chép link!');
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'var(--spacing-md)',
    };

    // ... [Styles omitted because they are unchanged, but I need to make sure I don't break the component render part]
    // The safest way is to keep the styles inside the component if I'm replacing lines within it.
    // However, I'm replacing a block that STARTS before styles and ENDS before render return.
    // I need to be careful with the lines.

    // Let's check lines 46 (useEffect) to 159 (return start)
    // Styles are between 87 and 131.

    // I will include styles in my replacement to be safe, filtering out unchanged lines if possible? No, replace_file_content is block based.
    // I will paste the entire logic block including styles.

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
    };

    const infoGridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)',
    };

    const labelStyle: React.CSSProperties = {
        color: 'var(--color-gray-600)',
        fontWeight: 'var(--font-weight-medium)' as any,
    };

    const priceStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-bold)' as any,
        color: 'var(--color-success)',
    };

    const durationSelectorStyle: React.CSSProperties = {
        display: 'flex',
        gap: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-md)',
    };

    const durationButtonStyle = (active: boolean): React.CSSProperties => ({
        padding: 'var(--spacing-sm) var(--spacing-md)',
        border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-gray-300)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: active ? 'var(--color-primary-light)' : 'var(--color-white)',
        cursor: 'pointer',
        fontWeight: active ? 'var(--font-weight-bold)' as any : 'normal',
    });

    if (loading) {
        return (
            <div style={containerStyle}>
                <Card>
                    <p>⏳ Đang tải thông tin sách...</p>
                </Card>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div style={containerStyle}>
                <Card>
                    <p style={{ color: 'var(--color-danger)' }}>❌ {error || 'Không tìm thấy sách'}</p>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                        ← Quay lại
                    </Button>
                </Card>
            </div>
        );
    }

    const totalCost = book.price * selectedDuration;
    const deposit = book.collateralPercent ? (book.price * book.collateralPercent / 100) : 0;

    return (
        <div style={containerStyle}>
            {showPreview && (
                <ContractPreview
                    previewId={previewId}
                    onClose={() => setShowPreview(false)}
                    onAccept={handleAcceptSuccess}
                    onReject={handleRejectSuccess}
                />
            )}
            {/* Header */}
            <div style={headerStyle}>
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                    ← Quay lại
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                    🔗 Sao chép link
                </Button>
            </div>

            {/* Book Info */}
            <Card title={`📚 ${book.title}`}>
                <div style={infoGridStyle}>
                    <span style={labelStyle}>Tác giả:</span>
                    <span>{book.author}</span>

                    <span style={labelStyle}>Chủ sở hữu:</span>
                    <span>{book.owner}</span>

                    <span style={labelStyle}>Trạng thái:</span>
                    <span>
                        {book.verified ? (
                            <Badge status="success">Đã xác minh</Badge>
                        ) : (
                            <Badge status="warning">Chờ xác minh</Badge>
                        )}
                    </span>

                    {book.riskTier && (
                        <>
                            <span style={labelStyle}>Hạng rủi ro:</span>
                            <Badge status={book.riskTier === 'A' ? 'success' : book.riskTier === 'B' ? 'warning' : 'danger'}>
                                Tier {book.riskTier}
                            </Badge>
                        </>
                    )}

                    <span style={labelStyle}>Giá thuê:</span>
                    <span style={priceStyle}>{book.price?.toLocaleString()} VND/ngày</span>

                    {deposit > 0 && (
                        <>
                            <span style={labelStyle}>Tiền cọc:</span>
                            <span>{deposit.toLocaleString()} VND ({book.collateralPercent}%)</span>
                        </>
                    )}
                </div>
            </Card>

            {/* Rent Section */}
            {user?.role !== 'ADMIN' && book.verified && (
                <Card title="🛒 Thuê sách này">
                    <p style={{ marginBottom: 'var(--spacing-md)' }}>Chọn thời hạn thuê:</p>

                    <div style={durationSelectorStyle}>
                        {[3, 7, 14, 30].map((days) => (
                            <button
                                key={days}
                                type="button"
                                style={durationButtonStyle(selectedDuration === days)}
                                onClick={() => setSelectedDuration(days)}
                            >
                                {days} ngày
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)' }}>
                        <p><strong>Tổng chi phí:</strong> {totalCost.toLocaleString()} VND</p>
                        {deposit > 0 && <p><strong>Tiền cọc:</strong> {deposit.toLocaleString()} VND</p>}
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                            * Tiền cọc sẽ được hoàn trả sau khi trả sách
                        </p>
                    </div>

                    <Button
                        variant="success"
                        onClick={handleRent}
                        disabled={renting || !book.verified}
                    >
                        {renting ? '⏳ Đang xử lý...' : '✅ Gửi yêu cầu thuê'}
                    </Button>
                </Card>
            )}
        </div>
    );
};

export default BookDetailPage;
