"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    Building2,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    Edit3,
    Landmark,
    Receipt,
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

type Payment = {
    id: string;
    organizationId: string;
    customerId: string;
    saleId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    note: string | null;
    createdAt: string;

    saleNumber: string;
    saleTotal: number;

    customerName: string | null;
    customerPhone: string | null;

    paidTotal: number;
    outstanding: number;
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

export default function PaymentDetails({
                                           id,
                                       }: {
    id: string;
}) {
    const router = useRouter();

    const [payment, setPayment] =
        useState<Payment | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    async function loadPayment() {
        setLoading(true);
        setError(null);

        try {
            const response =
                await fetch(
                    `/api/payments/${id}`,
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
                ApiResponse<Payment> =
                {};

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

            if (
                response.status ===
                404
            ) {
                router.replace(
                    "/payments",
                );
                return;
            }

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        "Failed to load payment.",
                    ),
                );
            }

            if (!result.data) {
                throw new Error(
                    "Payment data was not returned by the server.",
                );
            }

            setPayment(
                result.data,
            );
        } catch (err) {
            console.error(
                "[PaymentDetails]",
                err,
            );

            setError(
                err instanceof
                Error
                    ? err.message
                    : "Failed to load payment.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadPayment();
    }, [id]);

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
                            <div className="mizan-skeleton h-3 w-28 rounded"/>
                            <div className="mizan-skeleton h-10 w-40 rounded"/>
                            <div className="mizan-skeleton h-8 w-full rounded"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !payment) {
        return (
            <div className="mizan-empty">
                <div className="mizan-empty-icon">
                    <Receipt className="h-5 w-5"/>
                </div>

                <p className="mt-3 text-sm font-semibold text-[var(--danger)]">
                    {error ??
                        "Payment not found."}
                </p>

                <Link
                    href="/payments"
                    className="mizan-primary-action mt-5"
                >
                    <ArrowLeft className="h-4 w-4"/>

                    <span className="ml-2">
                        Back to payments
                    </span>
                </Link>
            </div>
        );
    }

    const isFullyPaid =
        payment.outstanding <= 0;

    return (
        <div className="mizan-page-enter space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href="/payments"
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>
                        Payments
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <PaymentAvatar
                            method={
                                payment.paymentMethod
                            }
                        />

                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                                Payment details
                            </p>

                            <h1 className="mizan-page-title mt-1">
                                {formatMoney(
                                    payment.amount,
                                )}
                            </h1>

                            <p className="mt-1 break-all text-xs text-[var(--text-muted)]">
                                Payment ID:{" "}
                                {payment.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/payments/${payment.id}/edit`}
                        className="mizan-ghost-action"
                    >
                        <Edit3 className="h-4 w-4"/>

                        <span className="ml-2">
                            Edit
                        </span>
                    </Link>

                    <Link
                        href={`/sales/${payment.saleId}`}
                        className="mizan-primary-action"
                    >
                        <Receipt className="h-4 w-4"/>

                        <span className="ml-2">
                            View sale
                        </span>
                    </Link>
                </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-4">
                    <section className="mizan-dashboard-section">
                        <div className="mizan-dashboard-section-header">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                    Payment information
                                </h2>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Details of the
                                    recorded
                                    transaction.
                                </p>
                            </div>

                            <PaymentMethodBadge
                                method={
                                    payment.paymentMethod
                                }
                            />
                        </div>

                        <div className="mizan-dashboard-section-body grid gap-5 sm:grid-cols-2">
                            <InfoItem
                                icon={
                                    CircleDollarSign
                                }
                                label="Amount"
                                value={formatMoney(
                                    payment.amount,
                                )}
                            />

                            <InfoItem
                                icon={getPaymentMethodIcon(
                                    payment.paymentMethod,
                                )}
                                label="Payment method"
                                value={formatPaymentMethod(
                                    payment.paymentMethod,
                                )}
                            />

                            <InfoItem
                                icon={
                                    CalendarDays
                                }
                                label="Created"
                                value={formatDateTime(
                                    payment.createdAt,
                                )}
                            />

                            <InfoItem
                                icon={Receipt}
                                label="Sale"
                                value={
                                    payment.saleNumber
                                }
                            />
                        </div>

                        <div className="border-t border-[var(--border-soft)]">
                            <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
                                <CustomerInfo
                                    name={
                                        payment.customerName
                                    }
                                    phone={
                                        payment.customerPhone
                                    }
                                />

                                <InfoItem
                                    icon={
                                        Receipt
                                    }
                                    label="Sale ID"
                                    value={
                                        payment.saleId
                                    }
                                />
                            </div>
                        </div>

                        {payment.note ? (
                            <div className="border-t border-[var(--border-soft)] px-5 py-5 sm:px-6">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                    Note
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-primary)]">
                                    {
                                        payment.note
                                    }
                                </p>
                            </div>
                        ) : null}
                    </section>

                    <section className="mizan-dashboard-section">
                        <div className="mizan-dashboard-section-header">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                    Sale financial status
                                </h2>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Current payment
                                    position for
                                    this sale.
                                </p>
                            </div>

                            <PaymentStatusBadge
                                outstanding={
                                    payment.outstanding
                                }
                            />
                        </div>

                        <div className="mizan-dashboard-section-body grid gap-5 sm:grid-cols-3">
                            <FinancialItem
                                label="Sale total"
                                value={formatMoney(
                                    payment.saleTotal,
                                )}
                            />

                            <FinancialItem
                                label="Total paid"
                                value={formatMoney(
                                    payment.paidTotal,
                                )}
                            />

                            <FinancialItem
                                label="Outstanding"
                                value={formatMoney(
                                    payment.outstanding,
                                )}
                                emphasis
                            />
                        </div>
                    </section>
                </div>

                <aside className="mizan-card h-fit p-5 sm:p-6 lg:sticky lg:top-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        Payment amount
                    </p>

                    <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)]">
                        {formatMoney(
                            payment.amount,
                        )}
                    </p>

                    <div className="mt-5 border-t border-[var(--border-soft)] pt-4">
                        <SummaryRow
                            label="Sale total"
                            value={formatMoney(
                                payment.saleTotal,
                            )}
                        />

                        <div className="mt-3">
                            <SummaryRow
                                label="Total paid"
                                value={formatMoney(
                                    payment.paidTotal,
                                )}
                            />
                        </div>

                        <div className="mt-4 border-t border-[var(--border-soft)] pt-4">
                            <SummaryRow
                                label="Outstanding"
                                value={formatMoney(
                                    payment.outstanding,
                                )}
                                strong
                            />
                        </div>
                    </div>

                    <div
                        className={
                            isFullyPaid
                                ? "mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
                                : "mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3"
                        }
                    >
                        <div className="flex items-start gap-2">
                            <CheckCircle2
                                className={
                                    isFullyPaid
                                        ? "mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                                        : "mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                                }
                            />

                            <div>
                                <p
                                    className={
                                        isFullyPaid
                                            ? "text-xs font-bold text-emerald-700"
                                            : "text-xs font-bold text-amber-700"
                                    }
                                >
                                    {isFullyPaid
                                        ? "Sale fully paid"
                                        : "Outstanding balance"}
                                </p>

                                <p
                                    className={
                                        isFullyPaid
                                            ? "mt-1 text-[11px] leading-5 text-emerald-700/80"
                                            : "mt-1 text-[11px] leading-5 text-amber-700/80"
                                    }
                                >
                                    {isFullyPaid
                                        ? "No amount remains to be collected."
                                        : `${formatMoney(
                                            payment.outstanding,
                                        )} remains to be collected.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={`/sales/${payment.saleId}`}
                        className="mizan-primary-action mt-6 w-full justify-center"
                    >
                        <Receipt className="h-4 w-4"/>

                        <span className="ml-2">
                            Open sale
                        </span>
                    </Link>
                </aside>
            </div>
        </div>
    );
}

