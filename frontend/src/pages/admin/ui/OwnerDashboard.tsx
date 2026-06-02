import React, { useEffect, useState } from 'react';
import SplitLayout from '../../../shared/ui/SplitLayout';
import { ethers } from 'ethers';
import { ContractService } from '../../../shared/web3/ContractService';

import { dashboardStyles as styles } from '../../../shared/ui/dashboardStyles';
import { getBadgeStyle } from '../../../shared/lib/statusHelpers';

import { useOutletContext } from 'react-router-dom';
import { SafeService, LocalSafeTx } from '../../../shared/web3/SafeService';
import { BookAssetABI } from '../../../shared/web3/config';
import { showSuccess, showError, showInfo } from '../../../shared/lib/toast';

interface UserContextType {
    user: { username: string; email: string; address: string; role: string } | null;
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

const OwnerDashboard: React.FC = () => {
    const { user } = useOutletContext<UserContextType>();
    const [rentals, setRentals] = useState<any[]>([]);
    const [pendingBooks, setPendingBooks] = useState<any[]>([]);
    const [statusMsg, setStatusMsg] = useState("");
    const [activeTab, setActiveTab] = useState<'RENTALS' | 'BOOKS' | 'MINT' | 'CONFIG' | 'STATS' | 'SAFE'>('RENTALS');
    const [filter, setFilter] = useState<'ALL' | 'ATTENTION' | 'COMPLETED'>('ALL');

    // Mint Book State
    const [mintTitle, setMintTitle] = useState("");
    const [mintPrice, setMintPrice] = useState("");
    const [mintOwnerKey, setMintOwnerKey] = useState("");

    // Safe (Multi-sig) State Simulation
    const [safeAddress, setSafeAddress] = useState<string>('0x0000000000000000000000000000000000000000');
    const [pendingTxs, setPendingTxs] = useState<LocalSafeTx[]>([]);
    const [threshold, setThreshold] = useState<number>(1); // Changed to 1 for local 1-Admin testing

    // System Config State (Admin only)
    const [minCollateralRatio, setMinCollateralRatio] = useState(80);   // %
    const [platformFee, setPlatformFee] = useState(10);                  // %

    const COLLATERAL_OPTIONS = [50, 60, 70, 80, 90, 100];
    const PLATFORM_FEE_OPTIONS = [5, 10, 15, 20];

    // PHASE 1.5: System Stats
    const [systemStats, setSystemStats] = useState<any>(null);

    // Sprint 2: Fetch all books on-chain (Admin sees all)
    const fetchRentals = async () => {
        try {
            const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
            const cs = new ContractService(provider);
            const rentalList: any[] = [];
            for (let bookId = 1; bookId <= 20; bookId++) {
                try {
                    const info = await cs.vault.getRentalInfo(bookId);
                    const renter = String(info[2]);
                    if (renter && renter !== ethers.ZeroAddress) {
                        const statusNum = Number(info[4]);
                        let displayStatus = 'ACTIVE';
                        if (statusNum === 1) displayStatus = 'RETURN_REQUESTED';
                        else if (statusNum === 2) displayStatus = 'COMPLETED';

                        rentalList.push({
                            code: `onchain-${bookId}`,
                            username: renter.substring(0, 8) + '...',
                            assetId: `book-${bookId}`,
                            bookInfo: { title: `Sách #${bookId}`, tokenId: bookId },
                            evidencePackHash: info[1] !== ethers.ZeroHash ? String(info[1]) : '',
                            status: displayStatus,
                            createdAt: new Date(Number(info[5]) * 1000).toISOString()
                        });
                    }
                } catch {
                    // Ignore errors (e.g. no rental found or invalid book)
                }
            }
            setRentals(rentalList);
        } catch (e) {
            console.error('Fetch rentals error', e);
        }
    };

    // Sprint 2: Fetch pending books from on-chain (status = 0 = PendingVerification)
    const fetchPendingBooks = async () => {
        try {
            const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
            const cs = new ContractService(provider);
            const pending: any[] = [];
            for (let tokenId = 1; tokenId <= 10; tokenId++) {
                try {
                    const status = await cs.bookAsset.getBookStatus(tokenId);
                    if (Number(status) === 0) {
                        const owner = await cs.bookAsset.ownerOf(tokenId);
                        pending.push({
                            id: tokenId,
                            tokenId: tokenId,
                            title: `Sách #${tokenId}`,
                            price: 5000 + tokenId * 1000,
                            status: 'PENDING_VERIFICATION',
                            owner: String(owner)
                        });
                    }
                } catch { /* token doesn't exist */ }
            }
            setPendingBooks(pending);
        } catch (e) {
            console.error('Fetch pending books error', e);
        }
    };

    useEffect(() => {
        fetchRentals();
        fetchPendingBooks();
        const interval = setInterval(() => {
            fetchPendingBooks();
            fetchRentals();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Sprint 2: No backend stats
    const fetchStats = async () => {
        setSystemStats(null);
    };

    // Sprint 2: Confirm return directly on Smart Contract via MetaMask
    const handleConfirmReturn = async (code: string) => {
        const isDamaged = window.confirm(`Kiểm tra tình trạng sách ${code}:\n\n- Nhấn OK nếu sách bị HƯ HẠI.\n- Nhấn CANCEL nếu sách NGUYÊN VẸN.`);
        const notes = window.prompt("Ghi chú thêm (tùy chọn):", "") || "";
        try {
            if (typeof (window as any).ethereum === 'undefined') {
                alert('MetaMask chưa cài đặt!');
                return;
            }
            setStatusMsg('Mở MetaMask để ký giao dịch confirmReturn...');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const cs = new ContractService(signer);
            // code is like "book-1" -> extract tokenId
            const tokenId = parseInt(code.replace(/\D/g, '')) || 1;
            await cs.confirmReturn(tokenId, isDamaged, notes);
            setStatusMsg(`✅ Đã xác nhận trả sách Token #${tokenId} on-chain! (${isDamaged ? 'Hư hại' : 'Nguyên vẹn'})`);
            showSuccess(`Đã xác nhận trả sách Token #${tokenId} on-chain! (${isDamaged ? 'Hư hại' : 'Nguyên vẹn'})`);
        } catch (e: any) {
            alert('Lỗi on-chain: ' + (e.reason || e.message));
        }
    };

    // Sprint 2: Approve is a backend concept — not directly on Solidity in current flow
    const handleApprove = async (code: string) => {
        setStatusMsg(`⚠️ Phê duyệt luồng chưa có trên Smart Contract. Booking ${code} cần Sprint 3.`);
        showInfo(`Phê duyệt luồng chưa có trên Smart Contract. Booking ${code} cần Sprint 3.`);
    };

    // Sprint 2: Verify book listing on-chain via MetaMask -> Phase 4: Propose to Safe
    const handleVerifyBook = async (bookId: number) => {
        if (!window.confirm(`Xác nhận đề xuất duyệt sách ID: ${bookId} qua Gnosis Safe?`)) return;
        try {
            if (typeof (window as any).ethereum === 'undefined') {
                alert('MetaMask chưa cài đặt!');
                return;
            }
            setStatusMsg('Mở MetaMask để kết nối...');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();

            // Encode function data for Safe
            const bookAssetInterface = new ethers.Interface(BookAssetABI);
            const data = bookAssetInterface.encodeFunctionData("verifyForListing", [bookId]);

            const safeService = new SafeService(signer);

            setStatusMsg('Đang tạo đề xuất giao dịch trên Safe (Multi-sig)...');
            // Assuming ContractService.bookAsset address is known, we just use a placeholder for demo
            const cs = new ContractService(signer);
            const toAddress = await cs.bookAsset.getAddress();

            const proposal = await safeService.proposeTransaction(
                safeAddress,
                toAddress,
                data,
                `Verify book listing #${bookId}`
            );

            setPendingTxs(prev => [...prev, proposal]);
            setStatusMsg(`✅ Đã tạo Transaction Proposal để duyệt sách #${bookId}. Vui lòng chuyển sang Tab "SAFE" để thực hiện ký duyệt.`);
            showSuccess(`Đã tạo Transaction Proposal để duyệt sách #${bookId}. Vui lòng chuyển sang Tab "SAFE" để thực hiện ký duyệt.`);
        } catch (e: any) {
            alert('Lỗi tạo đề xuất Safe: ' + (e.reason || e.message));
        }
    };

    // Sign a pending Safe tx
    const handleSignSafeTx = async (txId: string) => {
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const safeService = new SafeService(signer);

            let txIndex = pendingTxs.findIndex(t => t.id === txId);
            if (txIndex === -1) return;
            let proposal = { ...pendingTxs[txIndex] };

            setStatusMsg('Mở MetaMask để Ký đề xuất...');
            proposal = await safeService.signTransaction(safeAddress, proposal);

            if (proposal.signatures.length >= threshold) {
                setStatusMsg('Threshold đạt yêu cầu. Đang tự động thực thi giao dịch...');
                proposal = await safeService.executeTransaction(safeAddress, proposal);
                setStatusMsg(`✅ Giao dịch đã thực thi thành công! (Threshold ${threshold}/${threshold})`);
                showSuccess(`Giao dịch đã thực thi thành công! (Threshold ${threshold}/${threshold})`);
            } else {
                setStatusMsg(`✅ Đã ký! (Threshold ${proposal.signatures.length}/${threshold})`);
                showSuccess(`Đã ký! (Threshold ${proposal.signatures.length}/${threshold})`);
            }

            const newTxs = [...pendingTxs];
            newTxs[txIndex] = proposal;
            setPendingTxs(newTxs);
            fetchPendingBooks();
        } catch (e: any) {
            alert('Lỗi ký Safe Tx: ' + (e.reason || e.message));
        }
    };

    // Admin Mint Book (Custodial)
    const handleMintBook = async () => {
        if (!mintTitle || !mintPrice || !mintOwnerKey) {
            alert('Vui lòng nhập đầy đủ thông tin (Tên sách, Giá, Mã chủ sách)!');
            return;
        }

        if (!ethers.isAddress(mintOwnerKey)) {
            alert('Mã chủ sách (Public Key) không hợp lệ!');
            return;
        }

        try {
            if (typeof (window as any).ethereum === 'undefined') {
                setStatusMsg('MetaMask chưa cài đặt!');
                return;
            }
            setStatusMsg('Mở MetaMask để ký giao dịch safeMint...');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const cs = new ContractService(signer);

            // Create a mock CID from title
            const mockCID = `Qm${mintTitle.replace(/\s/g, '').substring(0, 20)}_${Date.now()}`;
            const tx = await cs.bookAsset.safeMint(mintOwnerKey, mockCID);
            const receipt = await tx.wait();
            setStatusMsg(`✅ Cấp phát sách thành công on-chain! Tx: ${receipt.hash.substring(0, 20)}...`);
            showSuccess(`Cấp phát sách thành công on-chain! Tx: ${receipt.hash.substring(0, 20)}...`);

            // Clear form
            setMintTitle("");
            setMintPrice("");
            setMintOwnerKey("");

            // Refresh pending books
            fetchPendingBooks();
            setActiveTab('BOOKS');
        } catch (e: any) {
            setStatusMsg(`Lỗi on-chain: ${e.reason || e.message}`);
        }
    };

    const attentionCount = rentals.filter(r => r.status === 'RETURN_REQUESTED' || r.status === 'SIGNED_PENDING_APPROVAL').length;

    const filteredRentals = rentals.filter(r => {
        if (filter === 'ALL') return true;
        if (filter === 'COMPLETED') return r.status === 'COMPLETED';
        if (filter === 'ATTENTION') return r.status === 'RETURN_REQUESTED' || r.status === 'SIGNED_PENDING_APPROVAL';
        return true;
    });

    const LeftContent = (
        <div>
            <div style={styles.card}>
                <h3>🔐 Admin Dashboard</h3>
                <p style={{ color: '#666' }}>Quản lý tập trung hệ thống.</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setActiveTab('RENTALS')}
                    style={{ ...styles.tab(activeTab === 'RENTALS'), flex: 1 }}
                >
                    📋 Đơn hàng
                </button>
                <button
                    onClick={() => setActiveTab('BOOKS')}
                    style={{ ...styles.tab(activeTab === 'BOOKS'), flex: 1, position: 'relative' }}
                >
                    📚 Duyệt Khóa
                    {pendingBooks.length > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#dc3545', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {pendingBooks.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('MINT')}
                    style={{ ...styles.tab(activeTab === 'MINT'), flex: 1 }}
                >
                    ➕ Cấp phát
                </button>
                <button
                    onClick={() => setActiveTab('CONFIG')}
                    style={{ ...styles.tab(activeTab === 'CONFIG'), flex: 1 }}
                >
                    ⚙️ Cấu hình
                </button>
                <button
                    onClick={() => setActiveTab('STATS')}
                    style={{ ...styles.tab(activeTab === 'STATS'), flex: 1 }}
                >
                    📊 Thống kê
                </button>
                <button
                    onClick={() => setActiveTab('SAFE')}
                    style={{ ...styles.tab(activeTab === 'SAFE'), flex: 1, backgroundColor: activeTab === 'SAFE' ? '#e8f5e9' : '#fff', borderColor: '#4caf50', color: '#4caf50', fontWeight: 'bold' }}
                >
                    🛡️ SAFE ({pendingTxs.filter(t => !t.executed).length})
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <div style={{ ...styles.statCard, flex: 1 }}>
                    <div style={styles.statNumber}>{attentionCount}</div>
                    <div>Cần Xử Lý</div>
                </div>
                <div style={{ ...styles.statCard, flex: 1, background: '#fff3cd', color: '#000', border: '1px solid #ffc107' }}>
                    <div style={styles.statNumber}>{pendingBooks.length}</div>
                    <div>Sách Chờ</div>
                </div>
            </div>

            {statusMsg && (
                <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginTop: '10px' }}>
                    {statusMsg}
                </div>
            )}
        </div>
    );

    const RentalsTab = (
        <div style={styles.card}>
            <div style={styles.tabGroup}>
                <button style={styles.tab(filter === 'ATTENTION')} onClick={() => setFilter('ATTENTION')}>
                    ⚠️ Cần xử lý ({attentionCount})
                </button>
                <button style={styles.tab(filter === 'ALL')} onClick={() => setFilter('ALL')}>
                    Tất cả
                </button>
                <button style={styles.tab(filter === 'COMPLETED')} onClick={() => setFilter('COMPLETED')}>
                    Hoàn tất
                </button>
            </div>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Mã Đơn</th>
                        <th style={styles.th}>Người Thuê</th>
                        <th style={styles.th}>Sách</th>
                        <th style={styles.th}>On-Chain</th>
                        <th style={styles.th}>Evidence</th>
                        <th style={styles.th}>SBT ID</th>
                        <th style={styles.th}>Trạng Thái</th>
                        <th style={styles.th}>Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRentals.length === 0 && (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Không có dữ liệu
                            </td>
                        </tr>
                    )}
                    {filteredRentals.map((item) => (
                        <tr key={item.code}>
                            <td style={styles.td}>
                                <strong>{item.code}</strong><br />
                                <small style={{ color: '#999' }}>{new Date(item.createdAt).toLocaleDateString()}</small>
                            </td>
                            <td style={styles.td}>{item.username}</td>
                            <td style={styles.td}>{item.bookInfo?.title || item.assetId}</td>
                            <td style={styles.td}>
                                {item.bookInfo?.tokenId !== undefined ? (
                                    <a
                                        href="/explorer/onchain"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xem on-chain data"
                                        style={{ color: '#3498db', textDecoration: 'none', fontSize: '11px', fontFamily: 'monospace' }}
                                    >
                                        🔗 #{item.bookInfo.tokenId}
                                    </a>
                                ) : (
                                    <span style={{ color: '#999', fontSize: '10px' }}>-</span>
                                )}
                            </td>
                            <td style={styles.td}>
                                {item.evidencePackHash ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <a
                                            href="/explorer/onchain"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={item.evidencePackHash}
                                            style={{ color: '#27ae60', textDecoration: 'none', fontSize: '10px' }}
                                        >
                                            📜 EVD
                                        </a>
                                        <span
                                            onClick={() => { navigator.clipboard.writeText(item.evidencePackHash); alert("Copied Hash!"); }}
                                            style={{ cursor: 'pointer', fontSize: '10px' }}
                                            title="Copy Hash"
                                        >
                                            📋
                                        </span>
                                    </div>
                                ) : (
                                    <span style={{ color: '#999', fontSize: '10px' }}>-</span>
                                )}
                            </td>
                            <td style={styles.td}>
                                {item.rentalSBTId ? (
                                    <a
                                        href="/explorer/onchain"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#8e44ad', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold' }}
                                    >
                                        🔖 #{item.rentalSBTId}
                                    </a>
                                ) : (
                                    <span style={{ color: '#999', fontSize: '10px' }}>Pending</span>
                                )}
                            </td>
                            <td style={styles.td}>
                                <span style={getBadgeStyle(item.status)}>{item.status}</span>
                            </td>
                            <td style={styles.td}>
                                {item.status === 'SIGNED_PENDING_APPROVAL' && (
                                    <button className="btn-primary" style={{ backgroundColor: '#007bff', fontSize: '12px', padding: '5px 10px' }} onClick={() => handleApprove(item.code)}>
                                        ✍️ Duyệt
                                    </button>
                                )}
                                {item.status === 'RETURN_REQUESTED' && (
                                    <button className="btn-primary" style={{ backgroundColor: '#28a745', fontSize: '12px', padding: '5px 10px' }} onClick={() => handleConfirmReturn(item.code)}>
                                        ✅ Xác nhận
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const BooksTab = (
        <div style={styles.card}>
            <h4>📚 Sách Chờ Duyệt ({pendingBooks.length})</h4>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Token ID</th>
                        <th style={styles.th}>Tên Sách</th>
                        <th style={styles.th}>Giá</th>
                        <th style={styles.th}>Trạng Thái</th>
                        <th style={styles.th}>Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingBooks.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Không có sách nào chờ duyệt
                            </td>
                        </tr>
                    )}
                    {pendingBooks.map((book) => (
                        <tr key={book.id}>
                            <td style={styles.td}>{book.id}</td>
                            <td style={styles.td}>
                                {book.tokenId !== undefined ? (
                                    <a
                                        href="/explorer/onchain"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xem on-chain data"
                                        style={{ color: '#3498db', textDecoration: 'none', fontFamily: 'monospace', fontSize: '12px' }}
                                    >
                                        🔗 #{book.tokenId}
                                    </a>
                                ) : (
                                    <span style={{ color: '#999', fontSize: '11px' }}>Chờ mint</span>
                                )}
                            </td>
                            <td style={styles.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {book.imageUrl && (
                                        <img src={book.imageUrl} alt={book.title} style={{ width: '30px', height: '42px', objectFit: 'cover', borderRadius: '2px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    )}
                                    <span>{book.title}</span>
                                </div>
                            </td>
                            <td style={styles.td}>{book.price?.toLocaleString()} VND</td>
                            <td style={styles.td}>
                                <span style={getBadgeStyle(book.status)}>{book.status}</span>
                            </td>
                            <td style={styles.td}>
                                <button className="btn-primary" style={{ backgroundColor: '#28a745', fontSize: '12px', padding: '5px 10px' }} onClick={() => handleVerifyBook(book.id)}>
                                    ✅ Duyệt Niêm Yết
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const MintTab = (
        <div style={styles.card}>
            <h4>➕ Cấp phát sách cho Lender (Custodial Mode)</h4>
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    Sử dụng quyền Admin (Owner của Smart Contract) để khởi tạo tài sản sách mới thay cho Lender. Sau khi cấp phát thành công, sách sẽ chuyển trạng thái <strong>PENDING_VERIFICATION</strong>.
                </p>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🔑 Mã chủ sách (Public Key của Lender)</label>
                    <input
                        type="text"
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        placeholder="0x..."
                        value={mintOwnerKey}
                        onChange={e => setMintOwnerKey(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🏷️ Tên sách</label>
                        <input
                            type="text"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            placeholder="Nhập tên sách..."
                            value={mintTitle}
                            onChange={e => setMintTitle(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>💵 Giá Thuê / Ngày</label>
                        <input
                            type="number"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            placeholder="VND"
                            value={mintPrice}
                            onChange={e => setMintPrice(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ border: '2px dashed #ccc', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fff' }}>
                    <label style={{ padding: '10px 20px', cursor: 'pointer', background: '#eee', borderRadius: '5px' }}>
                        + Tải Mock Ảnh Bìa (Dev Mode)
                    </label>
                </div>

                <button
                    className="btn-primary"
                    onClick={handleMintBook}
                    style={{ backgroundColor: '#007bff', padding: '12px 20px', fontSize: '16px', width: '100%' }}
                >
                    🔨 Ghi nhận Sách lên Chuỗi (safeMint)
                </button>
            </div>
        </div>
    );

    const ConfigTab = (
        <div style={styles.card}>
            <h4>⚙️ Cấu hình Hệ thống</h4>

            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    💰 Tỷ lệ Ký quỹ Tối thiểu: <span style={{ color: '#007bff' }}>{minCollateralRatio}%</span>
                </label>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    User (người thuê) phải đặt cọc ít nhất {minCollateralRatio}% giá trị sách. Lender có thể yêu cầu cao hơn.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {COLLATERAL_OPTIONS.map(opt => (
                        <button key={opt} type="button" style={presetBtnStyle(minCollateralRatio === opt)} onClick={() => setMinCollateralRatio(opt)}>
                            {opt}%
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '6px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    🏦 Phí Sàn (Platform Fee): <span style={{ color: '#dc3545' }}>{platformFee}%</span>
                </label>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    Phần trăm doanh thu thuê mà hệ thống giữ lại.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {PLATFORM_FEE_OPTIONS.map(opt => (
                        <button key={opt} type="button" style={presetBtnStyle(platformFee === opt)} onClick={() => setPlatformFee(opt)}>
                            {opt}%
                        </button>
                    ))}
                </div>
            </div>

            <button className="btn-primary" style={{ marginTop: '20px', width: '100%' }} onClick={() => {
                setStatusMsg(`✅ Đã lưu cấu hình local: Ký quỹ ${minCollateralRatio}%, Phí sàn ${platformFee}%`);
            }}>
                💾 Lưu Cấu hình
            </button>

            <button className="btn-primary" style={{ marginTop: '10px', width: '100%', backgroundColor: '#28a745' }} onClick={() => {
                setStatusMsg('⚠️ Quyết toán chưa hỗ trợ ở chế độ On-chain (cần Sprint 3)');
            }}>
                💰 Quyết toán ngay (Test)
            </button>
        </div>
    );

    // PHASE 1.5: Stats Tab
    const StatsTab = (
        <div style={styles.card}>
            <h4>📊 Thống kê Tài chính Hệ thống</h4>

            {/* 3 Stat Cards */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1, padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#155724' }}>💰 Doanh thu Sàn</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#155724' }}>
                        {(systemStats?.systemWallets?.revenue || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#155724' }}>VND</div>
                </div>
                <div style={{ flex: 1, padding: '15px', backgroundColor: '#cce5ff', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#004085' }}>🔒 Đang Escrow</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#004085' }}>
                        {(systemStats?.systemWallets?.escrow || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#004085' }}>VND</div>
                </div>
                <div style={{ flex: 1, padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#856404' }}>⏳ Chờ trả Lender</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#856404' }}>
                        {(systemStats?.systemWallets?.pendingPayout || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#856404' }}>VND</div>
                </div>
            </div>

            {/* Recent Transactions */}
            <h5>🔄 Giao dịch gần đây ({systemStats?.transactionCount || 0} tổng)</h5>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Loại</th>
                        <th style={styles.th}>Mã đơn / User</th>
                        <th style={styles.th}>Số tiền</th>
                        <th style={styles.th}>Thời gian</th>
                    </tr>
                </thead>
                <tbody>
                    {(!systemStats?.recentTransactions || systemStats.recentTransactions.length === 0) && (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Chưa có giao dịch nào
                            </td>
                        </tr>
                    )}
                    {systemStats?.recentTransactions?.map((tx: any, idx: number) => (
                        <tr key={idx}>
                            <td style={styles.td}>
                                <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    backgroundColor: tx.type === 'PAYMENT_TO_ESCROW' ? '#cce5ff' :
                                        tx.type === 'INCOME_PENDING' ? '#fff3cd' : '#d4edda',
                                    color: tx.type === 'PAYMENT_TO_ESCROW' ? '#004085' :
                                        tx.type === 'INCOME_PENDING' ? '#856404' : '#155724'
                                }}>
                                    {tx.type}
                                </span>
                            </td>
                            <td style={styles.td}>{tx.bookingCode || tx.user || '-'}</td>
                            <td style={styles.td}>{(tx.amount || 0).toLocaleString()} VND</td>
                            <td style={styles.td}>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const SafeTab = (
        <div style={styles.card}>
            <h4>🛡️ Gnosis Safe (Multi-sig) Dashboard</h4>
            <div style={{ backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #c8e6c9' }}>
                <p><strong>Safe Address:</strong> {safeAddress}</p>
                <p><strong>Threshold:</strong> {threshold} chữ ký yêu cầu</p>
                <button className="btn-primary" onClick={() => setSafeAddress(prompt("Nhập địa chỉ Safe:", safeAddress) || safeAddress)} style={{ padding: '5px 10px', fontSize: '12px' }}>Cập nhật Safe Address</button>
                <button className="btn-primary" onClick={() => setThreshold(Number(prompt("Nhập Threshold:", threshold.toString())) || threshold)} style={{ padding: '5px 10px', fontSize: '12px', marginLeft: '10px' }}>Cập nhật Threshold</button>
            </div>

            <h5>Đề xuất giao dịch chờ duyệt ({pendingTxs.filter(t => !t.executed).length})</h5>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Mô tả</th>
                        <th style={styles.th}>Chữ ký</th>
                        <th style={styles.th}>Trạng thái</th>
                        <th style={styles.th}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingTxs.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Không có đề xuất nào</td>
                        </tr>
                    )}
                    {pendingTxs.map(tx => (
                        <tr key={tx.id}>
                            <td style={styles.td}>{tx.id}</td>
                            <td style={styles.td}>{tx.description}</td>
                            <td style={styles.td}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{tx.signatures.length} / {threshold}</span>
                                    <small style={{ color: '#666' }}>{tx.signatures.map(s => s.signer.substring(0, 6) + '...').join(', ')}</small>
                                </div>
                            </td>
                            <td style={styles.td}>
                                {tx.executed ? <span style={getBadgeStyle('COMPLETED')}>Đã thực thi</span> : <span style={getBadgeStyle('PENDING')}>Chờ duyệt</span>}
                            </td>
                            <td style={styles.td}>
                                {!tx.executed && (
                                    <button className="btn-primary" onClick={() => handleSignSafeTx(tx.id)} style={{ backgroundColor: '#ff9800' }}>
                                        ✍️ Ký Duyệt
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const RightContent = (
        <>
            {activeTab === 'RENTALS' && RentalsTab}
            {activeTab === 'BOOKS' && BooksTab}
            {activeTab === 'MINT' && MintTab}
            {activeTab === 'CONFIG' && ConfigTab}
            {activeTab === 'STATS' && StatsTab}
            {activeTab === 'SAFE' && SafeTab}
        </>
    );

    return <SplitLayout left={LeftContent} right={RightContent} />;
};

export default OwnerDashboard;
