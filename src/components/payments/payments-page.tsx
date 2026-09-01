"use client";

import Link from "next/link";
import {
    Banknote,
    Building2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    CreditCard,
    Landmark,
    Plus,
    Receipt,
    Search,
    Smartphone,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type PaymentMethod =
    | "cash"
    | "cheque"
    | "bank transfer"
    | "ccp transfer"
    | "baridimob"
    | "edahabia"
    | "card"
    | "other";

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
    data?: T;
    message?: string;
    error?:
        | string
        | {
        message?: string;
    };
};

const PAGE_SIZE = 20;

const PAYMENT_METHODS: Array<{
    value: PaymentMethod;
    label: string;
}> = [
    {
        value: "cash",
        label: "Cash",
    },
    {
        value: "cheque",
        label: "Cheque",
    },
    {
        value: "bank transfer",
        label: "Bank Transfer",
    },
    {
        value: "ccp transfer",
        label: "CCP Transfer",
    },
    {
        value: "baridimob",
        label: "BaridiMob",
    },
    {
        value: "edahabia",
        label: "Edahabia",
    },
    {
        value: "card",
        label: "Card",
    },
    {
        value: "other",
        label: "Other",
    },
];

export default function PaymentsPage() {
    const [payments, setPayments] =
        useState<Payment[]>([]);

    const [
        pagination,
        setPagination,
    ] = useState<
        PaymentsResponse["pagination"] | null
    >(null);

    const [search, setSearch] =
        useState("");

    const [
        debouncedSearch,
        setDebouncedSearch,
    ] = useState("");

    const [
        paymentMethod,
        setPaymentMethod,
    ] = useState<
        "all" | PaymentMethod
    >("all");

    const [page, setPage] =
        useState(1);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const requestIdRef =
        useRef(0);

    /*
     * Debounce search.
     */
    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                setDebouncedSearch(
                    search.trim(),
                );

                setPage(1);
            }, 300);

        return () =>
            window.clearTimeout(
                timeout,
            );
    }, [search]);

    /*
     * Reset pagination whenever
     * the payment method changes.
     */
    useEffect(() => {
        setPage(1);
    }, [paymentMethod]);

    /*
     * Main data loader.
     *
     * There is intentionally only one
     * effect responsible for GET /api/payments.
     */
    useEffect(() => {
        const controller =
            new AbortController();

        const currentRequestId =
            ++requestIdRef.current;

        async function loadPayments() {
            setLoading(true);
            setError(null);

            try {
                const params =
                    new URLSearchParams();

                params.set(
                    "page",
                    String(page),
                );

                params.set(
                    "limit",
                    String(PAGE_SIZE),
                );

                if (
                    debouncedSearch
                ) {
                    params.set(
                        "search",
                        debouncedSearch,
                    );
                }

                if (
                    paymentMethod !==
                    "all"
                ) {
                    params.set(
                        "paymentMethod",
                        paymentMethod,
                    );
                }

                const url =
                    `/api/payments?${params.toString()}`;

                const response =
                    await fetch(
                        url,
                        {
                            method: "GET",
                            credentials:
                                "include",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache:
                                "no-store",
                            signal:
                            controller.signal,
                        },
                    );

                const result =
                    (await response.json()) as ApiResponse<PaymentsResponse>;

                /*
                 * Ignore stale responses.
                 */
                if (
                    currentRequestId !==
                    requestIdRef.current
                ) {
                    return;
                }

                if (
                    !response.ok
                ) {
                    throw new Error(
                        getApiErrorMessage(
                            result,
                            "Failed to load payments.",
                        ),
                    );
                }

                if (
                    !result.data
                ) {
                    throw new Error(
                        "Invalid payments response.",
                    );
                }

                setPayments(
                    result.data.items,
                );

                setPagination(
                    result.data.pagination,
                );
            } catch (err) {
                if (
                    controller.signal
                        .aborted
                ) {
                    return;
                }

                console.error(
                    "[Payments]",
                    err,
                );

                setError(
                    err instanceof
                    Error
                        ? err.message
                        : "Failed to load payments.",
                );
            } finally {
                if (
                    !controller.signal
                        .aborted &&
                    currentRequestId ===
                    requestIdRef.current
                ) {
                    setLoading(false);
                }
            }
        }

        void loadPayments();

        return () => {
            controller.abort();
        };
    }, [
        page,
        debouncedSearch,
        paymentMethod,
    ]);

    const pageTotal =
        useMemo(() => {
            return payments.reduce(
                (
                    total,
                    payment,
                ) =>
                    total +
                    Number(
                        payment.amount,
                    ),
                0,
            );
        }, [payments]);

    function clearFilters() {
        setSearch("");
        setDebouncedSearch("");
        setPaymentMethod(
            "all",
        );
        setPage(1);
    }

    function selectPaymentMethod(
        method:
            | "all"
            | PaymentMethod,
    ) {
        setPaymentMethod(
            method,
        );
        setPage(1);
    }

    return (
        <div className="mizan-page-enter space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                        Payments
                    </p>

                    <h1 className="mizan-page-title mt-1">
                        Payment management
                    </h1>

                    <p className="mizan-page-description">
                        Review collected payments
                        and track customer
                        transactions.
                    </p>
                </div>

                <Link
                    href="/sales"
                    className="mizan-primary-action shrink-0"
                >
                    <Plus className="h-4 w-4" />

                    <span className="ml-2">
                        Record payment
                    </span>
                </Link>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
                <PaymentMetric
                    icon={
                        CircleDollarSign
                    }
                    label="Payment records"
                    value={
                        pagination
                            ? String(
                                pagination.total,
                            )
                            : "—"
                    }
                />

                <PaymentMetric
                    icon={Banknote}
                    label="Current page total"
                    value={formatMoney(
                        pageTotal,
                    )}
                />

                <PaymentMetric
                    icon={Receipt}
                    label="Displayed"
                    value={String(
                        payments.length,
                    )}
                />
            </section>

            <section className="mizan-card p-3 sm:p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

                            <input
                                value={
                                    search
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Search payments..."
                                aria-label="Search payments"
                                className="h-10 pl-9"
                            />
                        </div>

                        <div className="text-xs text-[var(--text-muted)]">
                            {pagination
                                ? `${pagination.total} payment${
                                    pagination.total ===
                                    1
                                        ? ""
                                        : "s"
                                }`
                                : "Loading..."}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <PaymentFilterButton
                            active={
                                paymentMethod ===
                                "all"
                            }
                            onClick={() =>
                                selectPaymentMethod(
                                    "all",
                                )
                            }
                        >
                            All
                        </PaymentFilterButton>

                        {PAYMENT_METHODS.map(
                            (
                                method,
                            ) => (
                                <PaymentFilterButton
                                    key={
                                        method.value
                                    }
                                    active={
                                        paymentMethod ===
                                        method.value
                                    }
                                    onClick={() =>
                                        selectPaymentMethod(
                                            method.value,
                                        )
                                    }
                                >
                                    {
                                        method.label
                                    }
                                </PaymentFilterButton>
                            ),
                        )}
                    </div>

                    {(search.trim() ||
                        paymentMethod !==
                        "all") && (
                        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-3">
                            <p className="text-xs text-[var(--text-muted)]">
                                {paymentMethod !==
                                "all"
                                    ? `Filtered by ${formatPaymentMethod(
                                        paymentMethod,
                                    )}`
                                    : "Search filter active"}
                            </p>

                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="text-xs font-semibold text-[var(--primary)] hover:underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {error ? (
                <section
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setPage(
                                    page,
                                );
                            }}
                            className="font-semibold underline underline-offset-2"
                        >
                            Retry
                        </button>
                    </div>
                </section>
            ) : null}

            <section className="mizan-dashboard-section overflow-hidden">
                {loading ? (
                    <PaymentsLoading />
                ) : payments.length ===
                0 ? (
                    <PaymentsEmpty
                        hasSearch={
                            Boolean(
                                search.trim(),
                            ) ||
                            paymentMethod !==
                            "all"
                        }
                        onClear={
                            clearFilters
                        }
                    />
                ) : (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="mizan-table min-w-[950px]">
                                <thead>
                                <tr>
                                    <th>
                                        Payment
                                    </th>

                                    <th>
                                        Customer
                                    </th>

                                    <th>
                                        Sale
                                    </th>

                                    <th>
                                        Method
                                    </th>

                                    <th>
                                        Amount
                                    </th>

                                    <th>
                                        Date
                                    </th>

                                    <th className="text-right">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {payments.map(
                                    (
                                        payment,
                                    ) => (
                                        <tr
                                            key={
                                                payment.id
                                            }
                                        >
                                            <td>
                                                <Link
                                                    href={`/payments/${payment.id}`}
                                                    className="group flex min-w-0 items-center gap-3"
                                                >
                                                    <PaymentAvatar
                                                        method={
                                                            payment.paymentMethod
                                                        }
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                                                            {formatMoney(
                                                                payment.amount,
                                                            )}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                            {
                                                                payment.id
                                                            }
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>

                                            <td>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-[var(--text-primary)]">
                                                        {payment.customerName ??
                                                            "No customer"}
                                                    </p>

                                                    {payment.customerPhone ? (
                                                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                                            {
                                                                payment.customerPhone
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </td>

                                            <td>
                                                <Link
                                                    href={`/sales/${payment.saleId}`}
                                                    className="font-semibold text-[var(--primary)] hover:underline"
                                                >
                                                    {
                                                        payment.saleNumber
                                                    }
                                                </Link>
                                            </td>

                                            <td>
                                                <PaymentMethodBadge
                                                    method={
                                                        payment.paymentMethod
                                                    }
                                                />
                                            </td>

                                            <td className="font-bold">
                                                {formatMoney(
                                                    payment.amount,
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    payment.createdAt,
                                                )}
                                            </td>

                                            <td className="text-right">
                                                <Link
                                                    href={`/payments/${payment.id}`}
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
                                (
                                    payment,
                                ) => (
                                    <div
                                        key={
                                            payment.id
                                        }
                                        className="p-4 transition hover:bg-[var(--surface-secondary)]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Link
                                                href={`/payments/${payment.id}`}
                                                className="shrink-0"
                                                aria-label={`View payment ${payment.id}`}
                                            >
                                                <PaymentAvatar
                                                    method={
                                                        payment.paymentMethod
                                                    }
                                                />
                                            </Link>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/payments/${payment.id}`}
                                                            className="block truncate text-sm font-bold text-[var(--text-primary)] hover:text-[var(--primary)]"
                                                        >
                                                            {formatMoney(
                                                                payment.amount,
                                                            )}
                                                        </Link>

                                                        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                                            {payment.customerName ??
                                                                "No customer"}
                                                        </p>
                                                    </div>

                                                    <Link
                                                        href={`/payments/${payment.id}`}
                                                        className="shrink-0 text-xs font-semibold text-[var(--primary)]"
                                                    >
                                                        View
                                                    </Link>
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                    <PaymentMethodBadge
                                                        method={
                                                            payment.paymentMethod
                                                        }
                                                    />

                                                    <Link
                                                        href={`/sales/${payment.saleId}`}
                                                        className="text-xs font-semibold text-[var(--primary)] hover:underline"
                                                    >
                                                        {
                                                            payment.saleNumber
                                                        }
                                                    </Link>
                                                </div>

                                                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                                                    {formatDateTime(
                                                        payment.createdAt,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>

                        <Pagination
                            pagination={
                                pagination
                            }
                            onPageChange={(
                                nextPage,
                            ) =>
                                setPage(
                                    nextPage,
                                )
                            }
                        />
                    </>
                )}
            </section>
        </div>
    );
}

function PaymentMetric({
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
        <section className="mizan-card p-4">
            <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                    <Icon className="h-4 w-4" />
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

function PaymentFilterButton({
                                 active,
                                 onClick,
                                 children,
                             }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={
                active
                    ? "rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white"
                    : "rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)]"
            }
        >
            {children}
        </button>
    );
}

function PaymentMethodBadge({
                                method,
                            }: {
    method: PaymentMethod;
}) {
    const Icon =
        getPaymentMethodIcon(
            method,
        );

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mizan-blue-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
            <Icon className="h-3.5 w-3.5" />

            {formatPaymentMethod(
                method,
            )}
        </span>
    );
}

function PaymentAvatar({
                           method,
                       }: {
    method: PaymentMethod;
}) {
    const Icon =
        getPaymentMethodIcon(
            method,
        );

    return (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
            <Icon className="h-4 w-4" />
        </div>
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

function PaymentsLoading() {
    return (
        <div className="space-y-1 p-3">
            {Array.from({
                length: 6,
            }).map((_, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl p-3"
                >
                    <div className="mizan-skeleton h-10 w-10 shrink-0 rounded-xl" />

                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="mizan-skeleton h-3 w-40 rounded" />
                        <div className="mizan-skeleton h-2.5 w-28 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function PaymentsEmpty({
                           hasSearch,
                           onClear,
                       }: {
    hasSearch: boolean;
    onClear: () => void;
}) {
    return (
        <div className="mizan-empty min-h-[360px]">
            <div className="mizan-empty-icon">
                <CircleDollarSign className="h-5 w-5" />
            </div>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {hasSearch
                    ? "No payments found"
                    : "No payments yet"}
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                {hasSearch
                    ? "Try a different search or payment method."
                    : "Payments will appear here after you collect money from customers."}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {hasSearch ? (
                    <button
                        type="button"
                        onClick={onClear}
                        className="mizan-ghost-action"
                    >
                        Clear filters
                    </button>
                ) : null}

                <Link
                    href="/sales"
                    className="mizan-primary-action"
                >
                    <Receipt className="h-4 w-4" />

                    <span className="ml-2">
                        Go to sales
                    </span>
                </Link>
            </div>
        </div>
    );
}

function Pagination({
                        pagination,
                        onPageChange,
                    }: {
    pagination:
        | PaymentsResponse["pagination"]
        | null;
    onPageChange: (
        page: number,
    ) => void;
}) {
    if (
        !pagination ||
        pagination.totalPages <= 1
    ) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t border-[var(--border-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--text-muted)]">
                Page {pagination.page} of{" "}
                {
                    pagination.totalPages
                }
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={
                        !pagination.hasPreviousPage
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.page -
                            1,
                        )
                    }
                    className="mizan-ghost-action px-3 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                    type="button"
                    disabled={
                        !pagination.hasNextPage
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.page +
                            1,
                        )
                    }
                    className="mizan-ghost-action px-3 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
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
    value: number | string,
) {
    return new Intl.NumberFormat(
        "en-DZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    ).format(Number(value));
}

function formatDate(
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
            day: "numeric",
            month: "short",
            year: "numeric",
        },
    ).format(date);
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