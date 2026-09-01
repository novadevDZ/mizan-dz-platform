"use client";

import Link from "next/link";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    AlertTriangle,
    ArrowDownRight,
    ArrowRight,
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    CircleDollarSign,
    FileText,
    Package,
    RefreshCw,
    ShieldCheck,
    ShoppingCart,
    Users,
    Wallet,
} from "lucide-react";

import type {
    DashboardData,
} from "@/src/lib/dashboard/dashboard.types";

import ProfileModal from "./profile-modal";

/* ============================================================
   DASHBOARD UI PERMISSIONS
============================================================ */

export type DashboardPermissions = {
    customers: {
        read: boolean;
        create: boolean;
    };

    products: {
        read: boolean;
    };

    sales: {
        read: boolean;
        create: boolean;
    };

    payments: {
        read: boolean;
        create: boolean;
    };

    expenses: {
        read: boolean;
        create: boolean;
    };

    invoices: {
        read: boolean;
    };

    members: {
        read: boolean;
    };
};

type DashboardClientProps = {
    initialData: DashboardData;
    permissions: DashboardPermissions;
};

type RequestState =
    | "idle"
    | "refreshing"
    | "error";

const numberFormatter =
    new Intl.NumberFormat("fr-DZ", {
        maximumFractionDigits: 0,
    });

function formatMoney(
    value: number,
    currency: string,
) {
    return `${numberFormatter.format(
        Number(value) || 0,
    )} ${currency}`;
}

function formatCompactMoney(
    value: number,
    currency: string,
) {
    const safeValue =
        Number(value) || 0;

    const absolute =
        Math.abs(safeValue);

    if (absolute >= 1_000_000) {
        const amount =
            safeValue / 1_000_000;

        return `${amount.toLocaleString(
            "fr-DZ",
            {
                maximumFractionDigits:
                    amount >= 10 ? 0 : 1,
            },
        )}M ${currency}`;
    }

    if (absolute >= 1_000) {
        const amount =
            safeValue / 1_000;

        return `${amount.toLocaleString(
            "fr-DZ",
            {
                maximumFractionDigits: 1,
            },
        )}K ${currency}`;
    }

    return formatMoney(
        safeValue,
        currency,
    );
}

function formatDate(
    date: Date,
) {
    return new Intl.DateTimeFormat(
        "en-DZ",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        },
    ).format(date);
}

function formatDateTime(
    date: Date,
) {
    return new Intl.DateTimeFormat(
        "en-DZ",
        {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        },
    ).format(date);
}

