import React, { useEffect, useState } from 'react';
import SplitLayout from '../../../shared/ui/SplitLayout';
import { useOutletContext } from 'react-router-dom';
import { ethers } from 'ethers';
import { ContractService } from '../../../shared/web3/ContractService';

import { dashboardStyles as styles } from '../../../shared/ui/dashboardStyles';
import { getBadgeStyle } from '../../../shared/lib/statusHelpers';

interface UserContextType {
    user: { username: string; email: string; address: string } | null;
}

/**
 * LenderDashboard - Trang xem sách của Lender (READ-ONLY)
 * Tuân thủ QUY_LUAT_TOI_CAO.md Phase 1 & BÁO_CÁO_THẨM_QUYỀN.md:
 * - Lender KHÔNG có quyền Approve hoặc Confirm Return
 * - Chỉ xem trạng thái sách đang cho thuê
 */
const LenderDashboard: React.FC = () => {
    const { user } = useOutletContext<UserContextType>();
    const [myBooks, setMyBooks] = useState<any[]>([]);
    const [rentals, setRentals] = useState<any[]>([]);
    // PHASE 1.5: Revenue tracking
    const [balanceInfo, setBalanceInfo] = useState<{ balance: number; pendingIncome: number }>({ balance: 0, pendingIncome: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);

    // Sprint 2: Fetch books owned by this Lender from on-chain
    const fetchMyBooks = async () => {
        if (!user) return;
        try {
            const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
            const cs = new ContractService(provider);
            const books: any[] = [];
            const ownerAddr = (user.address || user.username).toLowerCase();
            for (let tokenId = 1; tokenId <= 10; tokenId++) {
                try {
                    const owner = await cs.bookAsset.ownerOf(tokenId);
                    if (String(owner).toLowerCase() === ownerAddr) {
                        const status = await cs.bookAsset.getBookStatus(tokenId);
                        const cid = await cs.bookAsset.tokenCIDs(tokenId);
                        books.push({
                            id: tokenId,
                            tokenId: tokenId,
                            title: `Sách #${tokenId}`,
                            price: 5000 + tokenId * 1000,
                            status: Number(status) === 1 ? 'VERIFIED' : Number(status) === 2 ? 'RENTED' : 'PENDING_VERIFICATION',
                            available: Number(status) === 1,
                            cid: cid
                        });
                    }
                } catch { /* token doesn't exist */ }
            }
            setMyBooks(books);
        } catch (e) {
            console.error('On-chain fetch books error', e);
        }
    };

    // Sprint 2: No backend for rentals — show empty
    const fetchRentals = async () => {
        setRentals([]);
    };

    useEffect(() => {
        fetchMyBooks();
        fetchRentals();
        fetchRevenue();
        const interval = setInterval(() => {
            fetchMyBooks();
            fetchRevenue();
        }, 15000);
        return () => clearInterval(interval);
    }, [user]);

    // Sprint 2: Read ETH balance on-chain
    const fetchRevenue = async () => {
        if (!user) return;
        try {
            const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
            const bal = await provider.getBalance(user.address || user.username);
            const ethBal = parseFloat(ethers.formatEther(bal));
            setBalanceInfo({ balance: Math.round(ethBal * 100) / 100, pendingIncome: 0 });
        } catch {
            setBalanceInfo({ balance: 0, pendingIncome: 0 });
        }
        setTransactions([]);
    };

    const pendingCount = myBooks.filter(b => b.status === 'PENDING_VERIFICATION').length;
    const rentedCount = myBooks.filter(b => b.status === 'RENTED' || !b.available).length;

    const LeftContent = (
        <div>
            <div style={styles.card}>
                <h3>📚 Sách Của Tôi</h3>
                <p style={{ color: '#666' }}>Xem trạng thái sách bạn đã niêm yết.</p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                    ℹ️ Việc phê duyệt và xác nhận trả sách do Admin thực hiện.
                </p>
            </div>

            <div style={styles.statCard}>
                <div style={styles.statNumber}>{myBooks.length}</div>
                <div>Tổng Sách</div>
            </div>

            <div style={{ ...styles.statCard, background: '#fff3cd', color: '#000', border: '1px solid #ffc107' }}>
                <div style={styles.statNumber}>{pendingCount}</div>
                <div>Chờ Duyệt</div>
            </div>

            <div style={{ ...styles.statCard, background: '#d4edda', color: '#000', border: '1px solid #28a745' }}>
                <div style={styles.statNumber}>{rentedCount}</div>
                <div>Đang Thuê</div>
            </div>

            {/* PHASE 1.5: Revenue Summary */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>💰 Doanh thu của tôi</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Số dư khả dụng</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
                            {balanceInfo.balance?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Chờ quyết toán</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#856404' }}>
                            {balanceInfo.pendingIncome?.toLocaleString() || 0}
                        </div>
                    </div>
                </div>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px', marginBottom: 0 }}>
                    Tiền chờ quyết toán sẽ về ví vào ngày 5 hàng tháng.
                </p>
            </div>
        </div>
    );

    const RightContent = (
        <div style={styles.card}>
            <h4>Danh sách Sách</h4>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Token ID</th>
                        <th style={styles.th}>Tên Sách</th>
                        <th style={styles.th}>Giá</th>
                        <th style={styles.th}>Trạng Thái</th>
                    </tr>
                </thead>
                <tbody>
                    {myBooks.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Bạn chưa niêm yết sách nào. Vào "Cho thuê sách" để bắt đầu.
                            </td>
                        </tr>
                    )}
                    {myBooks.map((book) => (
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
                                    <span style={{ color: '#999', fontSize: '11px' }}>Chưa mint</span>
                                )}
                            </td>
                            <td style={styles.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {book.imageUrl && (
                                        <img
                                            src={book.imageUrl}
                                            alt={book.title}
                                            style={{ width: '30px', height: '42px', objectFit: 'cover', borderRadius: '2px' }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                    <span>{book.title}</span>
                                </div>
                            </td>
                            <td style={styles.td}>{book.price?.toLocaleString()} VND</td>
                            <td style={styles.td}>
                                <span style={getBadgeStyle(book.status)}>{book.status}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Rental History - READ ONLY */}
            <h4 style={{ marginTop: '30px' }}>Lịch sử Thuê (Xem)</h4>
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
                    </tr>
                </thead>
                <tbody>
                    {rentals.length === 0 && (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                Chưa có đơn thuê nào.
                            </td>
                        </tr>
                    )}
                    {rentals.slice(0, 10).map((item) => (
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
                                        style={{ color: '#3498db', textDecoration: 'none', fontSize: '11px' }}
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
                            {/* NO ACTION BUTTONS - Lender is READ-ONLY per Permission Matrix */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return <SplitLayout left={LeftContent} right={RightContent} />;
};

export default LenderDashboard;
