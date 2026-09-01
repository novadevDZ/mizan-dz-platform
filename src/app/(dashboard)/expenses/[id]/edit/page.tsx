"use client";

import Link from "next/link";
import {
    AlertCircle,
    ArrowLeft,
    Loader2,
    Save,
} from "lucide-react";
import {
    FormEvent,
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
    title: string;
    category: ExpenseCategory;
    amount: number;
    description: string | null;
    deletedAt?: string | null;
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

const CATEGORIES: {
    value: ExpenseCategory;
    label: string;
}[] = [
    {
        value: "rent",
        label: "Rent",
    },
    {
        value: "transport",
        label: "Transport",
    },
    {
        value: "electricity",
        label: "Electricity",
    },
    {
        value: "internet",
        label: "Internet",
    },
    {
        value: "salary",
        label: "Salary",
    },
    {
        value: "maintenance",
        label: "Maintenance",
    },
    {
        value: "supplies",
        label: "Supplies",
    },
    {
        value: "other",
        label: "Other",
    },
];

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
        result.data === undefined
    ) {
        throw new Error(
            "The server returned an invalid response.",
        );
    }

    return result.data;
}

export default function EditExpensePage() {
    const params = useParams();
    const router = useRouter();

    const rawId = params.id;

    const id =
        typeof rawId === "string"
            ? rawId
            : Array.isArray(rawId)
                ? rawId[0] ?? ""
                : "";

    const [expense, setExpense] =
        useState<Expense | null>(
            null,
        );

    const [title, setTitle] =
        useState("");

    const [category, setCategory] =
        useState<ExpenseCategory>(
            "other",
        );

    const [amount, setAmount] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
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

                setTitle(
                    data.title,
                );

                setCategory(
                    data.category,
                );

                setAmount(
                    Number.isFinite(
                        data.amount,
                    )
                        ? data.amount.toFixed(
                            2,
                        )
                        : "",
                );

                setDescription(
                    data.description ??
                    "",
                );
            } catch (error) {
                console.error(
                    "[EditExpense]",
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

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (saving) {
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const normalizedTitle =
                title.trim();

            const normalizedAmount =
                amount.trim();

            const normalizedDescription =
                description.trim();

            if (!normalizedTitle) {
                throw new Error(
                    "Title is required.",
                );
            }

            if (
                normalizedTitle.length >
                100
            ) {
                throw new Error(
                    "Title must not exceed 100 characters.",
                );
            }

            if (
                !normalizedAmount
            ) {
                throw new Error(
                    "Amount is required.",
                );
            }

            const numericAmount =
                Number(
                    normalizedAmount,
                );

            if (
                !Number.isFinite(
                    numericAmount,
                ) ||
                numericAmount <= 0
            ) {
                throw new Error(
                    "Amount must be greater than zero.",
                );
            }

            const response =
                await fetch(
                    `/api/expenses/${encodeURIComponent(
                        id,
                    )}`,
                    {
                        method: "PATCH",
                        credentials:
                            "include",
                        headers: {
                            Accept:
                                "application/json",
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            {
                                title:
                                normalizedTitle,

                                category,

                                amount:
                                normalizedAmount,

                                description:
                                    normalizedDescription ||
                                    null,
                            },
                        ),
                    },
                );

            await parseApiResponse<Expense>(
                response,
            );

            router.replace(
                `/expenses/${encodeURIComponent(
                    id,
                )}`,
            );

            router.refresh();
        } catch (error) {
            console.error(
                "[EditExpense:Save]",
                error,
            );

            setError(
                error instanceof
                Error
                    ? error.message
                    : "Failed to update expense.",
            );
        } finally {
            setSaving(false);
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
                                <h1 className="font-semibold">
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

    return (
        <main className="mizan-page-enter w-full min-w-0 p-4 md:p-6">
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-6">
                    <Link
                        href={`/expenses/${encodeURIComponent(
                            id,
                        )}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="size-4"/>
                        Back to expense
                    </Link>

                    <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                            Expenses
                        </p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                            Edit Expense
                        </h1>

                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Update the expense
                            information.
                        </p>
                    </div>
                </div>

                {error ? (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4"
                    >
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-[var(--danger)]"/>

                        <div>
                            <p className="text-sm font-semibold text-[var(--danger)]">
                                Unable to save
                                changes
                            </p>

                            <p className="mt-1 text-sm text-[var(--danger)]/80">
                                {error}
                            </p>
                        </div>
                    </div>
                ) : null}

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="mizan-card overflow-hidden"
                >
                    <div className="space-y-6 p-5 sm:p-6">
                        {/* Title */}
                        <div>
                            <label
                                htmlFor="expense-title"
                                className="text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Title
                                <span className="ml-1 text-[var(--danger)]">
                                    *
                                </span>
                            </label>

                            <input
                                id="expense-title"
                                type="text"
                                value={title}
                                onChange={(
                                    event,
                                ) =>
                                    setTitle(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                maxLength={
                                    100
                                }
                                disabled={
                                    saving
                                }
                                className="mt-2 h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                placeholder="e.g. Office rent"
                            />

                            <p className="mt-1 text-right text-[11px] text-[var(--text-muted)]">
                                {
                                    title.length
                                }{" "}
                                / 100
                            </p>
                        </div>

                        {/* Category + Amount */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="expense-category"
                                    className="text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    Category
                                </label>

                                <select
                                    id="expense-category"
                                    value={
                                        category
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setCategory(
                                            event
                                                .target
                                                .value as ExpenseCategory,
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="mt-2 h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {CATEGORIES.map(
                                        (
                                            item,
                                        ) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="expense-amount"
                                    className="text-sm font-semibold text-[var(--text-primary)]"
                                >
                                    Amount
                                    <span className="ml-1 text-[var(--danger)]">
                                        *
                                    </span>
                                </label>

                                <div className="relative">
                                    <input
                                        id="expense-amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        inputMode="decimal"
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
                                        disabled={
                                            saving
                                        }
                                        className="mt-2 h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 pr-16 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    />

                                    <span
                                        className="pointer-events-none absolute right-3 top-[22px] text-xs font-semibold text-[var(--text-muted)]">
                                        DZD
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="expense-description"
                                className="text-sm font-semibold text-[var(--text-primary)]"
                            >
                                Description
                            </label>

                            <textarea
                                id="expense-description"
                                value={
                                    description
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setDescription(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                disabled={
                                    saving
                                }
                                maxLength={
                                    5000
                                }
                                rows={6}
                                className="mt-2 w-full resize-y rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                placeholder="Optional details about this expense..."
                            />

                            <p className="mt-1 text-right text-[11px] text-[var(--text-muted)]">
                                {
                                    description.length
                                }{" "}
                                / 5000
                            </p>
                        </div>
                    </div>

                    <div
                        className="flex flex-col-reverse gap-3 border-t border-[var(--border-soft)] bg-[var(--surface-secondary)] p-5 sm:flex-row sm:justify-end sm:p-6">
                        <Link
                            href={`/expenses/${encodeURIComponent(
                                id,
                            )}`}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] px-5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)]"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="size-4 animate-spin"/>
                            ) : (
                                <Save className="size-4"/>
                            )}

                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}