function getInitials(
    name: string | null,
) {
    const value =
        name?.trim() || "M";

    const parts =
        value.split(/\s+/);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function isDashboardData(
    value: unknown,
): value is DashboardData {
    if (
        !value ||
        typeof value !== "object"
    ) {
        return false;
    }

    const data =
        value as Record<
            string,
            unknown
        >;

    return (
        typeof data.greeting ===
        "string" &&
        typeof data.user ===
        "object" &&
        typeof data.organization ===
        "object" &&
        typeof data.kpis ===
        "object" &&
        typeof data.counts ===
        "object" &&
        Array.isArray(
            data.salesTrend,
        ) &&
        Array.isArray(
            data.recentSales,
        ) &&
        Array.isArray(
            data.topDebtors,
        ) &&
        Array.isArray(
            data.alerts,
        )
    );
}

export default function DashboardClient({
                                            initialData,
                                            permissions,
                                        }: DashboardClientProps) {
    const [data, setData] =
        useState<DashboardData>(
            initialData,
        );

    const [
        profileOpen,
        setProfileOpen,
    ] = useState(false);

    const [
        requestState,
        setRequestState,
    ] =
        useState<RequestState>(
            "idle",
        );

    const [
        errorMessage,
        setErrorMessage,
    ] = useState<
        string | null
    >(null);

    const abortControllerRef =
        useRef<AbortController | null>(
            null,
        );

    const mountedRef =
        useRef(true);

    const refreshDashboard =
        useCallback(
            async () => {
                abortControllerRef.current?.abort();

                const controller =
                    new AbortController();

                abortControllerRef.current =
                    controller;

                if (mountedRef.current) {
                    setRequestState(
                        "refreshing",
                    );

                    setErrorMessage(
                        null,
                    );
                }

                try {
                    const response =
                        await fetch(
                            "/api/dashboard",
                            {
                                method:
                                    "GET",

                                cache:
                                    "no-store",

                                headers: {
                                    Accept:
                                        "application/json",
                                },

                                signal:
                                controller.signal,
                            },
                        );

                    if (
                        response.status ===
                        401
                    ) {
                        window.location.assign(
                            "/login",
                        );

                        return;
                    }

                    if (
                        response.status ===
                        404
                    ) {
                        throw new Error(
                            "No active organization was found.",
                        );
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            `Dashboard request failed with status ${response.status}.`,
                        );
                    }

                    const payload:
                        unknown =
                        await response.json();

                    if (
                        !isDashboardData(
                            payload,
                        )
                    ) {
                        throw new Error(
                            "The dashboard API returned an invalid response.",
                        );
                    }

                    if (
                        !mountedRef.current
                    ) {
                        return;
                    }

                    setData(payload);

                    setRequestState(
                        "idle",
                    );

                    setErrorMessage(
                        null,
                    );
                } catch (error) {
                    if (
                        error instanceof
                        DOMException &&
                        error.name ===
                        "AbortError"
                    ) {
                        return;
                    }

                    console.error(
                        "[Mizan Dashboard]",
                        error,
                    );

                    if (
                        !mountedRef.current
                    ) {
                        return;
                    }

                    setRequestState(
                        "error",
                    );

                    setErrorMessage(
                        error instanceof
                        Error
                            ? error.message
                            : "Unable to refresh the dashboard.",
                    );
                }
            },
            [],
        );

    useEffect(() => {
        mountedRef.current =
            true;

        return () => {
            mountedRef.current =
                false;

            abortControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        const interval =
            window.setInterval(() => {
                if (
                    document.visibilityState ===
                    "visible"
                ) {
                    void refreshDashboard();
                }
            }, 60_000);

        return () =>
            window.clearInterval(
                interval,
            );
    }, [
        refreshDashboard,
    ]);

    const firstName =
        data.user.name
            ?.trim()
            .split(/\s+/)[0] ||
        "there";

    const currency =
        data.organization.currency ||
        "DZD";

    const refreshing =
        requestState ===
        "refreshing";

    const hasSales =
        data.salesTrend.some(
            (item) =>
                Number(item.sales) >
                0 ||
                Number(item.payments) >
                0,
        );

    /*
     * ========================================================
     * PERMISSION FLAGS
     * ========================================================
     */

    const canViewCustomers =
        permissions.customers.read;

    const canCreateCustomers =
        permissions.customers.create;

    const canViewProducts =
        permissions.products.read;

    const canViewSales =
        permissions.sales.read;

    const canCreateSales =
        permissions.sales.create;

    const canViewPayments =
        permissions.payments.read;

    const canCreatePayments =
        permissions.payments.create;

    const canViewExpenses =
        permissions.expenses.read;

    const canCreateExpenses =
        permissions.expenses.create;

    const canViewInvoices =
        permissions.invoices.read;

    const canViewMembers =
        permissions.members.read;

    /*
     * ========================================================
     * SECTION VISIBILITY
     * ========================================================
     */

    const showBusinessCounts =
        canViewCustomers ||
        canViewProducts ||
        canViewSales ||
        canViewInvoices;

    const showSalesOverview =
        canViewSales ||
        canViewPayments;

    const showRecentSales =
        canViewSales;

    const showTopDebtors =
        canViewCustomers;

    const showTeam =
        canViewMembers;

    const showQuickActions =
        canCreateSales ||
        canCreatePayments ||
        canCreateCustomers ||
        canCreateExpenses;

    const showExpensesKpi =
        canViewExpenses;

    return (
        <>
            <div className="mizan-page-enter space-y-6">
                {/* ====================================================
                    HEADER
                ==================================================== */}

                <section className="mizan-page-header">
                    <div className="mizan-page-header-content min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                                Business command center
                            </p>

                            <span className="mizan-status mizan-status-info">
                                Live
                            </span>
                        </div>

                        <h1 className="mizan-page-title mt-1">
                            {data.greeting},{" "}
                            {firstName}.
                        </h1>

                        <p className="mizan-page-description">
                            Here is the current state of{" "}
                            <span className="font-semibold text-[var(--text-secondary)]">
                                {
                                    data.organization
                                        .name
                                }
                            </span>
                            .
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setProfileOpen(
                                    true,
                                )
                            }
                            className="group flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                            aria-label="Open profile"
                        >
                            <ProfileAvatar
                                name={
                                    data
                                        .user
                                        .name
                                }
                                image={
                                    data
                                        .user
                                        .image
                                }
                            />

                            <div className="hidden min-w-0 text-left sm:block">
                                <p className="max-w-[150px] truncate text-xs font-semibold text-[var(--text-primary)]">
                                    {data.user
                                            .name ||
                                        "User"}
                                </p>

                                <p className="max-w-[180px] truncate text-[11px] text-[var(--text-muted)]">
                                    {
                                        data
                                            .user
                                            .email
                                    }
                                </p>
                            </div>

                            <ChevronRight
                                className="hidden h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 sm:block"/>
                        </button>

                        <div
                            className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 md:flex">
                            <CalendarDays className="h-4 w-4 text-[var(--text-muted)]"/>

                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                                {formatDate(
                                    new Date(),
                                )}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ====================================================
                    REFRESH BAR
                ==================================================== */}

                <div
                    className="flex min-h-6 items-center justify-between gap-4"
                    aria-live="polite"
                >
                    <div className="min-w-0">
                        {errorMessage ? (
                            <div className="flex items-center gap-2 text-xs text-[var(--warning)]">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0"/>

                                <span className="truncate">
                                    {
                                        errorMessage
                                    }
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--text-muted)]">
                                Dashboard data is refreshed automatically every minute.
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void refreshDashboard()
                        }
                        disabled={
                            refreshing
                        }
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            className={
                                refreshing
                                    ? "h-3.5 w-3.5 animate-spin"
                                    : "h-3.5 w-3.5"
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>

                {/* ====================================================
                    PRIMARY KPIs
                ==================================================== */}

                <section
                    aria-label="Business statistics"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {canViewSales && (
                        <BusinessStatCard
                            title="Today's sales"
                            value={formatMoney(
                                data.kpis
                                    .todaySales,
                                currency,
                            )}
                            description="Total sales recorded today"
                            icon={
                                ShoppingCart
                            }
                            href="/sales"
                        />
                    )}

                    {canViewPayments && (
                        <BusinessStatCard
                            title="Collected today"
                            value={formatMoney(
                                data.kpis
                                    .todayCollected,
                                currency,
                            )}
                            description="Payments received today"
                            icon={Wallet}
                            href="/payments"
                        />
                    )}

                    {canViewCustomers && (
                        <BusinessStatCard
                            title="Outstanding debt"
                            value={formatCompactMoney(
                                data.kpis
                                    .outstandingDebts,
                                currency,
                            )}
                            description="Current unpaid balance"
                            icon={
                                CircleDollarSign
                            }
                            href="/customers"
                            emphasis={
                                data.kpis
                                    .outstandingDebts >
                                0
                                    ? "warning"
                                    : "normal"
                            }
                        />
                    )}

                    {showExpensesKpi && (
                        <BusinessStatCard
                            title="Today's expenses"
                            value={formatMoney(
                                data.kpis
                                    .todayExpenses,
                                currency,
                            )}
                            description="Expenses recorded today"
                            icon={
                                ArrowDownRight
                            }
                            href="/expenses"
                        />
                    )}
                </section>

                {/* ====================================================
                    BUSINESS COUNTS
                ==================================================== */}

                {showBusinessCounts && (
                    <section
                        aria-label="Business records"
                        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {canViewCustomers && (
                            <RecordMetric
                                icon={Users}
                                label="Customers"
                                value={
                                    data.counts
                                        .customers
                                }
                                href="/customers"
                            />
                        )}

                        {canViewProducts && (
                            <RecordMetric
                                icon={Package}
                                label="Products"
                                value={
                                    data.counts
                                        .products
                                }
                                href="/products"
                            />
                        )}

                        {canViewSales && (
                            <RecordMetric
                                icon={
                                    ShoppingCart
                                }
                                label="Sales"
                                value={
                                    data.counts
                                        .sales
                                }
                                href="/sales"
                            />
                        )}

                        {canViewInvoices && (
                            <RecordMetric
                                icon={FileText}
                                label="Invoices"
                                value={
                                    data.counts
                                        .invoices
                                }
                                href="/invoices"
                            />
                        )}
                    </section>
                )}

                {/* ====================================================
                    SALES + ATTENTION
                ==================================================== */}

                {showSalesOverview && (
                    <section
                        className={
                            canViewSales &&
                            data.alerts.length > 0
                                ? "grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]"
                                : "grid gap-6"
                        }
                    >
                        <section className="mizan-dashboard-section">
                            <SectionHeader
                                title="Sales overview"
                                description="Sales and payments recorded during the last seven days."
                                icon={
                                    BarChart3
                                }
                            />

                            <div className="mizan-dashboard-section-body">
                                {!hasSales ? (
                                    <EmptyState
                                        icon={
                                            ShoppingCart
                                        }
                                        title="No business activity yet"
                                        description="Sales and payment activity will appear here as transactions are recorded."
                                        actionHref={
                                            canCreateSales
                                                ? "/sales/new"
                                                : canViewSales
                                                    ? "/sales"
                                                    : "/payments"
                                        }
                                        actionLabel={
                                            canCreateSales
                                                ? "New sale"
                                                : canViewSales
                                                    ? "View sales"
                                                    : "View payments"
                                        }
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap items-end justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Last 7 days
                                                </p>

                                                <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">
                                                    {formatCompactMoney(
                                                        data.salesTrend.reduce(
                                                            (
                                                                total,
                                                                item,
                                                            ) =>
                                                                total +
                                                                (Number(
                                                                        item.sales,
                                                                    ) ||
                                                                    0),
                                                            0,
                                                        ),
                                                        currency,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <SalesTrend
                                            data={
                                                data.salesTrend
                                            }
                                            currency={
                                                currency
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </section>

                        {canViewCustomers ||
                        canViewInvoices ||
                        canViewExpenses ? (
                            <section className="mizan-dashboard-section">
                                <SectionHeader
                                    title="Needs attention"
                                    description="Items that may require action."
                                    icon={
                                        AlertTriangle
                                    }
                                />

                                <div className="mizan-dashboard-section-body">
                                    <AttentionList
                                        alerts={
                                            data.alerts
                                        }
                                        canViewCustomers={
                                            canViewCustomers
                                        }
                                        canViewInvoices={
                                            canViewInvoices
                                        }
                                        canViewExpenses={
                                            canViewExpenses
                                        }
                                    />
                                </div>
                            </section>
                        ) : null}
                    </section>
                )}

                {/* ====================================================
                    RECENT SALES + DEBTORS
                ==================================================== */}

                {(showRecentSales ||
                    showTopDebtors) && (
                    <section className="grid gap-6 xl:grid-cols-2">
                        {showRecentSales && (
                            <section className="mizan-dashboard-section">
                                <SectionHeader
                                    title="Recent sales"
                                    description="Latest transactions recorded in your organization."
                                    icon={
                                        ShoppingCart
                                    }
                                />

                                <RecentSales
                                    data={
                                        data.recentSales
                                    }
                                    currency={
                                        currency
                                    }
                                />
                            </section>
                        )}

                        {showTopDebtors && (
                            <section className="mizan-dashboard-section">
                                <SectionHeader
                                    title="Top debtors"
                                    description="Customers with outstanding balances."
                                    icon={
                                        CircleDollarSign
                                    }
                                />

                                <div className="mizan-dashboard-section-body">
                                    <TopDebtors
                                        data={
                                            data.topDebtors
                                        }
                                        currency={
                                            currency
                                        }
                                    />
                                </div>
                            </section>
                        )}
                    </section>
                )}

                {/* ====================================================
                    MONTH SUMMARY
                ==================================================== */}

                {(canViewSales ||
                    canViewPayments ||
                    canViewExpenses) && (
                    <section className="mizan-dashboard-section">
                        <SectionHeader
                            title="This month"
                            description="Current month financial snapshot."
                            icon={
                                CircleDollarSign
                            }
                        />

                        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                            {canViewSales && (
                                <MonthMetric
                                    label="Sales"
                                    value={formatMoney(
                                        data.kpis
                                            .monthSales,
                                        currency,
                                    )}
                                />
                            )}

                            {canViewPayments && (
                                <MonthMetric
                                    label="Collected"
                                    value={formatMoney(
                                        data.kpis
                                            .monthCollected,
                                        currency,
                                    )}
                                />
                            )}

                            {canViewExpenses && (
                                <MonthMetric
                                    label="Expenses"
                                    value={formatMoney(
                                        data.kpis
                                            .monthExpenses,
                                        currency,
                                    )}
                                />
                            )}

                            {(canViewPayments ||
                                canViewExpenses) && (
                                <MonthMetric
                                    label="Net cash flow"
                                    value={formatMoney(
                                        data.kpis
                                            .monthNet,
                                        currency,
                                    )}
                                    positive={
                                        data.kpis
                                            .monthNet >=
                                        0
                                    }
                                />
                            )}
                        </div>
                    </section>
                )}

                {/* ====================================================
                    BUSINESS PROFILE
                ==================================================== */}

                <section
                    className={
                        showTeam
                            ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]"
                            : "grid gap-6"
                    }
                >
                    <section className="mizan-dashboard-section">
                        <SectionHeader
                            title="Business profile"
                            description="Current Mizan organization configuration."
                            icon={
                                Building2
                            }
                        />

                        <div className="mizan-dashboard-section-body space-y-5">
                            <ProfileProgress
                                percentage={
                                    data
                                        .profile
                                        .percentage
                                }
                                completed={
                                    data
                                        .profile
                                        .completed
                                }
                                total={
                                    data
                                        .profile
                                        .total
                                }
                            />

                            <div className="mizan-divider"/>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <BusinessInfo
                                    icon={
                                        Building2
                                    }
                                    label="Business"
                                    value={
                                        data
                                            .organization
                                            .name
                                    }
                                />

                                <BusinessInfo
                                    icon={
                                        CircleDollarSign
                                    }
                                    label="Currency"
                                    value={
                                        currency
                                    }
                                />

                                <BusinessInfo
                                    icon={
                                        CalendarDays
                                    }
                                    label="Workspace age"
                                    value={
                                        data
                                            .organizationAge
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    {showTeam && (
                        <section className="mizan-dashboard-section">
                            <SectionHeader
                                title="Team"
                                description="Current membership distribution."
                                icon={
                                    Users
                                }
                            />

                            <div className="mizan-dashboard-section-body">
                                <RoleDistributionChart
                                    data={
                                        data.roleChart
                                    }
                                    total={
                                        data.memberCount
                                    }
                                />
                            </div>
                        </section>
                    )}
                </section>

                {/* ====================================================
                    QUICK ACTIONS
                ==================================================== */}

                {showQuickActions && (
                    <section>
                        <div className="mb-3">
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                                Quick actions
                            </p>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Start the workflows you use most.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {canCreateSales && (
                                <QuickAction
                                    href="/sales/new"
                                    icon={
                                        ShoppingCart
                                    }
                                    title="New sale"
                                    description="Record a new customer sale."
                                />
                            )}

                            {canCreatePayments && (
                                <QuickAction
                                    href="/payments/new"
                                    icon={Wallet}
                                    title="Record payment"
                                    description="Register a customer payment."
                                />
                            )}

                            {canCreateCustomers && (
                                <QuickAction
                                    href="/customers/new"
                                    icon={Users}
                                    title="Add customer"
                                    description="Create a customer account."
                                />
                            )}

                            {canCreateExpenses && (
                                <QuickAction
                                    href="/expenses/new"
                                    icon={
                                        ArrowDownRight
                                    }
                                    title="Add expense"
                                    description="Record a business expense."
                                />
                            )}
                        </div>
                    </section>
                )}
            </div>

            <ProfileModal
                open={profileOpen}
                onClose={() =>
                    setProfileOpen(
                        false,
                    )
                }
                data={data}
            />
        </>
    );
}

/* ============================================================
   PROFILE AVATAR
============================================================ */

function ProfileAvatar({
                           name,
                           image,
                       }: {
    name: string | null;
    image: string | null;
}) {
    if (image) {
        return (
            <img
                src={image}
                alt=""
                loading="lazy"
                className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
        );
    }

    return (
        <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--mizan-blue-soft)] text-xs font-bold text-[var(--primary)]">
            {getInitials(name)}
        </div>
    );
}

/* ============================================================
   PRIMARY KPI
============================================================ */

function BusinessStatCard({
                              title,
                              value,
                              description,
                              icon: Icon,
                              href,
                              emphasis = "normal",
                          }: {
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    href: string;
    emphasis?: "normal" | "warning";
}) {
    return (
        <Link
            href={href}
            className="mizan-stat group block h-full p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="mizan-stat-label">
                        {title}
                    </p>

                    <p
                        className={
                            emphasis ===
                            "warning"
                                ? "mt-3 break-words text-2xl font-bold tracking-[-0.04em] text-[var(--warning)]"
                                : "mizan-stat-value mt-3 break-words"
                        }
                    >
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {description}
                    </p>
                </div>

                <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                    <Icon className="h-4 w-4"/>
                </div>
            </div>

            <div className="relative z-[1] mt-5 flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
                Open
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"/>
            </div>
        </Link>
    );
}

/* ============================================================
   RECORD METRIC
============================================================ */

function RecordMetric({
                          icon: Icon,
                          label,
                          value,
                          href,
                      }: {
    icon: React.ComponentType<{
        className?: string;
    }>;
    label: string;
    value: number;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
            <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)]">
                <Icon className="h-4 w-4"/>
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    {label}
                </p>

                <p className="mt-0.5 text-lg font-bold text-[var(--text-primary)]">
                    {numberFormatter.format(
                        Number(value) || 0,
                    )}
                </p>
            </div>

            <ArrowRight
                className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"/>
        </Link>
    );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({
                           title,
                           description,
                           icon: Icon,
                       }: {
    title: string;
    description: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <div className="mizan-dashboard-section-header">
            <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {title}
                </h2>

                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                    {description}
                </p>
            </div>

            <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                <Icon className="h-4 w-4"/>
            </div>
        </div>
    );
}

/* ============================================================
   SALES TREND
============================================================ */

function SalesTrend({
                        data,
                        currency,
                    }: {
    data: DashboardData["salesTrend"];
    currency: string;
}) {
    const normalizedData =
        data.map((item) => ({
            ...item,
            sales:
                Number(item.sales) || 0,
            payments:
                Number(item.payments) || 0,
        }));

    const maxValue =
        Math.max(
            ...normalizedData.flatMap(
                (item) => [
                    item.sales,
                    item.payments,
                ],
            ),
            1,
        );

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between">
                    <span className="border-t border-[var(--border)]"/>
                    <span className="border-t border-[var(--border)]"/>
                    <span className="border-t border-[var(--border)]"/>
                    <span className="border-t border-[var(--border)]"/>
                    <span className="border-t border-[var(--border)]"/>
                </div>

                <div className="relative grid h-[280px] grid-cols-7 gap-2">
                    {normalizedData.map(
                        (item) => {
                            const salesHeight =
                                maxValue > 0
                                    ? (item.sales /
                                        maxValue) *
                                    220
                                    : 0;

                            const paymentsHeight =
                                maxValue > 0
                                    ? (item.payments /
                                        maxValue) *
                                    220
                                    : 0;

                            return (
                                <div
                                    key={
                                        item.date
                                    }
                                    className="flex min-w-0 flex-col justify-end"
                                >
                                    <div className="flex h-[240px] items-end justify-center gap-1 px-1">
                                        <div
                                            className="w-full max-w-[16px] rounded-t-md bg-[var(--primary)] transition-[height] duration-500"
                                            style={{
                                                height:
                                                    item.sales >
                                                    0
                                                        ? `${Math.max(
                                                            6,
                                                            salesHeight,
                                                        )}px`
                                                        : "0px",
                                            }}
                                            title={`Sales: ${formatMoney(
                                                item.sales,
                                                currency,
                                            )}`}
                                            aria-label={`Sales ${formatMoney(
                                                item.sales,
                                                currency,
                                            )}`}
                                        />

                                        <div
                                            className="w-full max-w-[16px] rounded-t-md bg-[var(--success)] transition-[height] duration-500"
                                            style={{
                                                height:
                                                    item.payments >
                                                    0
                                                        ? `${Math.max(
                                                            6,
                                                            paymentsHeight,
                                                        )}px`
                                                        : "0px",
                                            }}
                                            title={`Payments: ${formatMoney(
                                                item.payments,
                                                currency,
                                            )}`}
                                            aria-label={`Payments ${formatMoney(
                                                item.payments,
                                                currency,
                                            )}`}
                                        />
                                    </div>

                                    <div className="mt-3 text-center">
                                        <p className="truncate text-[10px] font-semibold text-[var(--text-secondary)]">
                                            {
                                                item.label
                                            }
                                        </p>

                                        <p className="mt-1 truncate text-[9px] text-[var(--text-muted)]">
                                            {formatCompactMoney(
                                                item.sales,
                                                currency,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-[11px]">
                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]"/>
                    Sales
                </span>

                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]"/>
                    Payments
                </span>
            </div>
        </div>
    );
}

/* ============================================================
   ATTENTION
============================================================ */

function AttentionList({
                           alerts,
                           canViewCustomers,
                           canViewInvoices,
                           canViewExpenses,
                       }: {
    alerts: DashboardData["alerts"];
    canViewCustomers: boolean;
    canViewInvoices: boolean;
    canViewExpenses: boolean;
}) {
    const visibleAlerts =
        alerts.filter((alert) => {
            if (
                alert.href.startsWith(
                    "/customers",
                )
            ) {
                return canViewCustomers;
            }

            if (
                alert.href.startsWith(
                    "/invoices",
                )
            ) {
                return canViewInvoices;
            }

            if (
                alert.href.startsWith(
                    "/expenses",
                )
            ) {
                return canViewExpenses;
            }

            return true;
        });

    if (visibleAlerts.length === 0) {
        return (
            <div className="flex min-h-[250px] flex-col items-center justify-center px-5 text-center">
                <div
                    className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--success)]">
                    <CheckCircle2 className="h-5 w-5"/>
                </div>

                <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                    Nothing needs attention
                </p>

                <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-muted)]">
                    There are no active dashboard alerts right now.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {visibleAlerts.map(
                (alert) => (
                    <Link
                        key={
                            alert.id
                        }
                        href={
                            alert.href
                        }
                        className="group block rounded-xl border border-[var(--border)] p-3.5 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={
                                    alert.priority ===
                                    "high"
                                        ? "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface-secondary)] text-[var(--warning)]"
                                        : "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                                }
                            >
                                <AlertTriangle className="h-3.5 w-3.5"/>
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                    {
                                        alert.title
                                    }
                                </p>

                                <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                                    {
                                        alert.description
                                    }
                                </p>
                            </div>

                            <ArrowRight
                                className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"/>
                        </div>
                    </Link>
                ),
            )}
        </div>
    );
}

/* ============================================================
   RECENT SALES
============================================================ */

function RecentSales({
                         data,
                         currency,
                     }: {
    data: DashboardData["recentSales"];
    currency: string;
}) {
    if (data.length === 0) {
        return (
            <div className="mizan-dashboard-section-body">
                <EmptyState
                    icon={
                        ShoppingCart
                    }
                    title="No sales yet"
                    description="Your latest sales will appear here once transactions are recorded."
                    actionHref="/sales/new"
                    actionLabel="Create sale"
                />
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
                <thead>
                <tr className="border-b border-[var(--border)]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Customer
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Total
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        Date
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"/>
                </tr>
                </thead>

                <tbody>
                {data.map(
                    (sale) => (
                        <tr
                            key={
                                sale.id
                            }
                            className="border-b border-[var(--border)] last:border-0"
                        >
                            <td className="px-5 py-4">
                                <p className="max-w-[220px] truncate text-xs font-semibold text-[var(--text-primary)]">
                                    {
                                        sale.customerName
                                    }
                                </p>
                            </td>

                            <td className="px-5 py-4 text-right text-xs font-semibold text-[var(--text-primary)]">
                                {formatMoney(
                                    sale.total,
                                    currency,
                                )}
                            </td>

                            <td className="px-5 py-4 text-right text-xs text-[var(--text-muted)]">
                                {formatDateTime(
                                    new Date(
                                        sale.createdAt,
                                    ),
                                )}
                            </td>

                            <td className="px-5 py-4 text-right">
                                <Link
                                    href={`/sales/${sale.id}`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                                    aria-label={`Open sale for ${sale.customerName}`}
                                >
                                    <ArrowRight className="h-3.5 w-3.5"/>
                                </Link>
                            </td>
                        </tr>
                    ),
                )}
                </tbody>
            </table>
        </div>
    );
}

/* ============================================================
   TOP DEBTORS
============================================================ */

function TopDebtors({
                        data,
                        currency,
                    }: {
    data: DashboardData["topDebtors"];
    currency: string;
}) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={
                    CircleDollarSign
                }
                title="No debtor data"
                description="Customer debt information will appear here when sale-to-payment allocation is available."
                actionHref="/customers"
                actionLabel="View customers"
            />
        );
    }

    return (
        <div className="space-y-3">
            {data.map(
                (
                    debtor,
                    index,
                ) => (
                    <Link
                        key={
                            debtor.customerId
                        }
                        href={`/customers/${debtor.customerId}`}
                        className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-3.5 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        <div
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-secondary)] text-xs font-bold text-[var(--text-secondary)]">
                            {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                                {
                                    debtor.customerName
                                }
                            </p>

                            {debtor.phone ? (
                                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                    {
                                        debtor.phone
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="text-right">
                            <p className="text-xs font-bold text-[var(--warning)]">
                                {formatMoney(
                                    debtor.outstanding,
                                    currency,
                                )}
                            </p>

                            <ArrowRight
                                className="ml-auto mt-1 h-3 w-3 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"/>
                        </div>
                    </Link>
                ),
            )}
        </div>
    );
}

/* ============================================================
   MONTH METRIC
============================================================ */

function MonthMetric({
                         label,
                         value,
                         positive,
                     }: {
    label: string;
    value: string;
    positive?: boolean;
}) {
    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
                {label}
            </p>

            <p
                className={
                    positive === false
                        ? "mt-2 break-words text-lg font-bold text-[var(--warning)]"
                        : "mt-2 break-words text-lg font-bold text-[var(--text-primary)]"
                }
            >
                {value}
            </p>
        </div>
    );
}

/* ============================================================
   PROFILE PROGRESS
============================================================ */

function ProfileProgress({
                             percentage,
                             completed,
                             total,
                         }: {
    percentage: number;
    completed: number;
    total: number;
}) {
    const safePercentage =
        Math.min(
            100,
            Math.max(
                0,
                Number(percentage) ||
                0,
            ),
        );

    return (
        <div>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                        Setup progress
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">
                        {safePercentage}%
                    </p>

                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {completed} of{" "}
                        {total} business fields completed
                    </p>
                </div>

                <ShieldCheck className="h-5 w-5 text-[var(--success)]"/>
            </div>

            <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-tertiary)]"
                aria-label={`Profile setup ${safePercentage}% complete`}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                    safePercentage
                }
            >
                <div
                    className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500"
                    style={{
                        width: `${safePercentage}%`,
                    }}
                />
            </div>
        </div>
    );
}

