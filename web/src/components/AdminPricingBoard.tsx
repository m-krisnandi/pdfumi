"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch, toApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  ShieldCheck,
  Edit3,
  RefreshCw,
  Check,
  X,
  Lock,
  TrendingUp,
  Receipt,
  Users,
  Sliders,
  UserCheck,
  UserPlus,
  Search,
  Clock,
  Sparkles,
  Tag,
  PlusCircle,
  Copy,
  Infinity as InfinityIcon,
  Trash2,
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  priceIdr: number;
  priceUsd: number;
  durationDays: number;
  monthlyDocumentLimit: number;
  certificateMaxRecipients: number;
  maxApiKeys: number;
  brandFooter: boolean;
  badge: string | null;
  active: boolean;
  updatedAt: string;
}

interface PaymentOrder {
  id: string;
  orderReference: string;
  accountId: string;
  accountEmail: string;
  gateway: string;
  plan: string;
  durationMonths: number;
  amount: number;
  amountFormatted: string;
  status: string;
  qrUrl?: string;
  checkoutUrl?: string;
  paidAt?: string | null;
  expiresAt: string;
  createdAt: string;
}

interface UserAccount {
  id: string;
  email: string;
  plan: string;
  subscriptionStatus: string;
  currentPeriodEnd?: string | null;
  activeKeysCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PromoCode {
  code: string;
  discountPercent: number;
  plan: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
}

interface AdminStats {
  totalAccounts: number;
  proAccounts: number;
  businessAccounts: number;
  unlimitedAccounts?: number;
  freeAccounts: number;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  expiredOrders: number;
  totalRevenueIdr: number;
  totalRevenueIdrFormatted: string;
}

export function AdminPricingBoard() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"plans" | "orders" | "accounts" | "promos">("plans");

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filters & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [promoSearchQuery, setPromoSearchQuery] = useState("");

  // Modals
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({
    name: "",
    priceIdr: 0,
    priceUsd: 0,
    durationDays: 30,
    monthlyDocumentLimit: 500,
    certificateMaxRecipients: 100,
    maxApiKeys: 2,
    badge: "",
    active: true,
  });

