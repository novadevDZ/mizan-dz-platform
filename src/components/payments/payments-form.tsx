"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    Building2,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    Landmark,
    Loader2,
    Receipt,
    Save,
    Smartphone,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";
import {useRouter} from "next/navigation";

type PaymentMethod =
    | "cash"
    | "cheque"
    | "bank transfer"
    | "ccp transfer"
    | "baridimob"
    | "edahabia"
    | "card"
    | "other";

type Sale = {
    id: string;
    saleNumber: string;
    customerId: string;
    customerName: string | null;
    status:
        | "draft"
        | "confirmed"
        | "canceled";
    totalAmount: string;
    items?: Array<unknown>;
    paidTotal?: number;
    outstanding?: number;
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

export default function PaymentForm({
                                        saleId,
                                    }: {
    saleId?: string;
}) {
    const router = useRouter();

    const [sale, setSale] =
        useState<Sale | null>(null);

    const [amount, setAmount] =
        useState("");

    const [
        paymentMethod,
        setPaymentMethod,
    ] = useState<PaymentMethod | "">(
        "cash",
    );

    const [note, setNote] =
        useState("");

    const [loadingSale, setLoadingSale] =
        useState(Boolean(saleId));

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        if (!saleId) {
            setLoadingSale(false);
            return;
        }

        let cancelled = false;

        async function loadSale() {
            setLoadingSale(true);
            setError(null);

            try {
                const response =
                    await fetch(
                        `/api/sales/${saleId}`,
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
                        },
                    );

                const raw =
                    await response.text();

                let result:
                    ApiResponse<Sale> =
                    {};

                if (raw.trim()) {
                    try {
                        result =
                            JSON.parse(
                                raw,
                            );
                    } catch {
                        throw new Error(
                            "The server returned an invalid response.",
                        );
                    }
                }

                if (
                    response.status ===
                    404
                ) {
                    throw new Error(
                        "Sale not found.",
                    );
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
                        "Sale data was not returned.",
                    );
                }

                if (!cancelled) {
                    setSale(
                        result.data,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "[PaymentForm]",
                        err,
                    );

                    setError(
                        err instanceof
                        Error
                            ? err.message
                            : "Failed to load sale.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingSale(false);
                }
            }
        }

        void loadSale();

        return () => {
            cancelled = true;
        };
    }, [saleId]);

    async function save() {
        if (saving) {
            return;
        }

        setError(null);

        if (!saleId) {
            setError(
                "A sale is required to create a payment.",
            );
            return;
        }

        if (!sale) {
            setError(
                "Sale data is not available.",
            );
            return;
        }

        if (
            sale.status !==
            "confirmed"
        ) {
            setError(
                "Only confirmed sales can receive payments.",
            );
            return;
        }

        const numericAmount =
            Number(amount);

        if (
            !Number.isFinite(
                numericAmount,
            ) ||
            numericAmount <= 0
        ) {
            setError(
                "Payment amount must be greater than 0.",
            );
            return;
        }

        if (!paymentMethod) {
            setError(
                "Please select a payment method.",
            );
            return;
        }

        const outstanding =
            getOutstanding(sale);

        if (outstanding <= 0) {
            setError(
                "This sale is already fully paid.",
            );
            return;
        }

        if (
            numericAmount >
            outstanding
        ) {
            setError(
                `Payment amount cannot exceed ${formatMoney(
                    outstanding,
                )}.`,
            );
            return;
        }

        setSaving(true);

        try {
            const response =
                await fetch(
                    "/api/payments",
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },
                        body: JSON.stringify({
                            saleId,
                            amount:
                            numericAmount,
                            paymentMethod,
                            note:
                                note.trim() ||
                                null,
                        }),
                    },
                );

            const result =
                (await response.json()) as ApiResponse;

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        "Failed to create payment.",
                    ),
                );
            }

            if (
                result.data &&
                typeof result.data ===
                "object" &&
                "payment" in
                result.data
            ) {
                const payment =
                    (
                        result.data as {
                            payment?: {
                                id?: string;
                            };
                        }
                    ).payment;

                if (payment?.id) {
                    router.push(
                        `/payments/${payment.id}`,
                    );

                    router.refresh();

                    return;
                }
            }

            router.push(
                `/sales/${saleId}`,
            );

            router.refresh();
        } catch (err) {
            console.error(
                "[PaymentForm]",
                err,
            );

            setError(
                err instanceof
                Error
                    ? err.message
                    : "Failed to create payment.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (!saleId) {
        return (
            <div className="mizan-page-enter mx-auto max-w-3xl space-y-6">
                <section className="mizan-page-header">
                    <div>
                        <Link
                            href="/payments"
                            className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                        >
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>
                            Payments
                        </Link>

                        <h1 className="mizan-page-title mt-3">
                            New payment
                        </h1>

                        <p className="mizan-page-description">
                            Select a sale before
                            recording a payment.
                        </p>
                    </div>
                </section>

                <section className="mizan-card p-6">
                    <div className="mizan-empty min-h-[300px]">
                        <div className="mizan-empty-icon">
                            <Receipt className="h-5 w-5"/>
                        </div>

                        <h2 className="mt-3 text-lg font-bold text-[var(--text-primary)]">
                            No sale selected
                        </h2>

                        <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                            Payments must always belong to
                            a sale.
                        </p>

                        <Link
                            href="/sales"
                            className="mizan-primary-action mt-5"
                        >
                            <Receipt className="h-4 w-4"/>

                            <span className="ml-2">
                                Select sale
                            </span>
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    if (loadingSale) {
        return (
            <div className="mizan-card p-6">
                <div className="space-y-4">
                    <div className="mizan-skeleton h-6 w-48 rounded"/>
                    <div className="mizan-skeleton h-10 w-full rounded"/>
                    <div className="mizan-skeleton h-10 w-full rounded"/>
                    <div className="mizan-skeleton h-32 w-full rounded"/>
                </div>
            </div>
        );
    }

    if (error && !sale) {
        return (
            <div className="mizan-empty">
                <div className="mizan-empty-icon">
                    <Receipt className="h-5 w-5"/>
                </div>

                <p className="mt-3 text-sm font-semibold text-[var(--danger)]">
                    {error}
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

    if (!sale) {
        return null;
    }

    const outstanding =
        getOutstanding(sale);

    const previewAmount =
        Number(amount) || 0;

    const previewOutstanding =
        Math.max(
            outstanding -
            previewAmount,
            0,
        );

    return (
        <div className="mizan-page-enter mx-auto max-w-5xl space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href={`/sales/${sale.id}`}
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>
                        Back to sale
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <div
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                            <Receipt className="h-5 w-5"/>
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                                Payment
                            </p>

                            <h1 className="mizan-page-title mt-1">
                                New payment
                            </h1>

                            <p className="mizan-page-description">
                                Record a customer
                                payment against this
                                sale.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {error ? (
                <section
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                >
                    {error}
                </section>
            ) : null}

            {sale.status !==
            "confirmed" ? (
                <section
                    role="alert"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
                >
                    Payments can only be recorded for
                    confirmed sales.
                </section>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="mizan-card p-5 sm:p-7">
                    <div
                        className="mb-6 flex items-start justify-between gap-4 border-b border-[var(--border-soft)] pb-5">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                Sale
                            </p>

                            <h2 className="mt-1 text-lg font-black text-[var(--text-primary)]">
                                {
                                    sale.saleNumber
                                }
                            </h2>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                {sale.customerName ??
                                    "No customer"}
                            </p>
                        </div>

                        <Link
                            href={`/sales/${sale.id}`}
                            className="text-xs font-semibold text-[var(--primary)] hover:underline"
                        >
                            View sale
                        </Link>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="payment-amount"
                                className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                            >
                                Amount
                            </label>

                            <div className="relative">
                                <input
                                    id="payment-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    max={
                                        outstanding >
                                        0
                                            ? outstanding
                                            : undefined
                                    }
                                    value={
                                        amount
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setAmount(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="0.00"
                                    className="pr-16"
                                    disabled={
                                        outstanding <=
                                        0 ||
                                        sale.status !==
                                        "confirmed"
                                    }
                                />

                                <span
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)]">
                                    DZD
                                </span>
                            </div>

                            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                                Outstanding:
                                {" "}
                                {formatMoney(
                                    outstanding,
                                )}
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="payment-method"
                                className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                            >
                                Payment method
                            </label>

                            <select
                                id="payment-method"
                                value={
                                    paymentMethod
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setPaymentMethod(
                                        event
                                            .target
                                            .value as PaymentMethod,
                                    )
                                }
                                disabled={
                                    sale.status !==
                                    "confirmed"
                                }
                            >
                                {PAYMENT_METHODS.map(
                                    (
                                        method,
                                    ) => (
                                        <option
                                            key={
                                                method.value
                                            }
                                            value={
                                                method.value
                                            }
                                        >
                                            {
                                                method.label
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-[var(--border-soft)] pt-6">
                        <label
                            htmlFor="payment-note"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Note
                        </label>

                        <textarea
                            id="payment-note"
                            value={note}
                            onChange={(
                                event,
                            ) =>
                                setNote(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            rows={5}
                            maxLength={1000}
                            placeholder="Optional note about this payment..."
                            disabled={
                                sale.status !==
                                "confirmed"
                            }
                        />

                        <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                            {note.length}
                            /1000
                        </p>
                    </div>

                    <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Link
                            href={`/sales/${sale.id}`}
                            className="mizan-ghost-action justify-center"
                        >
                            Cancel
                        </Link>

                        <button
                            type="button"
                            disabled={
                                saving ||
                                sale.status !==
                                "confirmed" ||
                                outstanding <=
                                0
                            }
                            onClick={() =>
                                void save()
                            }
                            className="mizan-primary-action justify-center disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin"/>
                            ) : (
                                <Save className="h-4 w-4"/>
                            )}

                            <span className="ml-2">
                                Record payment
                            </span>
                        </button>
                    </div>
                </section>

                <aside className="mizan-card h-fit p-5 sm:p-6 lg:sticky lg:top-6">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-[var(--primary)]"/>

                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            Payment summary
                        </h2>
                    </div>

                    <div className="mt-5 space-y-4">
                        <SummaryRow
                            label="Sale total"
                            value={formatMoney(
                                Number(
                                    sale.totalAmount,
                                ),
                            )}
                        />

                        <SummaryRow
                            label="Already paid"
                            value={formatMoney(
                                Number(
                                    sale.paidTotal ??
                                    0,
                                ),
                            )}
                        />

                        <div className="border-t border-[var(--border-soft)] pt-4">
                            <SummaryRow
                                label="Outstanding"
                                value={formatMoney(
                                    outstanding,
                                )}
                                strong
                            />
                        </div>

                        {previewAmount >
                        0 ? (
                            <div className="border-t border-[var(--border-soft)] pt-4">
                                <SummaryRow
                                    label="After payment"
                                    value={formatMoney(
                                        previewOutstanding,
                                    )}
                                    strong
                                />
                            </div>
                        ) : null}
                    </div>

                    {outstanding <= 0 ? (
                        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"/>

                                <div>
                                    <p className="text-xs font-bold text-emerald-700">
                                        Sale fully paid
                                    </p>

                                    <p className="mt-1 text-[11px] leading-5 text-emerald-700/80">
                                        No payment is
                                        required for this
                                        sale.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-bold text-amber-700">
                                Outstanding balance
                            </p>

                            <p className="mt-1 text-sm font-black text-amber-800">
                                {formatMoney(
                                    outstanding,
                                )}
                            </p>
                        </div>
                    )}

                    <p className="mt-4 text-[11px] leading-5 text-[var(--text-muted)]">
                        The server validates the sale,
                        organization, and outstanding balance
                        before creating the payment.
                    </p>
                </aside>
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

function getOutstanding(
    sale: Sale,
) {
    if (
        typeof sale.outstanding ===
        "number"
    ) {
        return Math.max(
            sale.outstanding,
            0,
        );
    }

    return Math.max(
        Number(
            sale.totalAmount,
        ) -
        Number(
            sale.paidTotal ?? 0,
        ),
        0,
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