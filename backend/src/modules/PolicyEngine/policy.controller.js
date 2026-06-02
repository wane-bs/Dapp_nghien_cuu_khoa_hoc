// PolicyEngine Controller - Core Policy Logic
// Quyết định approval mode dựa trên: Book Tier × TrustScore × Deposit Ratio

/**
 * Tính TrustScore từ stats người thuê
 * @param {Object} stats - { completedRentals, lateReturns, disputes }
 * @returns {number} Score 0-100
 */
function computeTrustScore(stats) {
    let score = 50; // Base score
    score += 10 * Math.min(stats.completedRentals || 0, 5); // Max +50
    score -= 20 * (stats.disputes || 0); // Penalty nặng
    score -= 10 * (stats.lateReturns || 0); // Penalty nhẹ hơn
    return Math.max(0, Math.min(100, score)); // Clamp [0..100]
}

/**
 * Phân loại Trust Band từ score
 * @param {number} score
 * @returns {'HIGH'|'MEDIUM'|'LOW'}
 */
function getTrustBand(score) {
    if (score >= 80) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
}

/**
 * Tính deadline time
 * @param {number} minutes
 * @returns {number} Timestamp
 */
function addMinutes(minutes) {
    return Date.now() + minutes * 60 * 1000;
}

/**
 * Policy Matrix Decision Engine
 * @param {Object} book - { riskTier, valueReference, status, lockerId, isHeld, isRented }
 * @param {Object} stats - { completedRentals, lateReturns, disputes }
 * @param {number} depositAmount
 * @returns {Object} { outcome, reasonCode, deadlineAt?, pickupDeadlineAt? }
 */
function decideApproval(book, stats, depositAmount) {
    // Gate 0: Inventory certainty check
    if (book.status !== 'VERIFIED' || book.isRented) {
        return { outcome: 'REJECT', reasonCode: 'BOOK_NOT_AVAILABLE' };
    }

    const tier = book.riskTier || 'C'; // Default to low risk
    const score = computeTrustScore(stats);
    const band = getTrustBand(score);
    const valueRef = book.valueReference || book.price || 50000;
    const depositRatio = depositAmount / valueRef;

    // Tier C (Low Risk) - AUTO hầu hết
    if (tier === 'C') {
        if (band === 'LOW' && depositRatio < 0.5) {
            return {
                outcome: 'REVIEW', reasonCode: 'TIER_C_LOW_TRUST_NEED_REVIEW',
                deadlineAt: addMinutes(30), trustScore: score, trustBand: band, depositRatio
            };
        }
        return {
            outcome: 'AUTO', reasonCode: 'TIER_C_OK',
            pickupDeadlineAt: addMinutes(60), trustScore: score, trustBand: band, depositRatio
        };
    }

    // Tier B (Medium Risk)
    if (tier === 'B') {
        if (band === 'HIGH') {
            return {
                outcome: 'AUTO', reasonCode: 'TIER_B_HIGH_TRUST',
                pickupDeadlineAt: addMinutes(60), trustScore: score, trustBand: band, depositRatio
            };
        }
        if (band === 'MEDIUM') {
            if (depositRatio >= 0.5) {
                return {
                    outcome: 'AUTO', reasonCode: 'TIER_B_MED_TRUST_DEPOSIT_OK',
                    pickupDeadlineAt: addMinutes(60), trustScore: score, trustBand: band, depositRatio
                };
            }
            return {
                outcome: 'REVIEW', reasonCode: 'TIER_B_MED_TRUST_REVIEW',
                deadlineAt: addMinutes(30), trustScore: score, trustBand: band, depositRatio
            };
        }
        // LOW trust
        if (depositRatio >= 0.7) {
            return {
                outcome: 'REVIEW', reasonCode: 'TIER_B_LOW_TRUST_HIGH_DEPOSIT',
                deadlineAt: addMinutes(30), trustScore: score, trustBand: band, depositRatio
            };
        }
        return {
            outcome: 'MANUAL', reasonCode: 'TIER_B_LOW_TRUST_MANUAL',
            deadlineAt: addMinutes(120), trustScore: score, trustBand: band, depositRatio
        };
    }

    // Tier A (High Risk) - Luôn cần human oversight
    if (band === 'LOW') {
        return {
            outcome: 'REJECT', reasonCode: 'TIER_A_LOW_TRUST_REJECT',
            trustScore: score, trustBand: band, depositRatio
        };
    }
    return {
        outcome: 'MANUAL', reasonCode: 'TIER_A_MANUAL',
        deadlineAt: addMinutes(120), trustScore: score, trustBand: band, depositRatio
    };
}

module.exports = {
    computeTrustScore,
    getTrustBand,
    decideApproval,
    addMinutes
};
