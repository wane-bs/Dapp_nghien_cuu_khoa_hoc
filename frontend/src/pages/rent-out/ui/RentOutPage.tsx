import React from 'react';
import { useOutletContext } from 'react-router-dom';
import SplitLayout from '../../../shared/ui/SplitLayout';
import ContractPreview from '../../../shared/ui/ContractPreview';
import { ethers } from 'ethers';
import { ContractService } from '../../../shared/web3/ContractService';
import { showSuccess } from '../../../shared/lib/toast';

interface UserContextType {
    user: { username: string; email: string; address: string } | null;
}

// Preset button styles
const presetBtnStyle = (isActive: boolean) => ({
    padding: '6px 12px',
    fontSize: '12px',
    border: isActive ? '2px solid #007bff' : '1px solid #ccc',
    backgroundColor: isActive ? '#e3f2fd' : '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal' as const
});

const RentOut: React.FC = () => {
    const { user } = useOutletContext<UserContextType>();
    const [file, setFile] = React.useState<File | null>(null);
    const [title, setTitle] = React.useState("");
    const [price, setPrice] = React.useState("");
    const [status, setStatus] = React.useState("");
    const [isApproved, setIsApproved] = React.useState(false);
    const [showContractPreview, setShowContractPreview] = React.useState(false);

    // Configurable Rental Parameters (Lender inputs)
    const [depositPercent, setDepositPercent] = React.useState(100); // % of book value
    const [lateFeePercent, setLateFeePercent] = React.useState(10);  // % of daily price
    const [minDuration, setMinDuration] = React.useState(3);         // days
    const [maxDuration, setMaxDuration] = React.useState(14);        // days

    // Preset options
    const DEPOSIT_OPTIONS = [50, 80, 100, 120, 150]; // %
    const LATE_FEE_OPTIONS = [5, 10, 15, 20, 25];    // %
    const MIN_DURATION_OPTIONS = [1, 3, 5, 7];       // days
    const MAX_DURATION_OPTIONS = [7, 14, 21, 30];    // days

    // Calculated values
    const priceNum = parseFloat(price) || 0;
    const depositAmount = Math.round(priceNum * depositPercent / 100);
    const lateFeeAmount = Math.round(priceNum * lateFeePercent / 100);

    // Sprint 2: Approve is local-only (no backend needed)
    const handleApprove = async () => {
        setStatus('Đang kiểm tra MetaMask...');
        if (typeof (window as any).ethereum === 'undefined') {
            setStatus('MetaMask chưa được cài đặt!');
            return;
        }
        setIsApproved(true);
        setStatus('✅ Đã xác nhận quyền. Bạn có thể niêm yết sách.');
        showSuccess('Đã xác nhận quyền. Bạn có thể niêm yết sách.');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Sprint 2 (Refactored): Lender no longer mints on-chain
    // They must copy their Public Key and send to Admin
    const handleCopyAddress = () => {
        if (user && user.address) {
            navigator.clipboard.writeText(user.address);
            alert("Đã sao chép Mã chủ sách (Public Key)!");
        } else {
            alert("Không tìm thấy địa chỉ ví!");
        }
    };

    const canShowPreview = title.trim() !== "" && price.trim() !== "" && parseFloat(price) > 0;

    const LeftContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#0056b3', marginTop: 0 }}>Cấp quyền Niêm yết (Custodial Mode)</h3>
            <p style={{ lineHeight: '1.6', color: '#333' }}>
                Hệ thống <strong>VinaLib-Vault</strong> hiện đang hoạt động theo cơ chế quản lý tập trung (Custodial) ở cấp độ Hợp đồng thông minh (Smart Contract). Điều này có nghĩa là chỉ có <strong>Admin / Quản trị viên hệ thống</strong> mới có quyền khởi tạo (Mint) và ghi nhận tài sản sách mới lên Blockchain.
            </p>
            <p style={{ lineHeight: '1.6', color: '#333' }}>
                Để niêm yết sách, bạn vui lòng thực hiện các bước sau:
            </p>
            <ol style={{ lineHeight: '1.8', color: '#555', paddingLeft: '20px' }}>
                <li>Sao chép <strong>Mã chủ sách (Public Key)</strong> của bạn ở nút bên dưới.</li>
                <li>Chuẩn bị thông tin sách (Tên sách, ảnh bìa, giá thuê đề xuất).</li>
                <li>Liên hệ với Admin và cung cấp các thông tin trên cùng Mã chủ sách của bạn.</li>
            </ol>

            <div style={{ marginTop: '15px', padding: '15px', border: '1px dashed #007bff', borderRadius: '6px', backgroundColor: '#e9ecef', textAlign: 'center' }}>
                <span style={{ display: 'block', marginBottom: '10px', fontSize: '12px', color: '#666' }}>Mã chủ sách của bạn:</span>
                <strong style={{ wordBreak: 'break-all', fontSize: '14px', fontFamily: 'monospace' }}>
                    {user?.address || 'Chưa đăng nhập / Chưa kết nối ví'}
                </strong>
            </div>

            <button
                className="btn-primary"
                onClick={handleCopyAddress}
                disabled={!user?.address}
                style={{ marginTop: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold' }}
            >
                📋 C/C Sao chép Mã chủ sách
            </button>
        </div>
    );

    const RightContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
            <h4 style={{ color: '#666', marginBottom: '10px' }}>Đang chờ xử lý từ Quản trị viên</h4>
            <p style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
                Sách của bạn sẽ xuất hiện trong tab <strong>"Quản lý sách"</strong> sau khi được Admin xác nhận và tạo giao dịch thành công trên Blockchain.
            </p>
        </div>
    );

    return (
        <>
            <div style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '20px', fontWeight: 'bold' }}>➕ Niêm yết sách</div>
            <SplitLayout left={LeftContent} right={RightContent} />
        </>
    );
};

export default RentOut;
