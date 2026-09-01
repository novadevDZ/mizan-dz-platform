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
    useState,
} from "react";
import {useRouter} from "next/navigation";

type ExpenseCategory =
    | "rent"
    | "transport"
    | "electricity"
    | "internet"
    | "salary"
    | "maintenance"
    | "supplies"
    | "other";

const CATEGORIES: {
    value: ExpenseCategory;
    label: string;
}[] = [
    {value: "rent", label: "Rent"},
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

async function getApiData<T>(
    response: Response,
): Promise<T> {
    const json = await response.json();

    if (!response.ok) {
        throw new Error(
            json?.message ??
            json?.error ??
            "Request failed.",
        );
    }

    return (
        json?.data ??
        json
    ) as T;
}

export default function NewExpensePage() {
    const router = useRouter();

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
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        try {
            setLoading(true);
            setError(null);

            if (!title.trim()) {
                throw new Error(
                    "Title is required.",
                );
            }

            if (!amount.trim()) {
                throw new Error(
                    "Amount is required.",
                );
            }

            const response =
                await fetch(
                    "/api/expenses",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            {
                                title:
                                    title.trim(),
                                category,
                                amount:
                                    amount.trim(),
                                description:
                                    description.trim() ||
                                    null,
                            },
                        ),
                    },
                );

            const expense =
                await getApiData<{
                    id: string;
                }>(response);

            router.push(
                `/expenses/${expense.id}`,
            );
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to create expense.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="w-full min-w-0 p-4 md:p-6">
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-6">
                    <Link
                        href="/expenses"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="size-4"/>
                        Back to expenses
                    </Link>

                    <h1 className="mt-4 text-2xl font-bold tracking-tight">
                        Add Expense
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Record a new business
                        expense.
                    </p>
                </div>

                {error && (
                    <div
                        className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive"/>

                        <div>
                            <p className="font-semibold">
                                Unable to create
                                expense
                            </p>

                            <p className="mt-1 text-muted-foreground">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="rounded-xl border bg-card shadow-sm"
                >
                    <div className="space-y-6 p-5 md:p-6">
                        <div>
                            <label className="text-sm font-semibold">
                                Title
                                <span className="ml-1 text-destructive">
                                    *
                                </span>
                            </label>

                            <input
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
                                maxLength={100}
                                placeholder="e.g. Office rent"
                                className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-semibold">
                                    Category
                                </label>

                                <select
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
                                    className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                                <label className="text-sm font-semibold">
                                    Amount
                                    <span className="ml-1 text-destructive">
                                        *
                                    </span>
                                </label>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
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
                                        className="mt-2 h-11 w-full rounded-lg border bg-background px-3 pr-16 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />

                                    <span
                                        className="pointer-events-none absolute right-3 top-[21px] text-xs font-medium text-muted-foreground">
                                        DZD
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold">
                                Description
                            </label>

                            <textarea
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
                                maxLength={5000}
                                rows={5}
                                placeholder="Optional notes about this expense..."
                                className="mt-2 w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />

                            <p className="mt-1 text-right text-xs text-muted-foreground">
                                {
                                    description.length
                                }{" "}
                                / 5000
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 p-5 sm:flex-row sm:justify-end">
                        <Link
                            href="/expenses"
                            className="inline-flex h-10 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition hover:bg-muted"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="size-4 animate-spin"/>
                            ) : (
                                <Save className="size-4"/>
                            )}
                            {loading
                                ? "Creating..."
                                : "Create Expense"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}