/* ============================================================
   BUSINESS INFO
============================================================ */

function BusinessInfo({
                          icon: Icon,
                          label,
                          value,
                      }: {
    icon: React.ComponentType<{
        className?: string;
    }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                <Icon className="h-4 w-4"/>
            </div>

            <div className="min-w-0">
                <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    {label}
                </p>

                <p className="mt-0.5 truncate text-xs font-semibold text-[var(--text-primary)]">
                    {value}
                </p>
            </div>
        </div>
    );
}

/* ============================================================
   ROLE DISTRIBUTION
============================================================ */

function RoleDistributionChart({
                                   data,
                                   total,
                               }: {
    data: DashboardData["roleChart"];
    total: number;
}) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="No team data"
                description="Organization membership data will appear here."
                actionHref="/settings/members"
                actionLabel="Manage team"
            />
        );
    }

    const maxValue =
        Math.max(
            ...data.map(
                (item) =>
                    Number(
                        item.count,
                    ) || 0,
            ),
            1,
        );

    const safeTotal =
        Number(total) || 0;

    return (
        <div className="space-y-5">
            <div>
                <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">
                    {numberFormatter.format(
                        safeTotal,
                    )}
                </p>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Total workspace members
                </p>
            </div>

            <div className="space-y-4">
                {data.map(
                    (item) => {
                        const count =
                            Number(
                                item.count,
                            ) || 0;

                        const percentage =
                            safeTotal > 0
                                ? Math.round(
                                    (count /
                                        safeTotal) *
                                    100,
                                )
                                : 0;

                        const width =
                            maxValue > 0
                                ? Math.max(
                                    8,
                                    Math.round(
                                        (count /
                                            maxValue) *
                                        100,
                                    ),
                                )
                                : 0;

                        return (
                            <div
                                key={
                                    item.role
                                }
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="min-w-0 truncate text-xs font-medium text-[var(--text-secondary)]">
                                        {
                                            item.role
                                        }
                                    </span>

                                    <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                                        {
                                            count
                                        }{" "}
                                        ·{" "}
                                        {
                                            percentage
                                        }
                                        %
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-tertiary)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500"
                                        style={{
                                            width: `${width}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
                         href,
                         icon: Icon,
                         title,
                         description,
                     }: {
    href: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="group flex min-h-[110px] items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
            <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                <Icon className="h-4 w-4"/>
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {title}
                </p>

                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                    {description}
                </p>
            </div>

            <ArrowRight
                className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"/>
        </Link>
    );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
                        icon: Icon,
                        title,
                        description,
                        actionHref,
                        actionLabel,
                    }: {
    icon: React.ComponentType<{
        className?: string;
    }>;
    title: string;
    description: string;
    actionHref?: string;
    actionLabel?: string;
}) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center">
            <div
                className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                <Icon className="h-5 w-5"/>
            </div>

            <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                {title}
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-muted)]">
                {description}
            </p>

            {actionHref &&
            actionLabel ? (
                <Link
                    href={
                        actionHref
                    }
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                    {
                        actionLabel
                    }

                    <ArrowRight className="h-3.5 w-3.5"/>
                </Link>
            ) : null}
        </div>
    );
}