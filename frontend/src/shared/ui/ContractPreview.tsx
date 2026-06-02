import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { showSuccess, showInfo } from '../lib/toast';

/**
 * ContractPreview - Component hiển thị Hợp đồng cho thuê
 * 
 * Modes:
 * 1. Static Preview: Hiển thị mapping demo (nếu không có previewId)
 * 2. Real Preview: Fetch nội dung từ Backend API (nếu có previewId)
 */

interface RentalData {
    bookTitle: string;
    pricePerDay: number;
    deposit: number;
    lateFee: number;
    duration: number;
    lenderName: string;
    renterName: string;
}

interface ContractPreviewProps {
    rentalData?: RentalData; // Optional now
    previewId?: string;      // NEW: ID to fetch real contract
    onClose?: () => void;
    onAccept?: () => void;   // NEW: Callback after successful accept
    onReject?: () => void;   // NEW: Callback after reject
}

const ContractPreview: React.FC<ContractPreviewProps> = ({
    rentalData,
    previewId,
    onClose,
    onAccept,
    onReject
}) => {
    // State for Real Preview
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [termsHash, setTermsHash] = useState<string>('');
    const [actionLoading, setActionLoading] = useState(false);

    // Sprint 4: No backend — generate local content for preview
    useEffect(() => {
        if (previewId) {
            setLoading(true);
            // Simulate contract content locally
            const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
            setContent(`HỢP ĐỒNG THUÊ TÀI SẢN SỐ\n=============================\nMã hợp đồng: ${previewId}\nNgày tạo: ${new Date().toLocaleString()}\n\nĐiều 1: Đối tượng thuê - BookAsset NFT\nĐiều 2: Thời hạn - Theo thỏa thuận\nĐiều 3: Giá thuê - Theo niêm yết on-chain\nĐiều 4: Cam kết trả sách nguyên vẹn\n\n[Xác nhận bằng chữ ký điện tử trên Blockchain]`);
            setTermsHash(hash);
            setStatus('PENDING');
            setLoading(false);
        }
    }, [previewId]);

    // Sprint 4: Accept locally — no backend needed
    const handleAccept = async () => {
        if (!previewId) return;
        setActionLoading(true);
        try {
            showSuccess('Đã chấp thuận hợp đồng thành công! Vui lòng thanh toán để hoàn tất.');
            if (onAccept) onAccept();
        } finally {
            setActionLoading(false);
        }
    };

    // Sprint 4: Reject locally
    const handleReject = async () => {
        if (!previewId) return;
        if (!window.confirm('Bạn có chắc muốn từ chối và hủy yêu cầu thuê này?')) return;
        setActionLoading(true);
        try {
            showInfo('Đã hủy yêu cầu thuê. Bạn có thể thuê sách mới ngay bây giờ.');
            if (onReject) onReject();
        } finally {
            setActionLoading(false);
        }
    };

    // --- RENDER STATIC DEMO ---
    if (!previewId && rentalData) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', zIndex: 10 }}>
                <h3>📋 Hợp đồng Thuê Sách (Bản Xem trước)</h3>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', background: '#fff', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '15px' }}>
                    HỢP ĐỒNG THUÊ TÀI SẢN SỐ
=============================
Bên cho thuê: ${rentalData.lenderName}
Bên thuê: ${rentalData.renterName}

ĐIỀU KHOẢN GIAO DỊCH:
- Tài sản: Sách "${rentalData.bookTitle}"
- Thời lượng đăng ký: Tối đa ${rentalData.duration} ngày
- Đơn giá thuê: ${rentalData.pricePerDay.toLocaleString()} VND/ngày
- Phí đặt cọc: ${rentalData.deposit.toLocaleString()} VND (Hoàn trả khi trả sách nguyên vẹn)
- Phí phạt quá hạn: ${rentalData.lateFee.toLocaleString()} VND/ngày

Lưu ý: Đây là bản xem trước dựa trên tuỳ chọn niêm yết của bạn.
Hợp đồng chính thức sẽ được tạo và ký kết On-chain sau khi có khách hàng thực hiện giao dịch.
                </div>
                <Button onClick={onClose} variant="secondary">Đóng bản xem trước</Button>
            </div>
        );
    }

    // --- RENDER REAL PREVIEW ---
    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '90%',
                maxWidth: '800px',
                height: '85vh',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0 }}>📜 Xác nhận Hợp Đồng Thuê</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    padding: '24px',
                    overflowY: 'auto',
                    backgroundColor: '#fafafa',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải nội dung hợp đồng...</div>
                    ) : (
                        content
                    )}
                </div>

                {/* Footer / Actions */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #eee',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    alignItems: 'center'
                }}>
                    {loading ? null : (
                        <>
                            <div style={{ marginRight: 'auto', fontSize: '12px', color: '#666' }}>
                                Terms Hash: <code title={termsHash}>{termsHash.slice(0, 10)}...{termsHash.slice(-8)}</code>
                            </div>

                            <Button
                                variant="danger"
                                onClick={handleReject}
                                disabled={actionLoading}
                            >
                                ✕ Từ chối & Hủy
                            </Button>

                            <Button
                                variant="success"
                                onClick={handleAccept}
                                disabled={actionLoading}
                            >
                                {actionLoading ? '⏳ Đang xử lý...' : '✓ Đồng ý & Ký tên'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractPreview;

