/**
 * IR-3 FIX: ContractPreviewPage — Trang chuyên dụng xem & ký hợp đồng
 *
 * Flow:
 * 1. Đọc previewId từ URL params
 * 2. Hiển thị ContractPreview component (shared/ui)
 * 3. Accept → redirect về booking status page
 * 4. Reject → redirect về trang sách
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContractPreview from '../../shared/ui/ContractPreview';

const ContractPreviewPage: React.FC = () => {
    const { previewId } = useParams<{ previewId: string }>();
    const navigate = useNavigate();

    // Lấy userId từ localStorage (pattern hiện tại của app)
    const userId = localStorage.getItem('currentUser') || '';

    const handleAccept = () => {
        // Sau khi ký thành công → về trang account để xem booking
        navigate('/account');
    };

    const handleReject = () => {
        // Sau khi từ chối → về trang home để chọn sách khác
        navigate('/');
    };

    const handleClose = () => {
        navigate(-1);
    };

    if (!previewId) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>❌ Không tìm thấy ID hợp đồng. Vui lòng thử lại từ trang sách.</p>
                <button onClick={() => navigate('/')}>← Về trang chủ</button>
            </div>
        );
    }

    return (
        <ContractPreview
            previewId={previewId}
            onAccept={handleAccept}
            onReject={handleReject}
            onClose={handleClose}
        />
    );
};

export default ContractPreviewPage;
