/**
 * Tests for Credit system type definitions
 *
 * Validates type shapes for credit balances, transactions,
 * packages, and API response types.
 */

import { describe, it, expect } from 'vitest';
import type {
  CreditBalance,
  CreditTransaction,
  CreditTransactionType,
  CreditPackage,
  DeductCreditResult,
  AddCreditsResult,
  CreditBalanceResponse,
  CreditTransactionListResponse,
} from './credits.js';
import { CREDIT_PACKAGES, CREDIT_TRANSACTION_TYPES } from './credits.js';

describe('Credit Types', () => {
  describe('CreditBalance', () => {
    it('should accept valid credit balance', () => {
      const balance: CreditBalance = {
        id: 'cb-uuid-1',
        userId: 'user-uuid-1',
        balance: 10,
        lifetimeCredits: 25,
        createdAt: '2026-02-18T00:00:00Z',
        updatedAt: '2026-02-18T00:00:00Z',
      };
      expect(balance.balance).toBe(10);
      expect(balance.lifetimeCredits).toBe(25);
    });

    it('should represent zero-balance user', () => {
      const balance: CreditBalance = {
        id: 'cb-uuid-2',
        userId: 'user-uuid-2',
        balance: 0,
        lifetimeCredits: 5,
        createdAt: '2026-02-18T00:00:00Z',
        updatedAt: '2026-02-18T00:00:00Z',
      };
      expect(balance.balance).toBe(0);
      expect(balance.lifetimeCredits).toBe(5);
    });
  });

  describe('CreditTransaction', () => {
    it('should accept valid purchase transaction', () => {
      const transaction: CreditTransaction = {
        id: 'ct-uuid-1',
        userId: 'user-uuid-1',
        amount: 5,
        balanceAfter: 15,
        transactionType: 'purchase',
        description: 'Purchased 5 credits',
        idempotencyKey: 'add:cs_123',
        stripeSessionId: 'cs_123',
        sessionId: null,
        createdAt: '2026-02-18T00:00:00Z',
      };
      expect(transaction.amount).toBe(5);
      expect(transaction.transactionType).toBe('purchase');
    });

    it('should accept valid deduction transaction', () => {
      const transaction: CreditTransaction = {
        id: 'ct-uuid-2',
        userId: 'user-uuid-1',
        amount: -1,
        balanceAfter: 14,
        transactionType: 'deduction',
        description: 'Adventure session credit',
        idempotencyKey: 'deduct:user-uuid-1:session-uuid-1',
        stripeSessionId: null,
        sessionId: 'session-uuid-1',
        createdAt: '2026-02-18T00:00:00Z',
      };
      expect(transaction.amount).toBe(-1);
      expect(transaction.transactionType).toBe('deduction');
      expect(transaction.sessionId).toBe('session-uuid-1');
    });

    it('should accept transaction with no optional fields', () => {
      const transaction: CreditTransaction = {
        id: 'ct-uuid-3',
        userId: 'user-uuid-1',
        amount: 3,
        balanceAfter: 3,
        transactionType: 'grant',
        description: null,
        idempotencyKey: null,
        stripeSessionId: null,
        sessionId: null,
        createdAt: '2026-02-18T00:00:00Z',
      };
      expect(transaction.transactionType).toBe('grant');
      expect(transaction.description).toBeNull();
    });
  });

  describe('CreditTransactionType', () => {
    it('should define all expected transaction types', () => {
      const types: CreditTransactionType[] = [
        'purchase',
        'deduction',
        'grant',
        'refund',
        'expiration',
      ];
      expect(types).toHaveLength(5);
    });

    it('should export CREDIT_TRANSACTION_TYPES constant', () => {
      expect(CREDIT_TRANSACTION_TYPES).toContain('purchase');
      expect(CREDIT_TRANSACTION_TYPES).toContain('deduction');
      expect(CREDIT_TRANSACTION_TYPES).toContain('grant');
      expect(CREDIT_TRANSACTION_TYPES).toContain('refund');
      expect(CREDIT_TRANSACTION_TYPES).toContain('expiration');
      expect(CREDIT_TRANSACTION_TYPES).toHaveLength(5);
    });
  });

  describe('CreditPackage', () => {
    it('should accept valid credit package', () => {
      const pkg: CreditPackage = {
        id: 'starter',
        name: 'Starter Pack',
        credits: 5,
        priceInCents: 499,
        description: '5 adventure credits',
      };
      expect(pkg.credits).toBe(5);
      expect(pkg.priceInCents).toBe(499);
    });

    it('should export predefined CREDIT_PACKAGES', () => {
      expect(CREDIT_PACKAGES).toBeDefined();
      expect(CREDIT_PACKAGES.length).toBeGreaterThan(0);
      for (const pkg of CREDIT_PACKAGES) {
        expect(pkg.id).toBeTruthy();
        expect(pkg.credits).toBeGreaterThan(0);
        expect(pkg.priceInCents).toBeGreaterThan(0);
      }
    });
  });

  describe('DeductCreditResult', () => {
    it('should represent successful deduction', () => {
      const result: DeductCreditResult = {
        success: true,
        newBalance: 9,
        transactionId: 'ct-uuid-1',
      };
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(9);
      expect(result.transactionId).toBe('ct-uuid-1');
    });

    it('should represent insufficient credits', () => {
      const result: DeductCreditResult = {
        success: false,
        newBalance: 0,
        error: 'insufficient_credits',
      };
      expect(result.success).toBe(false);
      expect(result.error).toBe('insufficient_credits');
    });
  });

  describe('AddCreditsResult', () => {
    it('should represent successful credit addition', () => {
      const result: AddCreditsResult = {
        success: true,
        newBalance: 15,
        transactionId: 'ct-uuid-2',
      };
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(15);
    });

    it('should represent failed credit addition', () => {
      const result: AddCreditsResult = {
        success: false,
        error: 'amount_must_be_positive',
      };
      expect(result.success).toBe(false);
      expect(result.error).toBe('amount_must_be_positive');
    });
  });

  describe('CreditBalanceResponse', () => {
    it('should represent balance API response', () => {
      const response: CreditBalanceResponse = {
        balance: 10,
        lifetimeCredits: 25,
      };
      expect(response.balance).toBe(10);
      expect(response.lifetimeCredits).toBe(25);
    });
  });

  describe('CreditTransactionListResponse', () => {
    it('should represent transaction list API response', () => {
      const response: CreditTransactionListResponse = {
        transactions: [
          {
            id: 'ct-uuid-1',
            userId: 'user-uuid-1',
            amount: 5,
            balanceAfter: 15,
            transactionType: 'purchase',
            description: 'Purchased 5 credits',
            idempotencyKey: 'add:cs_123',
            stripeSessionId: 'cs_123',
            sessionId: null,
            createdAt: '2026-02-18T00:00:00Z',
          },
        ],
        total: 1,
      };
      expect(response.transactions).toHaveLength(1);
      expect(response.total).toBe(1);
    });
  });
});
