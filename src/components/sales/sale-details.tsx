"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    Building2,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    CircleX,
    CreditCard,
    Edit3,
    Landmark,
    Plus,
    Receipt,
    Smartphone,
    User,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {useRouter} from "next/navigation";

import {useConfirm} from "@/src/components/dashboard/confirm-provider";

type SaleStatus =
    | "draft"
    | "confirmed"
    | "canceled";

type PaymentMethod =
    | "cash"
    | "cheque"
    | "bank transfer"
    | "ccp transfer"
    | "baridimob"
    | "edahabia"
    | "card"
    | "other";

type SaleItem = {
    id: string;
    productId: string;
    productName: string | null;
    sku: string | null;
    quantity: number;
    unitPrice: string;
    subtotal: string;
};

type Sale = {
    id: string;
    organizationId: string;
    customerId: string;
    customerName: string | null;
    saleNumber: string;
    status: SaleStatus;
    totalAmount: string;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    items: SaleItem[];
};

type Payment = {
    id: string;
    amount: string;
    paymentMethod: PaymentMethod;
    note: string | null;
    createdAt: string;
    saleId: string;
    saleNumber: string;
    customerId: string;
    customerName: string | null;
    customerPhone: string | null;
};

type PaymentsResponse = {
    items: Payment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

type ApiResponse<T = unknown> = {
    success?: boolean;
    data?: T;
    message?: string;
    error?:
        | string
        | {
        message?: string;
    };
};

type PaymentStatus =
    | "unpaid"
    | "partially_paid"
    | "paid";

export default function SaleDetails({
                                        id,
                                    }: {
    id: string;
}) {
    const router = useRouter();
    const confirm = useConfirm();

    const [sale, setSale] =
        useState<Sale | null>(null);

    const [payments, setPayments] =
        useState<Payment[]>([]);

    const [paymentsLoading, setPaymentsLoading] =
        useState(true);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [working, setWorking] =
        useState(false);

    const loadSale =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await fetch(
                        `/api/sales/${encodeURIComponent(id)}`,
                        {
                            method: "GET",
                            credentials: "include",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache: "no-store",
                        },
                    );

                const raw =
                    await response.text();

                let result:
                    ApiResponse<Sale> = {};

                if (raw.trim()) {
                    try {
                        result =
                            JSON.parse(raw);
                    } catch {
                        throw new Error(
                            "The server returned an invalid response.",
                        );
                    }
                }

                if (response.status === 404) {
                    router.replace("/sales");
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        getApiErrorMessage(
                            result,
                            "Failed to load sale.",
                        ),
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Sale data was not returned by the server.",
                    );
                }

                setSale(result.data);
            } catch (err) {
                console.error(
                    "[SaleDetails]",
                    err,
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load sale.",
                );
            } finally {
                setLoading(false);
            }
        }, [id, router]);

    const loadPayments =
        useCallback(async () => {
            setPaymentsLoading(true);

            try {
                const params =
                    new URLSearchParams();

                params.set("saleId", id);
                params.set("page", "1");
                params.set("limit", "100");

                const response =
                    await fetch(
                        `/api/payments?${params.toString()}`,
                        {
                            method: "GET",
                            credentials: "include",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache: "no-store",
                        },
                    );

                const result =
                    (await response.json()) as ApiResponse<PaymentsResponse>;

                if (!response.ok) {
                    throw new Error(
                        getApiErrorMessage(
                            result,
                            "Failed to load payments.",
                        ),
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Invalid payments response.",
                    );
                }

                setPayments(
                    result.data.items,
                );
            } catch (err) {
                console.error(
                    "[SaleDetails:Payments]",
                    err,
                );

                setPayments([]);
            } finally {
                setPaymentsLoading(false);
            }
        }, [id]);

    const loadData =
        useCallback(async () => {
            await Promise.all([
                loadSale(),
                loadPayments(),
            ]);
        }, [
            loadSale,
            loadPayments,
        ]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    async function confirmSale() {
        if (
            !sale ||
            sale.status !== "draft" ||
            working
        ) {
            return;
        }

        const confirmed =
            await confirm({
                title: "Confirm this sale?",
                description:
                    "The sale will be confirmed and the quantities will be deducted from product stock.",
                confirmLabel:
                    "Confirm sale",
                cancelLabel:
                    "Keep as draft",
            });

        if (!confirmed) {
            return;
        }

        await performAction(
            `/api/sales/${encodeURIComponent(
                sale.id,
            )}/confirm`,
            "Failed to confirm sale.",
        );
    }

    async function cancelSale() {
        if (
            !sale ||
            sale.status === "canceled" ||
            working
        ) {
            return;
        }

        const confirmed =
            await confirm({
                variant: "danger",
                destructive: true,
                title: "Cancel this sale?",
                description:
                    sale.status ===
                    "confirmed"
                        ? "The sale will be canceled and its quantities will be returned to stock."
                        : "The sale will be canceled and kept in your records.",
                confirmLabel:
                    "Cancel sale",
                cancelLabel:
                    "Keep sale",
            });

        if (!confirmed) {
            return;
        }

        await performAction(
            `/api/sales/${encodeURIComponent(
                sale.id,
            )}/cancel`,
            "Failed to cancel sale.",
        );
    }

    async function performAction(
        endpoint: string,
        fallback: string,
    ) {
        setWorking(true);
        setError(null);

        try {
            const response =
                await fetch(
                    endpoint,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            Accept:
                                "application/json",
                        },
                    },
                );

            const result =
                (await response.json()) as ApiResponse;

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        fallback,
                    ),
                );
            }

            await loadData();
            router.refresh();
        } catch (err) {
            console.error(
                "[SaleDetails:Action]",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : fallback,
            );
        } finally {
            setWorking(false);
        }
    }

    const paidTotal = useMemo(() => {
        return payments.reduce(
            (total, payment) => {
                const amount =
                    Number(payment.amount);

                return total +
                    (Number.isFinite(amount)
                        ? amount
                        : 0);
            },
            0,
        );
    }, [payments]);

    const saleTotal = Number(
        sale?.totalAmount ?? 0,
    );

    const outstanding = Math.max(
        saleTotal - paidTotal,
        0,
    );

    const paymentStatus =
        getPaymentStatus(
            saleTotal,
            paidTotal,
        );

    /*
     * Payment can only be added when:
     *
     * 1. Sale is confirmed
     * 2. There is still money outstanding
     *
     * This automatically covers:
     * - Unpaid
     * - Partially paid
     *
     * And prevents payment links for:
     * - Draft
     * - Canceled
     * - Fully paid
     */
    const canAddPayment =
        sale?.status === "confirmed" &&
        outstanding > 0;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="mizan-skeleton h-8 w-40 rounded"/>

                <div className="mizan-card p-6">
                    <div className="space-y-4">
                        <div className="mizan-skeleton h-5 w-52 rounded"/>
                        <div className="mizan-skeleton h-4 w-80 rounded"/>
                        <div className="mizan-skeleton h-4 w-64 rounded"/>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="mizan-card p-6">
                        <div className="space-y-4">
                            <div className="mizan-skeleton h-5 w-40 rounded"/>
                            <div className="mizan-skeleton h-20 w-full rounded"/>
                            <div className="mizan-skeleton h-20 w-full rounded"/>
                        </div>
                    </div>

                    <div className="mizan-card h-fit p-6">
                        <div className="space-y-4">
                            <div className="mizan-skeleton h-3 w-24 rounded"/>
                            <div className="mizan-skeleton h-10 w-40 rounded"/>
                            <div className="mizan-skeleton h-8 w-full rounded"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !sale) {
        return (
            <div className="mizan-empty">
                <p className="text-sm font-semibold text-[var(--danger)]">
                    {error ??
                        "Sale not found."}
                </p>

                <Link
                    href="/sales"
                    className="mizan-primary-action mt-5"
                >
                    <ArrowLeft className="h-4 w-4"/>

                    <span className="ml-2">
                        Back to sales
                    </span>
                </Link>
            </div>
        );
    }

    return (
        <div className="mizan-page-enter space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href="/sales"
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>
                        Sales
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <div className="min-w-0">
                            <h1 className="mizan-page-title">
                                {sale.saleNumber}
                            </h1>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Sale ID: {sale.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {sale.status === "draft" ? (
                        <Link
                            href={`/sales/${encodeURIComponent(
                                sale.id,
                            )}/edit`}
                            className="mizan-ghost-action"
                        >
                            <Edit3 className="h-4 w-4"/>

                            <span className="ml-2">
                                Edit
                            </span>
                        </Link>
                    ) : null}

                    {sale.status === "draft" ? (
                        <button
                            type="button"
                            disabled={working}
                            onClick={confirmSale}
                            className="mizan-primary-action disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4"/>

                            <span className="ml-2">
                                {working
                                    ? "Processing..."
                                    : "Confirm"}
                            </span>
                        </button>
                    ) : null}

                    {canAddPayment ? (
                        <Link
                            href={`/payments/new?saleId=${encodeURIComponent(
                                sale.id,
                            )}`}
                            className="mizan-primary-action"
                        >
                            <Plus className="h-4 w-4"/>

                            <span className="ml-2">
                                Add payment
                            </span>
                        </Link>
                    ) : null}

                    {sale.status !== "canceled" ? (
                        <button
                            type="button"
                            disabled={working}
                            onClick={cancelSale}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 text-xs font-semibold text-[var(--danger)] transition hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CircleX className="h-4 w-4"/>

                            <span className="ml-2">
                                Cancel
                            </span>
                        </button>
                    ) : null}
                </div>
            </section>

            {error ? (
                <div
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                >
                    {error}
                </div>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-3">
                <FinancialCard
                    label="Sale total"
                    value={formatMoney(saleTotal)}
                    icon={Receipt}
                />

                <FinancialCard
                    label="Paid"
                    value={formatMoney(paidTotal)}
                    icon={CircleDollarSign}
                />

                <FinancialCard
                    label="Outstanding"
                    value={formatMoney(outstanding)}
                    icon={
                        outstanding > 0
                            ? CircleDollarSign
                            : CheckCircle2
                    }
                />
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-4">
                    <section className="mizan-dashboard-section">
                        <div className="mizan-dashboard-section-header">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                    Sale information
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <SaleStatusBadge
                                    status={sale.status}
                                />

                                {sale.status !==
                                "draft" ? (
                                    <PaymentStatusBadge
                                        status={
                                            paymentStatus
                                        }
                                    />
                                ) : null}
                            </div>
                        </div>

                        <div className="mizan-dashboard-section-body grid gap-5 sm:grid-cols-2">
                            <InfoItem
                                icon={User}
                                label="Customer"
                                value={
                                    sale.customerName ||
                                    "—"
                                }
                            />

                            <InfoItem
                                icon={CalendarDays}
                                label="Created"
                                value={formatDateTime(
                                    sale.createdAt,
                                )}
                            />

                            <InfoItem
                                icon={CalendarDays}
                                label="Last updated"
                                value={formatDateTime(
                                    sale.updatedAt,
                                )}
                            />

                            <InfoItem
                                icon={Receipt}
                                label="Total"
                                value={formatMoney(
                                    sale.totalAmount,
                                )}
                            />
                        </div>
                    </section>

                    <section className="mizan-dashboard-section">
                        <div className="mizan-dashboard-section-header">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                    Items
                                </h2>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Products included in
                                    this sale.
                                </p>
                            </div>
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[650px]">
                                <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit price</th>
                                    <th>Subtotal</th>
                                </tr>
                                </thead>

                                <tbody>
                                {sale.items.map(
                                    (item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <p className="font-semibold text-[var(--text-primary)]">
                                                    {item.productName ||
                                                        "Unknown product"}
                                                </p>

                                                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                                    {item.sku ||
                                                        "No SKU"}
                                                </p>
                                            </td>

                                            <td>
                                                {item.quantity}
                                            </td>

                                            <td>
                                                {formatMoney(
                                                    item.unitPrice,
                                                )}
                                            </td>

                                            <td className="font-semibold">
                                                {formatMoney(
                                                    item.subtotal,
                                                )}
                                            </td>
                                        </tr>
                                    ),
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="divide-y divide-[var(--border-soft)] md:hidden">
                            {sale.items.map(
                                (item) => (
                                    <div
                                        key={item.id}
                                        className="p-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-[var(--text-primary)]">
                                                    {item.productName ||
                                                        "Unknown product"}
                                                </p>

                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    {item.sku ||
                                                        "No SKU"}
                                                </p>
                                            </div>

                                            <p className="shrink-0 font-bold text-[var(--text-primary)]">
                                                {formatMoney(
                                                    item.subtotal,
                                                )}
                                            </p>
                                        </div>

                                        <div className="mt-3 flex gap-4 text-xs text-[var(--text-muted)]">
                                            <span>
                                                Qty:{" "}
                                                {item.quantity}
                                            </span>

                                            <span>
                                                Unit:{" "}
                                                {formatMoney(
                                                    item.unitPrice,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    <section className="mizan-dashboard-section">
                        <div className="mizan-dashboard-section-header">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                    Payment history
                                </h2>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Payments recorded
                                    against this sale.
                                </p>
                            </div>

                            {canAddPayment ? (
                                <Link
                                    href={`/payments/new?saleId=${encodeURIComponent(
                                        sale.id,
                                    )}`}
                                    className="mizan-ghost-action"
                                >
                                    <Plus className="h-4 w-4"/>

                                    <span className="ml-2">
                                        Add payment
                                    </span>
                                </Link>
                            ) : null}
                        </div>

                        {paymentsLoading ? (
                            <PaymentHistoryLoading/>
                        ) : payments.length === 0 ? (
                            <div className="mizan-empty min-h-[260px]">
                                <div className="mizan-empty-icon">
                                    <CircleDollarSign className="h-5 w-5"/>
                                </div>

                                <h3 className="mt-3 text-base font-bold text-[var(--text-primary)]">
                                    No payments yet
                                </h3>

                                <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
                                    No payment has been
                                    recorded for this
                                    sale.
                                </p>

                                {canAddPayment ? (
                                    <Link
                                        href={`/payments/new?saleId=${encodeURIComponent(
                                            sale.id,
                                        )}`}
                                        className="mizan-primary-action mt-4"
                                    >
                                        <Plus className="h-4 w-4"/>

                                        <span className="ml-2">
                                            Record payment
                                        </span>
                                    </Link>
                                ) : null}
                            </div>
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="mizan-table min-w-[700px]">
                                        <thead>
                                        <tr>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Date</th>
                                            <th>Note</th>
                                            <th className="text-right">
                                                Action
                                            </th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                        {payments.map(
                                            (payment) => (
                                                <tr
                                                    key={
                                                        payment.id
                                                    }
                                                >
                                                    <td className="font-bold">
                                                        {formatMoney(
                                                            payment.amount,
                                                        )}
                                                    </td>

                                                    <td>
                                                        <PaymentMethodBadge
                                                            method={
                                                                payment.paymentMethod
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        {formatDateTime(
                                                            payment.createdAt,
                                                        )}
                                                    </td>

                                                    <td>
                                                        {payment.note ||
                                                            "—"}
                                                    </td>

                                                    <td className="text-right">
                                                        <Link
                                                            href={`/payments/${encodeURIComponent(
                                                                payment.id,
                                                            )}`}
                                                            className="text-xs font-semibold text-[var(--primary)] hover:underline"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="divide-y divide-[var(--border-soft)] md:hidden">
                                    {payments.map(
                                        (payment) => (
                                            <Link
                                                key={
                                                    payment.id
                                                }
                                                href={`/payments/${encodeURIComponent(
                                                    payment.id,
                                                )}`}
                                                className="block p-4 transition hover:bg-[var(--surface-secondary)]"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-[var(--text-primary)]">
                                                            {formatMoney(
                                                                payment.amount,
                                                            )}
                                                        </p>

                                                        <div className="mt-2">
                                                            <PaymentMethodBadge
                                                                method={
                                                                    payment.paymentMethod
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <span className="text-xs font-semibold text-[var(--primary)]">
                                                        View
                                                    </span>
                                                </div>

                                                <div
                                                    className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
                                                    <span>
                                                        {formatDateTime(
                                                            payment.createdAt,
                                                        )}
                                                    </span>

                                                    <span className="truncate">
                                                        {payment.note ||
                                                            "No note"}
                                                    </span>
                                                </div>
                                            </Link>
                                        ),
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <aside className="mizan-card h-fit p-5 sm:p-6 lg:sticky lg:top-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        Payment summary
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)]">
                        {formatMoney(outstanding)}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Outstanding balance
                    </p>

                    <div className="mt-5 space-y-3 border-t border-[var(--border-soft)] pt-4">
                        <SummaryRow
                            label="Sale total"
                            value={formatMoney(
                                saleTotal,
                            )}
                        />

                        <SummaryRow
                            label="Paid"
                            value={formatMoney(
                                paidTotal,
                            )}
                        />

                        <div className="border-t border-[var(--border-soft)] pt-3">
                            <SummaryRow
                                label="Outstanding"
                                value={formatMoney(
                                    outstanding,
                                )}
                                strong
                            />
                        </div>
                    </div>

                    <PaymentStatusPanel
                        status={paymentStatus}
                        outstanding={outstanding}
                    />

                    {canAddPayment ? (
                        <Link
                            href={`/payments/new?saleId=${encodeURIComponent(
                                sale.id,
                            )}`}
                            className="mizan-primary-action mt-6 w-full justify-center"
                        >
                            <Plus className="h-4 w-4"/>

                            <span className="ml-2">
                                Add payment
                            </span>
                        </Link>
                    ) : null}

                    {sale.status ===
                    "confirmed" &&
                    outstanding === 0 ? (
                        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>

                                <div>
                                    <p className="text-xs font-bold text-emerald-700">
                                        Fully paid
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-emerald-700/80">
                                        This sale has no
                                        outstanding
                                        balance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </aside>
            </div>
        </div>
    );
}

function FinancialCard({
                           label,
                           value,
                           icon: Icon,
                       }: {
    label: string;
    value: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
}) {
    return (
        <section className="mizan-card p-4">
            <div className="flex items-center gap-3">
                <div
                    className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                    <Icon className="h-4 w-4"/>
                </div>

                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        {label}
                    </p>

                    <p className="mt-1 truncate text-lg font-black text-[var(--text-primary)]">
                        {value}
                    </p>
                </div>
            </div>
        </section>
    );
}

function PaymentHistoryLoading() {
    return (
        <div className="space-y-1 p-3">
            {Array.from({
                length: 3,
            }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl p-3"
                >
                    <div className="mizan-skeleton h-10 w-10 shrink-0 rounded-xl"/>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="mizan-skeleton h-3 w-32 rounded"/>
                        <div className="mizan-skeleton h-2.5 w-24 rounded"/>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PaymentStatusPanel({
                                status,
                                outstanding,
                            }: {
    status: PaymentStatus;
    outstanding: number;
}) {
    if (status === "paid") {
        return (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>

                    <div>
                        <p className="text-xs font-bold text-emerald-700">
                            Fully paid
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-emerald-700/80">
                            The customer has paid
                            the full sale amount.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "partially_paid") {
        return (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-700">
                    Partially paid
                </p>

                <p className="mt-1 text-[11px] leading-5 text-amber-700/80">
                    {formatMoney(outstanding)}{" "}
                    remains to be collected.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-secondary)] p-3">
            <p className="text-xs font-bold text-[var(--text-primary)]">
                Unpaid
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                No payment has been recorded for
                this sale.
            </p>
        </div>
    );
}

function PaymentStatusBadge({
                                status,
                            }: {
    status: PaymentStatus;
}) {
    if (status === "paid") {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5"/>
                Paid
            </span>
        );
    }

    if (status === "partially_paid") {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Partially paid
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            Unpaid
        </span>
    );
}

function getPaymentStatus(
    total: number,
    paid: number,
): PaymentStatus {
    if (
        total <= 0 ||
        paid <= 0
    ) {
        return "unpaid";
    }

    if (paid >= total) {
        return "paid";
    }

    return "partially_paid";
}

function PaymentMethodBadge({
                                method,
                            }: {
    method: PaymentMethod;
}) {
    const Icon =
        getPaymentMethodIcon(method);

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mizan-blue-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
            <Icon className="h-3.5 w-3.5"/>

            {formatPaymentMethod(method)}
        </span>
    );
}

function getPaymentMethodIcon(
    method: PaymentMethod,
) {
    switch (method) {
        case "cash":
            return Banknote;

        case "cheque":
            return Receipt;

        case "bank transfer":
            return Building2;

        case "ccp transfer":
            return Landmark;

        case "baridimob":
            return Smartphone;

        case "edahabia":
            return CreditCard;

        case "card":
            return CreditCard;

        default:
            return CircleDollarSign;
    }
}

function formatPaymentMethod(
    method: PaymentMethod,
) {
    switch (method) {
        case "cash":
            return "Cash";

        case "cheque":
            return "Cheque";

        case "bank transfer":
            return "Bank Transfer";

        case "ccp transfer":
            return "CCP Transfer";

        case "baridimob":
            return "BaridiMob";

        case "edahabia":
            return "Edahabia";

        case "card":
            return "Card";

        default:
            return "Other";
    }
}

function SaleStatusBadge({
                             status,
                         }: {
    status: SaleStatus;
}) {
    if (status === "confirmed") {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5"/>
                Confirmed
            </span>
        );
    }

    if (status === "canceled") {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--danger)]">
                <CircleX className="h-3.5 w-3.5"/>
                Canceled
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Draft
        </span>
    );
}

function InfoItem({
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
        <div className="flex items-start gap-3">
            <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                <Icon className="h-4 w-4"/>
            </div>

            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {label}
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">
                    {value}
                </p>
            </div>
        </div>
    );
}

function SummaryRow({
                        label,
                        value,
                        strong = false,
                    }: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    strong
                        ? "text-sm font-semibold text-[var(--text-primary)]"
                        : "text-xs text-[var(--text-muted)]"
                }
            >
                {label}
            </span>

            <span
                className={
                    strong
                        ? "text-sm font-black text-[var(--text-primary)]"
                        : "text-sm font-semibold text-[var(--text-primary)]"
                }
            >
                {value}
            </span>
        </div>
    );
}

function getApiErrorMessage(
    result: ApiResponse,
    fallback: string,
) {
    if (
        typeof result.error ===
        "string"
    ) {
        return result.error;
    }

    if (
        result.error &&
        typeof result.error ===
        "object" &&
        typeof result.error.message ===
        "string"
    ) {
        return result.error.message;
    }

    if (
        typeof result.message ===
        "string"
    ) {
        return result.message;
    }

    return fallback;
}

function formatMoney(
    value: string | number,
) {
    const numericValue =
        Number(value);

    if (
        !Number.isFinite(
            numericValue,
        )
    ) {
        return "0.00";
    }

    return new Intl.NumberFormat(
        "en-DZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    ).format(numericValue);
}

function formatDateTime(
    value: string,
) {
    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-DZ",
        {
            dateStyle: "medium",
            timeStyle: "short",
        },
    ).format(date);
}