/**
 * Settings page for Sage Codex
 *
 * Displays credit balance, purchasable credit packages with Stripe
 * Checkout redirect, transaction history, and payment method management
 * via Stripe Customer Portal.
 *
 * Handles post-checkout polling: when redirected back with
 * ?checkout=success, polls the balance endpoint to account for
 * webhook processing delay.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCreditStore } from '@/stores/creditStore';

// =============================================================================
// Constants
// =============================================================================

const POLL_INTERVAL_MS = 1000;
const POLL_MAX_DURATION_MS = 10000;

// =============================================================================
// Sub-components
// =============================================================================

function CreditBalanceCard({
  balance,
  lifetimeCredits,
}: {
  balance: number;
  lifetimeCredits: number;
}) {
  return (
    <div className="detail-card detail-card--gold" style={sectionCardStyle}>
      <h2 style={styles.sectionTitle}>Credit Balance</h2>
      <div style={styles.balanceDisplay}>
        <span style={styles.balanceNumber}>{balance}</span>
        <span style={styles.balanceLabel}>
          {balance === 1 ? 'credit' : 'credits'} available
        </span>
      </div>
      <p style={styles.lifetimeText}>
        {lifetimeCredits} lifetime {lifetimeCredits === 1 ? 'credit' : 'credits'}
      </p>
    </div>
  );
}

function PackageCard({
  name,
  credits,
  priceInCents,
  description,
  isProcessing,
  onBuy,
}: {
  name: string;
  credits: number;
  priceInCents: number;
  description: string;
  isProcessing: boolean;
  onBuy: () => void;
}) {
  const priceDisplay = `$${(priceInCents / 100).toFixed(2)}`;
  const perCreditPrice = `$${(priceInCents / 100 / credits).toFixed(2)}`;

  return (
    <div className="detail-card" style={styles.packageCard}>
      <h3 style={styles.packageName}>{name}</h3>
      <p style={styles.packageDescription}>{description}</p>
      <div style={styles.packagePricing}>
        <span style={styles.packagePrice}>{priceDisplay}</span>
        <span style={styles.perCredit}>{perCreditPrice} / credit</span>
      </div>
      <button
        className="footer-button"
        style={styles.buyButton}
        onClick={onBuy}
        disabled={isProcessing}
        type="button"
        aria-label={`Purchase ${name} for ${priceDisplay}`}
      >
        {isProcessing ? 'Redirecting...' : 'Buy'}
      </button>
    </div>
  );
}

function TransactionRow({
  amount,
  description,
  createdAt,
}: {
  amount: number;
  description: string | null;
  createdAt: string;
}) {
  const isPositive = amount > 0;
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div style={styles.transactionRow}>
      <span
        style={{
          ...styles.transactionAmount,
          color: isPositive ? 'var(--accent-gold)' : 'var(--accent-error)',
        }}
      >
        {isPositive ? '+' : ''}{amount}
      </span>
      <span style={styles.transactionDescription}>
        {description ?? 'Credit transaction'}
      </span>
      <span style={styles.transactionDate}>{formattedDate}</span>
    </div>
  );
}

function CheckoutStatusBanner({
  isPolling,
  pollTimedOut,
}: {
  isPolling: boolean;
  pollTimedOut: boolean;
}) {
  if (pollTimedOut) {
    return (
      <div style={styles.infoBanner} role="status">
        Your purchase is being processed. Credits will appear shortly.
      </div>
    );
  }

  if (isPolling) {
    return (
      <div style={styles.successBanner} role="status">
        <div className="thinking-dots" style={{ display: 'inline-flex', marginRight: 8 }}>
          <div className="thinking-dot" />
          <div className="thinking-dot" />
          <div className="thinking-dot" />
        </div>
        Confirming your purchase...
      </div>
    );
  }

  return null;
}

// =============================================================================
// Main Component
// =============================================================================

export function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session: authSession, logout } = useAuth();

  const {
    balance,
    lifetimeCredits,
    transactions,
    packages,
    isLoading,
    error,
    fetchBalance,
    fetchPackages,
    fetchTransactions,
    createCheckout,
    createPortal,
  } = useCreditStore();

  const [processingPackageId, setProcessingPackageId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const previousBalanceRef = useRef<number | null>(null);

  const token = authSession?.access_token ?? '';

  // ---------------------------------------------------------------------------
  // Initial data load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!token) return;

    fetchBalance(token);
    fetchPackages(token);
    fetchTransactions(token);
  }, [token, fetchBalance, fetchPackages, fetchTransactions]);

  // ---------------------------------------------------------------------------
  // Checkout success polling
  // ---------------------------------------------------------------------------

  const pollForBalanceUpdate = useCallback(async () => {
    if (!token) return;

    const initialBalance = previousBalanceRef.current;
    setIsPolling(true);
    setPollTimedOut(false);

    const startTime = Date.now();

    const poll = async () => {
      await fetchBalance(token);
      const currentBalance = useCreditStore.getState().balance;
      const elapsed = Date.now() - startTime;

      if (initialBalance !== null && currentBalance > initialBalance) {
        setIsPolling(false);
        fetchTransactions(token);
        setSearchParams({}, { replace: true });
        return;
      }

      if (elapsed >= POLL_MAX_DURATION_MS) {
        setIsPolling(false);
        setPollTimedOut(true);
        setSearchParams({}, { replace: true });
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
  }, [token, fetchBalance, fetchTransactions, setSearchParams]);

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');

    if (checkoutStatus === 'success' && !isPolling) {
      previousBalanceRef.current = balance;
      pollForBalanceUpdate();
    }
  }, [searchParams, balance, isPolling, pollForBalanceUpdate]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleBuyPackage = async (packageId: string) => {
    if (!token || processingPackageId) return;

    setProcessingPackageId(packageId);
    const url = await createCheckout(token, packageId);

    if (url) {
      window.location.href = url;
    }

    setProcessingPackageId(null);
  };

  const handleManagePayments = async () => {
    if (!token) return;

    const url = await createPortal(token);

    if (url) {
      window.location.href = url;
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading && packages.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.centered}>
          <div className="thinking-dots">
            <div className="thinking-dot" />
            <div className="thinking-dot" />
            <div className="thinking-dot" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <span className="font-serif" style={styles.brandName}>
          Sage Codex
        </span>
        <div style={styles.headerActions}>
          <Link to="/" style={styles.navLink}>
            Sessions
          </Link>
          <button
            onClick={logout}
            style={styles.logoutButton}
            type="button"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Settings</h1>

        {/* Error Banner */}
        {error && (
          <div style={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        {/* Checkout Status */}
        <CheckoutStatusBanner isPolling={isPolling} pollTimedOut={pollTimedOut} />

        {/* Credit Balance */}
        <CreditBalanceCard balance={balance} lifetimeCredits={lifetimeCredits} />

        {/* Credit Packages */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Purchase Credits</h2>
          <div style={styles.packagesGrid}>
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                name={pkg.name}
                credits={pkg.credits}
                priceInCents={pkg.priceInCents}
                description={pkg.description}
                isProcessing={processingPackageId === pkg.id}
                onBuy={() => handleBuyPackage(pkg.id)}
              />
            ))}
          </div>
        </div>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Transaction History</h2>
            <div className="detail-card" style={styles.transactionsCard}>
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  amount={tx.amount}
                  description={tx.description}
                  createdAt={tx.createdAt}
                />
              ))}
            </div>
          </div>
        )}

        {/* Payment Management */}
        <div style={styles.section}>
          <button
            onClick={handleManagePayments}
            style={styles.portalButton}
            type="button"
          >
            Manage Payment Methods
          </button>
        </div>

        {/* Back to Sessions */}
        <div style={styles.section}>
          <button
            onClick={() => navigate('/')}
            style={styles.backButton}
            type="button"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Inline Styles (using design tokens via CSS custom properties)
