/**
 * P2-2 FIX: Hook để poll on-chain BookStatus từ backend
 * Dùng trong BookDetail page để hiển thị trạng thái NFT thực tế trên chain
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { config } from '../../config';

export interface OnChainStatus {
    bookId: number;
    tokenId: number;
    offChainStatus: string;
    onChainStatus: string;
    onChainStatusCode: number | null;
    synced: boolean;
    lastChecked: string;
}

/**
 * @param bookId - Book ID (off-chain)
 * @param pollIntervalMs - Interval polling (default 30000ms = 30s)
 * @param enabled - Chỉ poll khi enabled = true (tránh poll khi modal đóng)
 */
export function useBookOnChainStatus(
    bookId: number | null,
    pollIntervalMs = 30000,
    enabled = true
) {
    const [status, setStatus] = useState<OnChainStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!bookId || !enabled) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${config.API_BASE_URL}/api/books/${bookId}/chain-status`);
            setStatus(res.data);
        } catch (err: any) {
            // Graceful degradation — không crash nếu chain không available
            const msg = err.response?.data?.error || err.message || 'Chain unavailable';
            setError(msg);
            console.warn(`[OnChain] Book ${bookId} status unavailable:`, msg);
        } finally {
            setLoading(false);
        }
    }, [bookId, enabled]);

    // Fetch on mount
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Poll every pollIntervalMs
    useEffect(() => {
        if (!enabled || !bookId) return;
        const interval = setInterval(fetchStatus, pollIntervalMs);
        return () => clearInterval(interval);
    }, [fetchStatus, pollIntervalMs, enabled, bookId]);

    return { status, loading, error, refresh: fetchStatus };
}
