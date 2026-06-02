/**
 * IR-3 FIX: API helpers cho Contract Preview flow
 * Centralize calls đến /api/contracts/:previewId
 */
import axios from 'axios';
import { config } from '../../config';

const BASE = config.API_BASE_URL;

export interface ContractPreviewData {
    previewId: string;
    content: string;
    termsHash: string;
    version: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
    bookingCode?: string;
    createdAt?: number;
}

export interface AcceptResult {
    success: boolean;
    bookingCode?: string;
    approvalMode?: 'AUTO' | 'MANUAL' | 'REVIEW' | 'REJECT';
    trustScore?: number;
    trustBand?: string;
    bookTier?: string;
    message?: string;
    rejected?: boolean;
}

/**
 * Lấy nội dung hợp đồng preview
 */
export async function getPreview(previewId: string, userId: string): Promise<ContractPreviewData> {
    const res = await axios.get(`${BASE}/api/contracts/${previewId}`, {
        headers: { 'x-user-id': userId }
    });
    return res.data;
}

/**
 * Chấp nhận hợp đồng — Kích hoạt Policy Engine
 * Kết quả: AUTO → SIGNED_UNPAID (+ SBT minted), REVIEW/MANUAL → SIGNED_PENDING_APPROVAL
 */
export async function acceptContract(previewId: string, userId: string): Promise<AcceptResult> {
    const res = await axios.post(`${BASE}/api/contracts/${previewId}/accept`, {}, {
        headers: { 'x-user-id': userId }
    });
    return res.data;
}

/**
 * Từ chối hợp đồng — Hủy yêu cầu thuê
 */
export async function rejectContract(previewId: string, userId: string, reason?: string): Promise<{ success: boolean }> {
    const res = await axios.post(`${BASE}/api/contracts/${previewId}/reject`, { reason }, {
        headers: { 'x-user-id': userId }
    });
    return res.data;
}

/**
 * Lấy toàn bộ hợp đồng của user
 */
export async function getMyContracts(userId: string): Promise<ContractPreviewData[]> {
    const res = await axios.get(`${BASE}/api/contracts`, {
        headers: { 'x-user-id': userId }
    });
    return res.data;
}