function PaymentAvatar({
                           method,
                       }: {
    method: PaymentMethod;
}) {
    const Icon =
        getPaymentMethodIcon(method);

    return (
        <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
            <Icon className="h-5 w-5"/>
        </div>
    );
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

            {formatPaymentMethod(
                method,
            )}
        </span>
    );
}

function PaymentStatusBadge({
                                outstanding,
                            }: {
    outstanding: number;
}) {
    if (outstanding <= 0) {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5"/>

                Fully paid
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            Outstanding
        </span>
    );
}

function CustomerInfo({
                          name,
                          phone,
                      }: {
    name: string | null;
    phone: string | null;
}) {
    return (
        <div className="flex items-start gap-3">
            <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                <Receipt className="h-4 w-4"/>
            </div>

            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Customer
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">
                    {name ?? "—"}
                </p>

                {phone ? (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {phone}
                    </p>
                ) : null}
            </div>
        </div>
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

function FinancialItem({
                           label,
                           value,
                           emphasis = false,
                       }: {
    label: string;
    value: string;
    emphasis?: boolean;
}) {
    return (
        <div className="rounded-xl border border-[var(--border-soft)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {label}
            </p>

            <p
                className={
                    emphasis
                        ? "mt-2 text-xl font-black text-[var(--text-primary)]"
                        : "mt-2 text-lg font-bold text-[var(--text-primary)]"
                }
            >
                {value}
            </p>
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