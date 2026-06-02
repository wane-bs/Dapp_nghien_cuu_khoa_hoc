import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import SplitLayout from '../../../shared/ui/SplitLayout';
import { config } from '../../../config';
import { ethers } from 'ethers';

interface UserContextType {
    user: { username: string; email: string; address: string } | null;
}

const Wallet: React.FC = () => {
    const { user } = useOutletContext<UserContextType>();
    const [balance, setBalance] = useState<number | string>("Loading...");
    const [pendingIncome, setPendingIncome] = useState<number>(0);
    // PHASE 1.5: Transaction History
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            // Sprint 1: Read ETH balance directly from Hardhat Node
            const loadOnChainData = async () => {
                try {
                    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
                    const bal = await provider.getBalance(user.address || user.username);
                    const ethBal = parseFloat(ethers.formatEther(bal));
                    setBalance(Math.round(ethBal * 100) / 100); // Display as ETH with 2 decimals
                    setPendingIncome(0);
                } catch {
                    setBalance('Error');
                }
            };
            loadOnChainData();
            // Transactions: not available without backend — show empty
            setTransactions([]);
        }
    }, [user]);

    const LeftContent = (
        <div style={{ textAlign: 'left' }}>
            <div style={{ padding: '10px', fontWeight: 'bold' }}>💰 Số dư</div>
            <div style={{ padding: '10px' }}>📜 Lịch sử giao dịch</div>
            <hr />
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', fontSize: '0.9em' }}>
                <strong>Hướng dẫn nạp tiền:</strong><br />
                Vui lòng chuyển khoản tới:<br />
                - STK: <strong>0000 1234 5678</strong> (MB Bank)<br />
                - Chủ TK: VinaLib Vault<br />
                - Nội dung: <strong>NAP {user?.username}</strong>
            </div>
            <a href={`${config.MOCK_SIGN_URL}/mock-ui/bank.html`} target="_blank" rel="noreferrer" style={{ marginTop: '10px', display: 'block' }}>
                <button className="btn-primary">Nạp tiền (Bank Mock)</button>
            </a>
        </div>
    );

    const RightContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Balance Section */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3>💰 Số dư khả dụng</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-red)' }}>
                    {typeof balance === 'number' ? `${balance} ETH` : balance}
                </div>
                <p style={{ color: '#777', fontSize: '0.85em' }}>Số dư ví ETH trên mạng Hardhat Local</p>

                {pendingIncome > 0 && (
                    <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                        <span style={{ color: '#856404' }}>⏳ Chờ quyết toán: <strong>{pendingIncome.toLocaleString()} VNĐ</strong></span>
                        <p style={{ color: '#856404', fontSize: '0.75em', margin: '5px 0 0 0' }}>Về ví ngày 5 hàng tháng</p>
                    </div>
                )}

                <p style={{ color: '#999', marginTop: '10px', fontSize: '0.8em' }}>Ví: {user?.address}</p>
            </div>

            {/* PHASE 1.5: Transaction History */}
            <div style={{ flex: 1, borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>📜 Lịch sử giao dịch</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {transactions.length === 0 ? (
                        <p style={{ color: '#999', textAlign: 'center' }}>Chưa có giao dịch nào</p>
                    ) : (
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '6px', textAlign: 'left' }}>Loại</th>
                                    <th style={{ padding: '6px', textAlign: 'right' }}>Số tiền</th>
                                    <th style={{ padding: '6px', textAlign: 'right' }}>Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 10).map((tx, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '6px' }}>
                                            <span style={{
                                                padding: '2px 5px',
                                                borderRadius: '3px',
                                                fontSize: '10px',
                                                backgroundColor: tx.type?.includes('PAYOUT') ? '#d4edda' :
                                                    tx.type?.includes('PENDING') ? '#fff3cd' : '#cce5ff'
                                            }}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '6px', textAlign: 'right' }}>
                                            {(tx.amount || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '6px', textAlign: 'right', color: '#999' }}>
                                            {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '20px', fontWeight: 'bold' }}>Ví của tôi</div>
            <SplitLayout left={LeftContent} right={RightContent} />
        </>
    );
};

export default Wallet;

