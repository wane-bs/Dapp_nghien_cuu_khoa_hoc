// PolicyEngine Unit Tests
// Test TrustScore calculation và Policy Matrix decision logic

const { computeTrustScore, getTrustBand, decideApproval } = require('../src/modules/PolicyEngine/policy.controller');

describe('PolicyEngine - TrustScore', () => {
    test('Base score is 50 for new user', () => {
        const stats = { completedRentals: 0, lateReturns: 0, disputes: 0 };
        expect(computeTrustScore(stats)).toBe(50);
    });

    test('Max 5 rentals contribute +50 points', () => {
        const stats = { completedRentals: 5, lateReturns: 0, disputes: 0 };
        expect(computeTrustScore(stats)).toBe(100);
    });

    test('More than 5 rentals still limited to +50', () => {
        const stats = { completedRentals: 10, lateReturns: 0, disputes: 0 };
        expect(computeTrustScore(stats)).toBe(100);
    });

    test('Disputes cause heavy penalty (-20 each)', () => {
        const stats = { completedRentals: 3, lateReturns: 0, disputes: 2 };
        // 50 + 30 - 40 = 40
        expect(computeTrustScore(stats)).toBe(40);
    });

    test('Late returns cause moderate penalty (-10 each)', () => {
        const stats = { completedRentals: 3, lateReturns: 2, disputes: 0 };
        // 50 + 30 - 20 = 60
        expect(computeTrustScore(stats)).toBe(60);
    });

    test('Score clamped to 0 minimum', () => {
        const stats = { completedRentals: 0, lateReturns: 0, disputes: 5 };
        // 50 - 100 = -50 -> clamped to 0
        expect(computeTrustScore(stats)).toBe(0);
    });

    test('Score clamped to 100 maximum', () => {
        const stats = { completedRentals: 100, lateReturns: 0, disputes: 0 };
        expect(computeTrustScore(stats)).toBe(100);
    });
});

describe('PolicyEngine - TrustBand', () => {
    test('HIGH band >= 80', () => {
        expect(getTrustBand(80)).toBe('HIGH');
        expect(getTrustBand(100)).toBe('HIGH');
    });

    test('MEDIUM band 50-79', () => {
        expect(getTrustBand(50)).toBe('MEDIUM');
        expect(getTrustBand(79)).toBe('MEDIUM');
    });

    test('LOW band < 50', () => {
        expect(getTrustBand(49)).toBe('LOW');
        expect(getTrustBand(0)).toBe('LOW');
    });
});

describe('PolicyEngine - Policy Matrix', () => {
    // Mock book objects
    const bookTierC = { status: 'VERIFIED', riskTier: 'C', valueReference: 50000 };
    const bookTierB = { status: 'VERIFIED', riskTier: 'B', valueReference: 100000 };
    const bookTierA = { status: 'VERIFIED', riskTier: 'A', valueReference: 200000 };
    const bookNotAvailable = { status: 'RENTED', riskTier: 'C', valueReference: 50000, isRented: true };

    // Mock renter stats
    const highTrust = { completedRentals: 5, lateReturns: 0, disputes: 0 };  // Score 100
    const medTrust = { completedRentals: 2, lateReturns: 0, disputes: 0 };   // Score 70
    const lowTrust = { completedRentals: 0, lateReturns: 2, disputes: 1 };   // Score 10

    test('REJECT if book not available', () => {
        const result = decideApproval(bookNotAvailable, highTrust, 25000);
        expect(result.outcome).toBe('REJECT');
        expect(result.reasonCode).toBe('BOOK_NOT_AVAILABLE');
    });

    // Tier C tests
    test('Tier C + HIGH trust = AUTO', () => {
        const result = decideApproval(bookTierC, highTrust, 15000); // 30% deposit
        expect(result.outcome).toBe('AUTO');
        expect(result.reasonCode).toBe('TIER_C_OK');
    });

    test('Tier C + LOW trust + low deposit = REVIEW', () => {
        const result = decideApproval(bookTierC, lowTrust, 20000); // 40% deposit
        expect(result.outcome).toBe('REVIEW');
        expect(result.reasonCode).toBe('TIER_C_LOW_TRUST_NEED_REVIEW');
    });

    test('Tier C + LOW trust + high deposit = AUTO', () => {
        const result = decideApproval(bookTierC, lowTrust, 30000); // 60% deposit
        expect(result.outcome).toBe('AUTO');
    });

    // Tier B tests
    test('Tier B + HIGH trust = AUTO', () => {
        const result = decideApproval(bookTierB, highTrust, 30000);
        expect(result.outcome).toBe('AUTO');
        expect(result.reasonCode).toBe('TIER_B_HIGH_TRUST');
    });

    test('Tier B + MEDIUM trust + deposit >= 50% = AUTO', () => {
        const result = decideApproval(bookTierB, medTrust, 50000); // 50% deposit
        expect(result.outcome).toBe('AUTO');
        expect(result.reasonCode).toBe('TIER_B_MED_TRUST_DEPOSIT_OK');
    });

    test('Tier B + MEDIUM trust + deposit < 50% = REVIEW', () => {
        const result = decideApproval(bookTierB, medTrust, 40000); // 40% deposit
        expect(result.outcome).toBe('REVIEW');
    });

    test('Tier B + LOW trust + deposit >= 70% = REVIEW', () => {
        const result = decideApproval(bookTierB, lowTrust, 70000); // 70% deposit
        expect(result.outcome).toBe('REVIEW');
    });

    test('Tier B + LOW trust + deposit < 70% = MANUAL', () => {
        const result = decideApproval(bookTierB, lowTrust, 50000);
        expect(result.outcome).toBe('MANUAL');
    });

    // Tier A tests
    test('Tier A + HIGH trust = MANUAL (always human oversight)', () => {
        const result = decideApproval(bookTierA, highTrust, 100000);
        expect(result.outcome).toBe('MANUAL');
        expect(result.reasonCode).toBe('TIER_A_MANUAL');
    });

    test('Tier A + LOW trust = REJECT', () => {
        const result = decideApproval(bookTierA, lowTrust, 100000);
        expect(result.outcome).toBe('REJECT');
        expect(result.reasonCode).toBe('TIER_A_LOW_TRUST_REJECT');
    });

    // Verify metadata in response
    test('Response includes trustScore and trustBand', () => {
        const result = decideApproval(bookTierC, highTrust, 25000);
        expect(result.trustScore).toBe(100);
        expect(result.trustBand).toBe('HIGH');
        expect(result.depositRatio).toBe(0.5);
    });

    test('AUTO outcome includes pickupDeadlineAt', () => {
        const result = decideApproval(bookTierC, highTrust, 25000);
        expect(result.pickupDeadlineAt).toBeDefined();
        expect(result.pickupDeadlineAt).toBeGreaterThan(Date.now());
    });

    test('MANUAL/REVIEW outcome includes deadlineAt', () => {
        const result = decideApproval(bookTierA, highTrust, 100000);
        expect(result.deadlineAt).toBeDefined();
        expect(result.deadlineAt).toBeGreaterThan(Date.now());
    });
});
