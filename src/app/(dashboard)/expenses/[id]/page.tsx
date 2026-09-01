"use client";

import Link from "next/link";
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    CircleDollarSign,
    FileText,
    Loader2,
    Pencil,
    Receipt,
    Trash2,
    User,
} from "lucide-react";
import React, {
    useCallback,
    useEffect,
    useState,
} from "react";
import {
    useParams,
    useRouter,
} from "next/navigation";

type ExpenseCategory =
    | "rent"
    | "transport"
    | "electricity"
    | "internet"
    | "salary"
    | "maintenance"
    | "supplies"
    | "other";

type Expense = {
    id: string;
    organizationId: string;
    title: string;
    category: ExpenseCategory;
    amount: number;
    description: string | null;
    createdBy: string;
    createdByName: string | null;
    createdAt: string;
    deletedAt: string | null;
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

const CATEGORY_LABELS: Record<
    ExpenseCategory,
    string
> = {
    rent: "Rent",
    transport: "Transport",
    electricity: "Electricity",
    internet: "Internet",
    salary: "Salary",
    maintenance: "Maintenance",
    supplies: "Supplies",
    other: "Other",
};

function getApiErrorMessage(
    result: ApiResponse,
    fallback: string,
): string {
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
        typeof result.error
            .message === "string"
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

async function parseApiResponse<T>(
    response: Response,
): Promise<T> {
    const raw =
        await response.text();

    let result:
        ApiResponse<T> = {};

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

    if (!response.ok) {
        throw new Error(
            getApiErrorMessage(
                result,
                `Request failed. (${response.status})`,
            ),
        );
    }

    if (
        result.data ===
        undefined
    ) {
        throw new Error(
            "The server returned an invalid response.",
        );
    }

    return result.data;
}

function formatDZD(
    value: number,
): string {
    const amount =
        Number(value);

    if (
        !Number.isFinite(amount)
    ) {
        return "0.00 DZD";
    }

    return (
        new Intl.NumberFormat(
            "en-DZ",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        ).format(amount) +
        " DZD"
    );
}

function formatDateTime(
    value: string,
): string {
    const date =
        new Date(value);

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

export default function ExpenseDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const rawId = params.id;

    const id =
        typeof rawId ===
        "string"
            ? rawId
            : Array.isArray(rawId)
                ? rawId[0] ?? ""
                : "";

    const [expense, setExpense] =
        useState<Expense | null>(
            null,
        );

    const [loading, setLoading] =
        useState(true);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(
            null,
        );

    const loadExpense =
        useCallback(async () => {
            if (!id) {
                setExpense(null);
                setError(
                    "Invalid expense ID.",
                );
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response =
                    await fetch(
                        `/api/expenses/${encodeURIComponent(
                            id,
                        )}`,
                        {
                            method: "GET",
                            credentials:
                                "include",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache: "no-store",
                        },
                    );

                const data =
                    await parseApiResponse<Expense>(
                        response,
                    );

                setExpense(data);
            } catch (error) {
                console.error(
                    "[ExpenseDetails]",
                    error,
                );

                setExpense(null);

                setError(
                    error instanceof
                    Error
                        ? error.message
                        : "Failed to load expense.",
                );
            } finally {
                setLoading(false);
            }
        }, [id]);

    useEffect(() => {
        void loadExpense();
    }, [loadExpense]);

    async function handleDelete() {
        if (
            !expense ||
            deleting
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete
                "${expense.title}"?\n\nThis expense will be soft deleted and removed from the active expense list.`,
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setError(null);

            const response =
                await fetch(
                    `/api/expenses/${encodeURIComponent(
                        expense.id,
                    )}`,
                    {
                        method: "DELETE",
                        credentials:
                            "include",
                        headers: {
                            Accept:
                                "application/json",
                        },
                    },
                );

            await parseApiResponse(
                response,
            );

            router.replace(
                "/expenses",
            );
            router.refresh();
        } catch (error) {
            console.error(
                "[ExpenseDetails:Delete]",
                error,
            );

            setError(
                error instanceof
                Error
                    ? error.message
                    : "Failed to delete expense.",
            );
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-[60vh] w-full items-center justify-center p-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="size-5 animate-spin"/>

                    <span>
                        Loading expense...
                    </span>
                </div>
            </main>
        );
    }

    if (!expense) {
        return (
            <main className="w-full min-w-0 p-4 md:p-6">
                <div className="mx-auto max-w-3xl">
                    <Link
                        href="/expenses"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="size-4"/>
                        Back to expenses
                    </Link>

                    <section className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-destructive/10 p-2">
                                <AlertCircle className="size-5 text-destructive"/>
                            </div>

                            <div className="min-w-0">
                                <h1 className="font-semibold text-foreground">
                                    Unable to load
                                    expense
                                </h1>

                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    {error ??
                                        "Expense not found."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    void loadExpense()
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                                Try again
                            </button>

                            <Link
                                href="/expenses"
                                className="inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition hover:bg-muted"
                            >
                                <ArrowLeft className="size-4"/>
                                Back
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        );
    }

    const categoryLabel =
        CATEGORY_LABELS[
            expense.category
            ] ?? expense.category;

    const createdByLabel =
        expense.createdByName?.trim() ||
        "Unknown member";

    return (
        <main className="mizan-page-enter w-full min-w-0 space-y-6 p-4 md:p-6">
            {/* Header */}
            <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <Link
                        href="/expenses"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="size-4"/>
                        Expenses
                    </Link>

                    <div className="mt-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                            Expense details
                        </p>

                        <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                            {expense.title}
                        </h1>

                        <p className="mt-1 break-all text-xs text-[var(--text-muted)]">
                            ID: {expense.id}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/expenses/${encodeURIComponent(
                            expense.id,
                        )}/edit`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)]"
                    >
                        <Pencil className="size-4"/>
                        Edit
                    </Link>

                    <button
                        type="button"
                        onClick={
                            handleDelete
                        }
                        disabled={deleting}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 text-xs font-semibold text-[var(--danger)] transition hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {deleting ? (
                            <Loader2 className="size-4 animate-spin"/>
                        ) : (
                            <Trash2 className="size-4"/>
                        )}

                        {deleting
                            ? "Deleting..."
                            : "Delete"}
                    </button>
                </div>
            </section>

            {/* Error */}
            {error ? (
                <section
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--danger)]"/>

                        <div>
                            <p className="text-sm font-semibold text-[var(--danger)]">
                                Something went
                                wrong
                            </p>

                            <p className="mt-1 text-sm text-[var(--danger)]/80">
                                {error}
                            </p>
                        </div>
                    </div>
                </section>
            ) : null}

            {/* Financial summary */}
            <section className="grid gap-3 sm:grid-cols-2">
                <div className="mizan-card p-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                            <CircleDollarSign className="size-5"/>
                        </div>

                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                Amount
                            </p>

                            <p className="mt-1 truncate text-xl font-black text-[var(--text-primary)]">
                                {formatDZD(
                                    expense.amount,
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mizan-card p-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                            <Receipt className="size-5"/>
                        </div>

                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                Category
                            </p>

                            <p className="mt-1 truncate text-xl font-black text-[var(--text-primary)]">
                                {categoryLabel}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Details */}
            <section className="mizan-dashboard-section overflow-hidden">
                <div className="mizan-dashboard-section-header">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            Expense information
                        </h2>

                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Recorded expense details.
                        </p>
                    </div>
                </div>

                <div className="mizan-dashboard-section-body divide-y divide-[var(--border-soft)] p-0">
                    <DetailRow
                        icon={FileText}
                        label="Title"
                        value={
                            expense.title
                        }
                    />

                    <DetailRow
                        icon={Receipt}
                        label="Category"
                        value={
                            categoryLabel
                        }
                    />

                    <DetailRow
                        icon={
                            CircleDollarSign
                        }
                        label="Amount"
                        value={formatDZD(
                            expense.amount,
                        )}
                        strong
                    />

                    <DetailRow
                        icon={User}
                        label="Created by"
                        value={
                            createdByLabel
                        }
                    />

                    <DetailRow
                        icon={
                            CalendarDays
                        }
                        label="Created at"
                        value={formatDateTime(
                            expense.createdAt,
                        )}
                    />

                    <div className="grid gap-2 px-5 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                            Description
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-primary)]">
                            {expense.description ||
                                "No description provided."}
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}

function DetailRow({
                       icon: Icon,
                       label,
                       value,
                       strong = false,
                   }: {
    icon: React.ComponentType<{
        className?: string;
    }>;
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="grid gap-2 px-5 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-[var(--primary)]"/>

                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                    {label}
                </p>
            </div>

            <p
                className={
                    strong
                        ? "text-sm font-black text-[var(--text-primary)]"
                        : "text-sm font-semibold text-[var(--text-primary)]"
                }
            >
                {value}
            </p>
        </div>
    );
}