  const [grantingAccount, setGrantingAccount] = useState<UserAccount | null>(null);
  const [grantForm, setGrantForm] = useState({
    plan: "PRO",
    days: 30,
    lifetime: false,
  });

  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    email: "",
    plan: "PRO",
    days: 30,
    lifetime: false,
  });
  const [provisionResult, setProvisionResult] = useState<{
    email: string;
    plan: string;
    apiKey: string;
    isLifetime: boolean;
  } | null>(null);

  const [showCreatePromoModal, setShowCreatePromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: "",
    discountPercent: 100,
    plan: "ALL",
    maxUses: 100,
    expiresAt: "",
  });

  // Check saved session on mount
  useEffect(() => {
    const savedKey = sessionStorage.getItem("pdfumi_admin_key");
    if (savedKey) {
      setAdminKey(savedKey);
      void loadAllData(savedKey);
    }
  }, []);

  async function loadAllData(keyToUse: string) {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const resStats = await apiFetch("/api/v1/billing/admin/stats", {
        headers: { "X-Admin-Key": keyToUse },
      });
      if (!resStats.ok) throw await toApiError(resStats);
      const dataStats: AdminStats = await resStats.json();
      setStats(dataStats);

      // 2. Fetch Plans
      const resPlans = await apiFetch("/api/v1/billing/admin/plans", {
        headers: { "X-Admin-Key": keyToUse },
      });
      if (resPlans.ok) {
        const dataPlans: PricingPlan[] = await resPlans.json();
        setPlans(dataPlans);
      }

      // 3. Fetch Orders
      const resOrders = await apiFetch("/api/v1/billing/admin/orders", {
        headers: { "X-Admin-Key": keyToUse },
      });
      if (resOrders.ok) {
        const dataOrders: PaymentOrder[] = await resOrders.json();
        setOrders(dataOrders);
      }

      // 4. Fetch Accounts
      const resAccounts = await apiFetch("/api/v1/billing/admin/accounts", {
        headers: { "X-Admin-Key": keyToUse },
      });
      if (resAccounts.ok) {
        const dataAccounts: UserAccount[] = await resAccounts.json();
        setAccounts(dataAccounts);
      }

      // 5. Fetch Promos
      const resPromos = await apiFetch("/api/v1/billing/admin/promos", {
        headers: { "X-Admin-Key": keyToUse },
      });
      if (resPromos.ok) {
        const dataPromos: PromoCode[] = await resPromos.json();
        setPromos(dataPromos);
      }

      setIsAuthenticated(true);
      sessionStorage.setItem("pdfumi_admin_key", keyToUse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data admin");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKey.trim()) return;
    void loadAllData(adminKey.trim());
  }

  function handleLogout() {
    sessionStorage.removeItem("pdfumi_admin_key");
    setIsAuthenticated(false);
    setAdminKey("");
    setPlans([]);
    setOrders([]);
    setAccounts([]);
    setPromos([]);
    setStats(null);
  }

  // --- Actions ---

  async function handleMarkOrderPaid(orderRef: string) {
    if (!confirm(`Verifikasi pembayaran untuk nomor order: ${orderRef}? Hak akses pelanggan akan langsung diaktifkan.`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const res = await apiFetch(`/api/v1/billing/admin/orders/${encodeURIComponent(orderRef)}/mark-paid`, {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
      });
      if (!res.ok) throw await toApiError(res);
      const data = await res.json();
      setSuccessNotice(data.message || `Order ${orderRef} berhasil diverifikasi Lunas.`);
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memverifikasi order");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCleanupExpired() {
    setActionLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const res = await apiFetch("/api/v1/billing/admin/cleanup-expired", {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
      });
      if (!res.ok) throw await toApiError(res);
      const data = await res.json();
      setSuccessNotice(data.message || "Pembersihan order kedaluwarsa berhasil.");
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membersihkan order kedaluwarsa");
    } finally {
      setActionLoading(false);
    }
  }

  function openEditPlanModal(plan: PricingPlan) {
    setEditingPlan(plan);
    setEditPlanForm({
      name: plan.name,
      priceIdr: plan.priceIdr,
      priceUsd: plan.priceUsd,
      durationDays: plan.durationDays,
      monthlyDocumentLimit: plan.monthlyDocumentLimit,
      certificateMaxRecipients: plan.certificateMaxRecipients,
      maxApiKeys: plan.maxApiKeys,
      badge: plan.badge || "",
      active: plan.active,
    });
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlan) return;
    setActionLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const res = await apiFetch(`/api/v1/billing/admin/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({
          name: editPlanForm.name,
          priceIdr: editPlanForm.priceIdr,
          priceUsd: editPlanForm.priceUsd,
          durationDays: editPlanForm.durationDays,
          monthlyDocumentLimit: editPlanForm.monthlyDocumentLimit,
          certificateMaxRecipients: editPlanForm.certificateMaxRecipients,
          maxApiKeys: editPlanForm.maxApiKeys,
          badge: editPlanForm.badge.trim() || null,
          active: editPlanForm.active,
        }),
      });

      if (!res.ok) throw await toApiError(res);

      setSuccessNotice(`Paket ${editingPlan.id} berhasil diperbarui.`);
      setEditingPlan(null);
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan paket");
    } finally {
      setActionLoading(false);
    }
  }

  function openGrantModal(account: UserAccount) {
    setGrantingAccount(account);
    setGrantForm({
      plan: account.plan === "FREE" ? "PRO" : account.plan,
      days: 30,
      lifetime: account.subscriptionStatus === "lifetime",
    });
  }

  async function handleGrantAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!grantingAccount) return;
    setActionLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const res = await apiFetch(`/api/v1/billing/admin/accounts/${grantingAccount.id}/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({
          plan: grantForm.plan,
          days: grantForm.days,
          lifetime: grantForm.lifetime,
        }),
      });

      if (!res.ok) throw await toApiError(res);
      const data = await res.json();
      setSuccessNotice(data.message || `Akun ${grantingAccount.email} berhasil diperbarui.`);
      setGrantingAccount(null);
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui akun");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleProvisionAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!provisionForm.email.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const res = await apiFetch("/api/v1/billing/admin/accounts/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({
          email: provisionForm.email.trim(),
          plan: provisionForm.plan,
          days: provisionForm.days,
          lifetime: provisionForm.lifetime,
        }),
      });

      if (!res.ok) throw await toApiError(res);
      const data = await res.json();
      setProvisionResult({
        email: data.email,
        plan: data.plan,
        apiKey: data.apiKey,
        isLifetime: Boolean(data.isLifetime),
      });
      setSuccessNotice(`Akun khusus untuk ${data.email} berhasil dibuat.`);
      setShowProvisionModal(false);
      setProvisionForm({ email: "", plan: "PRO", days: 30, lifetime: false });
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat akun khusus");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreatePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoForm.code.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccessNotice(null);
    try {
      const res = await apiFetch("/api/v1/billing/admin/promos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey,
        },
        body: JSON.stringify({
          code: promoForm.code.trim().toUpperCase(),
          discountPercent: promoForm.discountPercent,
          plan: promoForm.plan,
          maxUses: promoForm.maxUses,
          expiresAt: promoForm.expiresAt ? new Date(promoForm.expiresAt).toISOString() : null,
        }),
      });

      if (!res.ok) throw await toApiError(res);
      const data = await res.json();
      setSuccessNotice(`Kode promo ${data.code} (${data.discountPercent}% diskon) berhasil dibuat.`);
      setShowCreatePromoModal(false);
      setPromoForm({ code: "", discountPercent: 100, plan: "ALL", maxUses: 100, expiresAt: "" });
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kode promo");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTogglePromo(code: string, currentActive: boolean) {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/v1/billing/admin/promos/${encodeURIComponent(code)}/toggle?active=${!currentActive}`, {
        method: "PUT",
        headers: { "X-Admin-Key": adminKey },
      });
      if (!res.ok) throw await toApiError(res);
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status promo");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeletePromo(code: string) {
    if (!confirm(`Hapus kode promo ${code}?`)) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/v1/billing/admin/promos/${encodeURIComponent(code)}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      if (!res.ok) throw await toApiError(res);
      setSuccessNotice(`Kode promo ${code} berhasil dihapus.`);
      void loadAllData(adminKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus promo");
    } finally {
      setActionLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("Berhasil disalin ke clipboard!");
  }

  // Filtered lists
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = orderStatusFilter === "ALL" || o.status === orderStatusFilter;
      const matchSearch =
        !orderSearchQuery.trim() ||
        o.orderReference.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.accountEmail.toLowerCase().includes(orderSearchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      return (
        !accountSearchQuery.trim() ||
        a.email.toLowerCase().includes(accountSearchQuery.toLowerCase())
      );
    });
  }, [accounts, accountSearchQuery]);

  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      return (
        !promoSearchQuery.trim() ||
        p.code.toLowerCase().includes(promoSearchQuery.toLowerCase())
      );
    });
  }, [promos, promoSearchQuery]);

  // Login view
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="glass-panel rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3.5 rounded-2xl glass-pill text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Pdfumi Admin Portal
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Pusat Kendali Bisnis & Operasional
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5">
              <ErrorBanner message={error} />
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Admin Secret Key (X-Admin-Key)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Masukkan password admin..."
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
                required
              />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
                Default pengujian lokal: <code className="font-mono text-zinc-700 dark:text-zinc-300">changeme</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="glass-pill px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 rounded-full">
              Admin Portal
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Sistem Produksi & Dynamic Billing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Pusat Kendali Bisnis & Operasional
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadAllData(adminKey)}
            disabled={loading || actionLoading}
            className="glass-pill flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Segarkan Data
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="glass-pill flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 border-red-300/40 dark:border-red-900/40 hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && <ErrorBanner message={error} />}
      {successNotice && (
        <div className="glass-panel p-4 rounded-2xl border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
            </div>
            <span className="font-medium">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Provision Result Notification Card */}
      {provisionResult && (
        <div className="glass-panel p-6 rounded-3xl border-purple-500/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Akun Khusus Baru Siap Diberikan</span>
            </div>
            <button
              onClick={() => setProvisionResult(null)}
              className="text-xs text-purple-700 dark:text-purple-400 hover:underline"
            >
              Tutup
            </button>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Akun untuk <strong className="text-zinc-900 dark:text-white">{provisionResult.email}</strong> dengan paket <strong className="text-purple-600 dark:text-purple-400">{provisionResult.plan}</strong> ({provisionResult.isLifetime ? "Seumur Hidup / Unlimited" : "Aktif"}) telah siap. Berikan API Key berikut kepada klien:
          </p>
          <div className="flex items-center gap-2.5 pt-1">
            <code className="px-3.5 py-2 glass-input font-mono text-xs rounded-xl text-purple-950 dark:text-purple-200 flex-1 truncate select-all">
              {provisionResult.apiKey}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(provisionResult.apiKey)}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> Salin Key
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-3xl p-5 hover:scale-[1.01] transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pendapatan QRIS
              </span>
              <div className="p-2 rounded-xl glass-pill text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {stats.totalRevenueIdrFormatted}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Dari {stats.paidOrders} transaksi sukses
            </p>
          </div>

          <div className="glass-card rounded-3xl p-5 hover:scale-[1.01] transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Transaksi
              </span>
              <div className="p-2 rounded-xl glass-pill text-blue-600 dark:text-blue-400">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {stats.totalOrders}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.paidOrders} Lunas</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats.unpaidOrders} Menunggu</span>
              <span>•</span>
              <span>{stats.expiredOrders} Batal</span>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 hover:scale-[1.01] transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Pelanggan Aktif
              </span>
              <div className="p-2 rounded-xl glass-pill text-purple-600 dark:text-purple-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {stats.proAccounts + stats.businessAccounts + (stats.unlimitedAccounts || 0)}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              <span className="text-purple-600 dark:text-purple-400 font-semibold">{stats.proAccounts} Pro</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{stats.businessAccounts} Bisnis</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{stats.unlimitedAccounts || 0} VIP</span>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 hover:scale-[1.01] transition-all relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Pembersih Otomatis
                </span>
                <div className="p-2 rounded-xl glass-pill text-zinc-600 dark:text-zinc-300">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Order kedaluwarsa dibersihkan tiap 30m otomatis.
              </div>
            </div>
            <button
              type="button"
              onClick={handleCleanupExpired}
              disabled={actionLoading}
              className="mt-3 glass-pill px-3 py-2 text-xs font-semibold rounded-xl text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 w-full"
            >
              Jalankan Pembersihan
            </button>
          </div>
        </div>
      )}

      {/* Apple-Style Segmented Capsule Tab Bar */}
      <div className="flex items-center justify-start">
        <div className="glass-segmented p-1.5 rounded-2xl inline-flex flex-wrap items-center gap-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "plans"
                ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-md border border-black/5 dark:border-white/10"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Paket & Harga
            <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-zinc-200/70 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
              {plans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-md border border-black/5 dark:border-white/10"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Riwayat Transaksi
            <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-zinc-200/70 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "accounts"
                ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-md border border-black/5 dark:border-white/10"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Pengguna & Langganan
            <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-zinc-200/70 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
              {accounts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("promos")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "promos"
                ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-md border border-black/5 dark:border-white/10"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Kode Promo & Diskon
            <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-zinc-200/70 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
              {promos.length}
            </span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: PAKET & HARGA ================= */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Manajemen Paket Harga Dinamis
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Seluruh harga dan batas kuota disimpan langsung di database tanpa hardcode.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-500/5 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-200/60 dark:border-white/10">
                <tr>
                  <th className="py-4 px-5">ID Paket</th>
                  <th className="py-4 px-5">Nama</th>
                  <th className="py-4 px-5">Harga IDR (QRIS)</th>
                  <th className="py-4 px-5">Harga USD</th>
                  <th className="py-4 px-5">Durasi</th>
                  <th className="py-4 px-5">Limit Dokumen</th>
                  <th className="py-4 px-5">Badge</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-500/5 dark:hover:bg-white/[0.04] transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-zinc-900 dark:text-white">
                      {p.id}
                    </td>
                    <td className="py-4 px-5 font-semibold text-zinc-800 dark:text-zinc-200">
                      {p.name}
                    </td>
                    <td className="py-4 px-5 font-bold text-emerald-700 dark:text-emerald-300">
                      Rp {p.priceIdr.toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-5 font-bold text-sky-700 dark:text-sky-300">
                      ${p.priceUsd}
                    </td>
                    <td className="py-4 px-5 text-zinc-600 dark:text-zinc-400 font-medium">
                      {p.durationDays >= 3650 ? "Seumur Hidup" : `${p.durationDays} hari`}
                    </td>
                    <td className="py-4 px-5 text-zinc-600 dark:text-zinc-400 font-medium">
                      {p.monthlyDocumentLimit >= 1000000 ? "Tanpa Batas" : `${p.monthlyDocumentLimit.toLocaleString()} dok/bln`}
                    </td>
                    <td className="py-4 px-5">
                      {p.badge ? (
                        <span className="glass-pill px-2.5 py-0.5 text-xs font-bold rounded-md text-zinc-800 dark:text-zinc-200">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      {p.active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-500/15 border border-zinc-500/30 text-zinc-600 dark:text-zinc-400">
                          <X className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => openEditPlanModal(p)}
                        className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: RIWAYAT TRANSAKSI ================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Riwayat Transaksi Pembayaran
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pantau pembayaran QRIS, e-wallet, dan kartu kredit Midtrans secara langsung. Anda dapat memverifikasi order manual.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari order ref / email..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="glass-input pl-9 pr-3.5 py-2 text-xs rounded-xl w-52"
                />
              </div>

              <div className="glass-segmented p-1 rounded-xl flex gap-1 text-xs">
                {["ALL", "PAID", "UNPAID", "EXPIRED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      orderStatusFilter === status
                        ? "bg-white dark:bg-white/15 text-zinc-950 dark:text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-500/5 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-200/60 dark:border-white/10">
                <tr>
                  <th className="py-4 px-5">Order Ref</th>
                  <th className="py-4 px-5">Email Pelanggan</th>
                  <th className="py-4 px-5">Paket</th>
                  <th className="py-4 px-5">Nominal</th>
                  <th className="py-4 px-5">Gateway</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Waktu Dibuat</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-500/5 dark:hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-5 font-mono text-xs font-bold text-zinc-900 dark:text-white">
                        {o.orderReference}
                      </td>
                      <td className="py-4 px-5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {o.accountEmail}
                      </td>
                      <td className="py-4 px-5">
                        <span className="glass-pill px-2.5 py-0.5 text-xs font-bold rounded-md text-zinc-800 dark:text-zinc-200">
                          {o.plan} ({o.durationMonths} bln)
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-emerald-700 dark:text-emerald-300">
                        {o.amountFormatted}
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-600 dark:text-zinc-400 font-semibold uppercase">
                        {o.gateway}
                      </td>
                      <td className="py-4 px-5">
                        {o.status === "PAID" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Lunas
                          </span>
                        )}
                        {o.status === "UNPAID" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Menunggu
                          </span>
                        )}
                        {o.status === "EXPIRED" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-zinc-500/15 border border-zinc-500/30 text-zinc-600 dark:text-zinc-400">
                            <X className="w-3 h-3" /> Kedaluwarsa
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(o.createdAt).toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {o.status === "UNPAID" && (
                          <button
                            type="button"
                            onClick={() => handleMarkOrderPaid(o.orderReference)}
                            disabled={actionLoading}
                            className="glass-pill px-3 py-1.5 text-xs font-bold rounded-xl text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                          >
                            Verifikasi Lunas
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: PENGGUNA & LANGGANAN ================= */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Daftar Pengguna & Langganan
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kelola hak akses paket, daftarkan akun baru secara langsung, atau ubah durasi langganan.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari email pengguna..."
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  className="glass-input pl-9 pr-3.5 py-2 text-xs rounded-xl w-52"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowProvisionModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" /> Daftarkan Akun Baru
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-500/5 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-200/60 dark:border-white/10">
                <tr>
                  <th className="py-4 px-5">Email</th>
                  <th className="py-4 px-5">Paket Aktif</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Masa Berlaku</th>
                  <th className="py-4 px-5">API Keys</th>
                  <th className="py-4 px-5">Terdaftar</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                      Tidak ada akun pengguna yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-zinc-500/5 dark:hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-5 font-semibold text-xs text-zinc-900 dark:text-white">
                        {acc.email}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            acc.plan === "UNLIMITED"
                              ? "bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300"
                              : acc.plan === "BUSINESS"
                              ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                              : acc.plan === "PRO"
                              ? "bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300"
                              : "bg-zinc-500/15 border border-zinc-500/30 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {acc.plan}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs">
                        {acc.subscriptionStatus === "lifetime" ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <InfinityIcon className="w-3.5 h-3.5" /> Seumur Hidup
                          </span>
                        ) : acc.subscriptionStatus === "active" ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Aktif</span>
                        ) : (
                          <span className="text-zinc-400">Tidak Aktif</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        {acc.subscriptionStatus === "lifetime" ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">Permanen</span>
                        ) : acc.currentPeriodEnd ? (
                          new Date(acc.currentPeriodEnd).toLocaleDateString("id-ID")
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-500 dark:text-zinc-400">
                        {acc.activeKeysCount} key
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(acc.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => openGrantModal(acc)}
                          className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-800 dark:text-zinc-200 hover:scale-105 active:scale-95 transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Kelola Tier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: KODE PROMO & VOUCHER ================= */}
      {activeTab === "promos" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Manajemen Kode Promo & Voucher
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Buat kode kupon diskon persentase atau kode 100% gratis untuk promosi & kampanye influencer.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari kode promo..."
                  value={promoSearchQuery}
                  onChange={(e) => setPromoSearchQuery(e.target.value)}
                  className="glass-input pl-9 pr-3.5 py-2 text-xs rounded-xl w-48"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCreatePromoModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Buat Kode Promo Baru
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-500/5 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-200/60 dark:border-white/10">
                <tr>
                  <th className="py-4 px-5">Kode Promo</th>
                  <th className="py-4 px-5">Diskon</th>
                  <th className="py-4 px-5">Paket Berlaku</th>
                  <th className="py-4 px-5">Penggunaan</th>
                  <th className="py-4 px-5">Kedaluwarsa</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40 dark:divide-white/5">
                {filteredPromos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                      Tidak ada kode promo aktif.
                    </td>
                  </tr>
                ) : (
                  filteredPromos.map((p) => (
                    <tr key={p.code} className="hover:bg-zinc-500/5 dark:hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-xs text-zinc-900 dark:text-white">
                        {p.code}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            p.discountPercent === 100
                              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                              : "bg-blue-500/15 border border-blue-500/30 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {p.discountPercent}% {p.discountPercent === 100 ? "Gratis" : "Diskon"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {p.plan}
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        {p.usedCount} / {p.maxUses === 0 ? "Unlimited" : p.maxUses} kali
                      </td>
                      <td className="py-4 px-5 text-xs text-zinc-500 dark:text-zinc-400">
                        {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("id-ID") : "Selamanya"}
                      </td>
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => handleTogglePromo(p.code, p.active)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                            p.active
                              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                              : "bg-zinc-500/15 border border-zinc-500/30 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {p.active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeletePromo(p.code)}
                          disabled={actionLoading}
                          className="glass-pill p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:scale-105 active:scale-95 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= EDIT PLAN MODAL ================= */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-white/10">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Edit Paket: {editingPlan.id}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Perubahan akan langsung berlaku pada sistem dan pricing board.
                </p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="glass-pill p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={editPlanForm.name}
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, name: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Badge Promosi
                  </label>
                  <input
                    type="text"
                    value={editPlanForm.badge}
                    placeholder="Misal: Hemat 50%"
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, badge: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Harga IDR (Rupiah QRIS)
                  </label>
                  <input
                    type="number"
                    value={editPlanForm.priceIdr}
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, priceIdr: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Harga USD (Internasional)
                  </label>
                  <input
                    type="number"
                    value={editPlanForm.priceUsd}
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, priceUsd: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Masa Aktif (Hari)
                  </label>
                  <input
                    type="number"
                    value={editPlanForm.durationDays}
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, durationDays: parseInt(e.target.value) || 1 })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Limit Dokumen / Bulan
                  </label>
                  <input
                    type="number"
                    value={editPlanForm.monthlyDocumentLimit}
                    onChange={(e) =>
                      setEditPlanForm({ ...editPlanForm, monthlyDocumentLimit: parseInt(e.target.value) || 100 })
                    }
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Max Penerima Sertifikat
                  </label>
                  <input
                    type="number"
                    value={editPlanForm.certificateMaxRecipients}
                    onChange={(e) =>
                      setEditPlanForm({ ...editPlanForm, certificateMaxRecipients: parseInt(e.target.value) || 20 })
                    }
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Max API Key
                  </label>
                  <input
                    type="number"
                    value={editPlanForm.maxApiKeys}
                    onChange={(e) => setEditPlanForm({ ...editPlanForm, maxApiKeys: parseInt(e.target.value) || 1 })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="activePlan"
                  checked={editPlanForm.active}
                  onChange={(e) => setEditPlanForm({ ...editPlanForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-zinc-300 dark:border-zinc-700"
                />
                <label htmlFor="activePlan" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Paket Aktif & Ditampilkan di Halaman Pricing
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="glass-pill px-4 py-2.5 text-xs font-bold rounded-xl text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= GRANT / EXTEND ACCOUNT MODAL ================= */}
      {grantingAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-white/10">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Kelola Tier Pengguna
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{grantingAccount.email}</p>
              </div>
              <button
                onClick={() => setGrantingAccount(null)}
                className="glass-pill p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGrantAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Pilih Paket Tujuan
                </label>
                <select
                  value={grantForm.plan}
                  onChange={(e) => setGrantForm({ ...grantForm, plan: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                >
                  <option value="PRO">PRO</option>
                  <option value="BUSINESS">BUSINESS</option>
                  <option value="UNLIMITED">UNLIMITED (VIP Tanpa Batas)</option>
                  <option value="PASS">PASS (7 Hari)</option>
                  <option value="FREE">FREE (Kembalikan ke Gratis)</option>
                </select>
              </div>

              {grantForm.plan !== "FREE" && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="grantLifetime"
                      checked={grantForm.lifetime}
                      onChange={(e) => setGrantForm({ ...grantForm, lifetime: e.target.checked })}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-zinc-300 dark:border-zinc-700"
                    />
                    <label htmlFor="grantLifetime" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <InfinityIcon className="w-3.5 h-3.5 text-amber-500" /> Akses Seumur Hidup (Lifetime / Unlimited)
                    </label>
                  </div>

                  {!grantForm.lifetime && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Tambah Durasi (Hari)
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {[7, 30, 90, 365].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setGrantForm({ ...grantForm, days: d })}
                            className={`py-1.5 text-xs rounded-xl font-bold transition-all ${
                              grantForm.days === d
                                ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-zinc-950 shadow-sm"
                                : "glass-pill text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {d} Hari
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={grantForm.days}
                        onChange={(e) => setGrantForm({ ...grantForm, days: parseInt(e.target.value) || 0 })}
                        className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setGrantingAccount(null)}
                  className="glass-pill px-4 py-2.5 text-xs font-bold rounded-xl text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Menerapkan..." : "Terapkan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PROVISION NEW ACCOUNT MODAL ================= */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-white/10">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Daftarkan Akun Khusus
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Buat akun untuk klien/mitra dan dapatkan API key instan.
                </p>
              </div>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="glass-pill p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  value={provisionForm.email}
                  onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                  placeholder="partner@example.com"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Paket Langganan
                </label>
                <select
                  value={provisionForm.plan}
                  onChange={(e) => setProvisionForm({ ...provisionForm, plan: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                >
                  <option value="PRO">PRO (500 dok/bln)</option>
                  <option value="BUSINESS">BUSINESS (3.000 dok/bln)</option>
                  <option value="UNLIMITED">UNLIMITED (VIP 1.000.000 dok)</option>
                  <option value="PASS">PASS (Event 7 Hari)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="provisionLifetime"
                  checked={provisionForm.lifetime}
                  onChange={(e) => setProvisionForm({ ...provisionForm, lifetime: e.target.checked })}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-zinc-300 dark:border-zinc-700"
                />
                <label htmlFor="provisionLifetime" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <InfinityIcon className="w-3.5 h-3.5 text-amber-500" /> Akses Seumur Hidup (Lifetime)
                </label>
              </div>

              {!provisionForm.lifetime && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Durasi Aktif (Hari)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[7, 30, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setProvisionForm({ ...provisionForm, days: d })}
                        className={`py-1.5 text-xs rounded-xl font-bold transition-all ${
                          provisionForm.days === d
                            ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-zinc-950 shadow-sm"
                            : "glass-pill text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {d} Hari
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={provisionForm.days}
                    onChange={(e) => setProvisionForm({ ...provisionForm, days: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="glass-pill px-4 py-2.5 text-xs font-bold rounded-xl text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Membuat..." : "Buat & Terbitkan Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CREATE PROMO MODAL ================= */}
      {showCreatePromoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-white/10">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Buat Kode Promo / Voucher
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tentukan persentase potongan harga atau kupon 100% gratis.
                </p>
              </div>
              <button
                onClick={() => setShowCreatePromoModal(false)}
                className="glass-pill p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kode Promo (Huruf Kapital)
                </label>
                <input
                  type="text"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="Misal: LAUNCH100, HEMAT50"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl font-mono text-sm uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={promoForm.discountPercent}
                    onChange={(e) => setPromoForm({ ...promoForm, discountPercent: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    required
                  />
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">100 = Akses Gratis</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Paket Berlaku
                  </label>
                  <select
                    value={promoForm.plan}
                    onChange={(e) => setPromoForm({ ...promoForm, plan: e.target.value })}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  >
                    <option value="ALL">Semua Paket</option>
                    <option value="PRO">PRO Saja</option>
                    <option value="BUSINESS">BUSINESS Saja</option>
                    <option value="PASS">PASS Saja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Batas Penggunaan (Kali)
                </label>
                <input
                  type="number"
                  min="0"
                  value={promoForm.maxUses}
                  onChange={(e) => setPromoForm({ ...promoForm, maxUses: parseInt(e.target.value) || 0 })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  required
                />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Isi 0 untuk tanpa batas (unlimited kuota)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tanggal Kedaluwarsa (Opsional)
                </label>
                <input
                  type="date"
                  value={promoForm.expiresAt}
                  onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreatePromoModal(false)}
                  className="glass-pill px-4 py-2.5 text-xs font-bold rounded-xl text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Membuat..." : "Simpan Kode Promo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