// =============================================================================

const sectionCardStyle: React.CSSProperties = { padding: '24px', marginBottom: 24 };

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' },
  centered: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' },
  brandName: { fontSize: 16, fontWeight: 600, color: 'var(--accent-gold)' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 16 },
  navLink: { color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', fontFamily: 'var(--font-sans)' },
  logoutButton: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '6px 12px' },
  content: { maxWidth: 640, margin: '0 auto', padding: '32px 24px' },
  pageTitle: { fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--accent-gold)', marginBottom: 24, marginTop: 0 },
  errorBanner: { padding: '10px 14px', marginBottom: 20, background: 'rgba(219, 126, 126, 0.1)', border: '1px solid rgba(219, 126, 126, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-error)', fontSize: 13, lineHeight: 1.5 },
  successBanner: { padding: '10px 14px', marginBottom: 20, background: 'rgba(180, 162, 110, 0.1)', border: '1px solid rgba(180, 162, 110, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-gold)', fontSize: 13, lineHeight: 1.5, display: 'flex', alignItems: 'center' },
  infoBanner: { padding: '10px 14px', marginBottom: 20, background: 'rgba(180, 162, 110, 0.08)', border: '1px solid rgba(180, 162, 110, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--accent-gold)', marginBottom: 16, marginTop: 0 },
  balanceDisplay: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 },
  balanceNumber: { fontFamily: 'var(--font-serif)', fontSize: 48, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 },
  balanceLabel: { fontSize: 16, color: 'var(--text-secondary)' },
  lifetimeText: { fontSize: 13, color: 'var(--text-muted)', margin: 0 },
  packagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 },
  packageCard: { padding: '20px', display: 'flex', flexDirection: 'column', gap: 8 },
  packageName: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-serif)' },
  packageDescription: { fontSize: 13, color: 'var(--text-muted)', margin: 0, flex: 1 },
  packagePricing: { display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 },
  packagePrice: { fontSize: 20, fontWeight: 700, color: 'var(--accent-gold)' },
  perCredit: { fontSize: 12, color: 'var(--text-muted)' },
  buyButton: { marginTop: 8, width: '100%' },
  transactionsCard: { padding: '4px 16px' },
  transactionRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' },
  transactionAmount: { fontSize: 14, fontWeight: 600, minWidth: 40, textAlign: 'right' as const },
  transactionDescription: { fontSize: 13, color: 'var(--text-secondary)', flex: 1 },
  transactionDate: { fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' as const },
  portalButton: { background: 'none', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '10px 20px', borderRadius: 'var(--radius-sm)', width: '100%' },
  backButton: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '6px 0', textDecoration: 'underline' },
};
