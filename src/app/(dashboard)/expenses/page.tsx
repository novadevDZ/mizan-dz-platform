"use client";

import Link from "next/link";
import {
    AlertCircle,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    FileText,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Receipt,
    Search,
    Trash2,
    Wallet,
    X,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

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
    createdAt: string;
    deletedAt?: string | null;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type Summary = {
    totalExpenses: number;
    totalAmount: number;
};

type ExpensesResponse = {
    items: Expense[];
    summary: Summary;
    pagination: Pagination;
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

function formatDZD(value: number) {
    return new Intl.NumberFormat("en-DZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value) + " DZD";
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-DZ", {
        dateStyle: "medium",
    }).format(new Date(value));
}

function getCategoryLabel(
    category: ExpenseCategory,
) {
    return (
        CATEGORIES.find(
            (item) =>
                item.value === category,
        )?.label ?? category
    );
}

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

export default function ExpensesPage() {
    const [items, setItems] =
        useState<Expense[]>([]);

    const [summary, setSummary] =
        useState<Summary>({
            totalExpenses: 0,
            totalAmount: 0,
        });

    const [pagination, setPagination] =
        useState<Pagination>({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        });

    const [search, setSearch] =
        useState("");

    const [category, setCategory] =
        useState<
            ExpenseCategory | ""
        >("");

    const [page, setPage] =
        useState(1);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [deletingId, setDeletingId] =
        useState<string | null>(null);

    const [openMenuId, setOpenMenuId] =
        useState<string | null>(null);

    const query = useMemo(() => {
        const params =
            new URLSearchParams();

        if (search.trim()) {
            params.set(
                "search",
                search.trim(),
            );
        }

        if (category) {
            params.set(
                "category",
                category,
            );
        }

        params.set(
            "page",
            String(page),
        );

        params.set(
            "limit",
            "20",
        );

        return params.toString();
    }, [
        search,
        category,
        page,
    ]);

    const loadExpenses =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const response =
                    await fetch(
                        `/api/expenses?${query}`,
                        {
                            method: "GET",
                            cache: "no-store",
                        },
                    );

                const data =
                    await getApiData<ExpensesResponse>(
                        response,
                    );

                setItems(
                    data.items ?? [],
                );

                setSummary(
                    data.summary ?? {
                        totalExpenses: 0,
                        totalAmount: 0,
                    },
                );

                setPagination(
                    data.pagination,
                );
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load expenses.",
                );
            } finally {
                setLoading(false);
            }
        }, [query]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    useEffect(() => {
        const closeMenu =
            () => setOpenMenuId(null);

        document.addEventListener(
            "click",
            closeMenu,
        );

        return () =>
            document.removeEventListener(
                "click",
                closeMenu,
            );
    }, []);

    function handleSearch(
        value: string,
    ) {
        setSearch(value);
        setPage(1);
    }

    function handleCategory(
        value: string,
    ) {
        setCategory(
            value as ExpenseCategory | "",
        );
        setPage(1);
    }

    async function handleDelete(
        expense: Expense,
    ) {
        const confirmed =
            window.confirm(
                `Delete "${expense.title}"?\n\nThis expense will be soft deleted and removed from the active expense list.`,
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(
                expense.id,
            );
            setError(null);

            const response =
                await fetch(
                    `/api/expenses/${expense.id}`,
                    {
                        method: "DELETE",
                    },
                );

            await getApiData(response);

            setItems((current) =>
                current.filter(
                    (item) =>
                        item.id !==
                        expense.id,
                ),
            );

            setSummary((current) => ({
                totalExpenses:
                    Math.max(
                        current.totalExpenses -
                        1,
                        0,
                    ),
                totalAmount:
                    Math.max(
                        current.totalAmount -
                        expense.amount,
                        0,
                    ),
            }));

            setPagination(
                (current) => ({
                    ...current,
                    total: Math.max(
                        current.total - 1,
                        0,
                    ),
                }),
            );

            setOpenMenuId(null);

            if (
                items.length === 1 &&
                page > 1
            ) {
                setPage(
                    (current) =>
                        current - 1,
                );
            }
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to delete expense.",
            );
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <main className="w-full min-w-0 space-y-6 p-4 md:p-6">
            {/* Header */}
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                            href="/dashboard"
                            className="transition hover:text-foreground"
                        >
                            Dashboard
                        </Link>

                        <ArrowLeft className="size-3.5"/>

                        <span>
                            Expenses
                        </span>
                    </div>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight">
                        Expenses
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Track and manage your
                        business expenses.
                    </p>
                </div>

                <Link
                    href="/expenses/new"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                    <Plus className="size-4"/>
                    Add Expense
                </Link>
            </section>

            {/* Error */}
            {error && (
                <div
                    className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive"/>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                            Something went wrong
                        </p>

                        <p className="mt-1 text-muted-foreground">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setError(null)
                        }
                        className="rounded-md p-1 transition hover:bg-destructive/10"
                    >
                        <X className="size-4"/>
                    </button>
                </div>
            )}

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Expenses
                            </p>

                            <p className="mt-2 text-2xl font-bold">
                                {
                                    summary.totalExpenses
                                }
                            </p>
                        </div>

                        <div className="rounded-lg bg-muted p-2.5">
                            <Receipt className="size-5"/>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Amount
                            </p>

                            <p className="mt-2 text-2xl font-bold">
                                {formatDZD(
                                    summary.totalAmount,
                                )}
                            </p>
                        </div>

                        <div className="rounded-lg bg-muted p-2.5">
                            <CircleDollarSign className="size-5"/>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

                        <input
                            value={search}
                            onChange={(event) =>
                                handleSearch(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Search expenses..."
                            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <select
                        value={category}
                        onChange={(event) =>
                            handleCategory(
                                event.target
                                    .value,
                            )
                        }
                        className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">
                            All categories
                        </option>

                        {CATEGORIES.map(
                            (item) => (
                                <option
                                    key={
                                        item.value
                                    }
                                    value={
                                        item.value
                                    }
                                >
                                    {item.label}
                                </option>
                            ),
                        )}
                    </select>
                </div>
            </section>

            {/* Content */}
            <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
                {loading ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Loader2 className="size-5 animate-spin"/>
                            Loading expenses...
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                        <div className="rounded-full bg-muted p-4">
                            <Wallet className="size-7 text-muted-foreground"/>
                        </div>

                        <h2 className="mt-4 text-lg font-semibold">
                            No expenses found
                        </h2>

                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                            {search ||
                            category
                                ? "Try changing your search or filter."
                                : "Start recording your business expenses."}
                        </p>

                        {!search &&
                            !category && (
                                <Link
                                    href="/expenses/new"
                                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                                >
                                    <Plus className="size-4"/>
                                    Add Expense
                                </Link>
                            )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">
                                        Expense
                                    </th>

                                    <th className="px-5 py-3 font-semibold">
                                        Category
                                    </th>

                                    <th className="px-5 py-3 font-semibold">
                                        Amount
                                    </th>

                                    <th className="px-5 py-3 font-semibold">
                                        Date
                                    </th>

                                    <th className="w-16 px-5 py-3"/>
                                </tr>
                                </thead>

                                <tbody className="divide-y">
                                {items.map(
                                    (
                                        expense,
                                    ) => (
                                        <tr
                                            key={
                                                expense.id
                                            }
                                            className="transition hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={`/expenses/${expense.id}`}
                                                    className="font-semibold hover:underline"
                                                >
                                                    {
                                                        expense.title
                                                    }
                                                </Link>

                                                {expense.description && (
                                                    <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                                                        {
                                                            expense.description
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                    <span
                                                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                                                        {getCategoryLabel(
                                                            expense.category,
                                                        )}
                                                    </span>
                                            </td>

                                            <td className="px-5 py-4 font-semibold">
                                                {formatDZD(
                                                    expense.amount,
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-muted-foreground">
                                                {formatDate(
                                                    expense.createdAt,
                                                )}
                                            </td>

                                            <td className="relative px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(
                                                        event,
                                                    ) => {
                                                        event.stopPropagation();

                                                        setOpenMenuId(
                                                            (
                                                                current,
                                                            ) =>
                                                                current ===
                                                                expense.id
                                                                    ? null
                                                                    : expense.id,
                                                        );
                                                    }}
                                                    className="rounded-lg p-2 transition hover:bg-muted"
                                                >
                                                    <MoreHorizontal className="size-4"/>
                                                </button>

                                                {openMenuId ===
                                                    expense.id && (
                                                        <div
                                                            onClick={(
                                                                event,
                                                            ) =>
                                                                event.stopPropagation()}
                                                            className="absolute right-5 top-12 z-20 w-40 rounded-lg border bg-popover p-1 text-left shadow-lg"
                                                        >
                                                            <Link
                                                                href={`/expenses/${expense.id}`}
                                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                                                            >
                                                                <FileText className="size-4"/>
                                                                View
                                                            </Link>

                                                            <Link
                                                                href={`/expenses/${expense.id}/edit`}
                                                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                                                            >
                                                                <Pencil className="size-4"/>
                                                                Edit
                                                            </Link>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    deletingId ===
                                                                    expense.id
                                                                }
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        expense,
                                                                    )
                                                                }
                                                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                                            >
                                                                {deletingId ===
                                                                expense.id ? (
                                                                    <Loader2 className="size-4 animate-spin"/>
                                                                ) : (
                                                                    <Trash2 className="size-4"/>
                                                                )}
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                            </td>
                                        </tr>
                                    ),
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className="divide-y md:hidden">
                            {items.map(
                                (
                                    expense,
                                ) => (
                                    <article
                                        key={
                                            expense.id
                                        }
                                        className="p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/expenses/${expense.id}`}
                                                    className="font-semibold hover:underline"
                                                >
                                                    {
                                                        expense.title
                                                    }
                                                </Link>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {getCategoryLabel(
                                                        expense.category,
                                                    )}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenMenuId(
                                                        (
                                                            current,
                                                        ) =>
                                                            current ===
                                                            expense.id
                                                                ? null
                                                                : expense.id,
                                                    )
                                                }
                                                className="shrink-0 rounded-lg p-2 hover:bg-muted"
                                            >
                                                <MoreHorizontal className="size-4"/>
                                            </button>
                                        </div>

                                        <div className="mt-4 flex items-end justify-between gap-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Amount
                                                </p>

                                                <p className="mt-1 font-bold">
                                                    {formatDZD(
                                                        expense.amount,
                                                    )}
                                                </p>
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(
                                                    expense.createdAt,
                                                )}
                                            </p>
                                        </div>

                                        {openMenuId ===
                                            expense.id && (
                                                <div className="mt-3 rounded-lg border bg-muted/30 p-1">
                                                    <Link
                                                        href={`/expenses/${expense.id}`}
                                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                                                    >
                                                        <FileText className="size-4"/>
                                                        View
                                                    </Link>

                                                    <Link
                                                        href={`/expenses/${expense.id}/edit`}
                                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                                                    >
                                                        <Pencil className="size-4"/>
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                expense,
                                                            )
                                                        }
                                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="size-4"/>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                    </article>
                                ),
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages >
                            0 && (
                                <div
                                    className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Page{" "}
                                        <span className="font-medium text-foreground">
                                        {
                                            pagination.page
                                        }
                                    </span>{" "}
                                        of{" "}
                                        <span className="font-medium text-foreground">
                                        {
                                            pagination.totalPages
                                        }
                                    </span>
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={
                                                !pagination.hasPreviousPage
                                            }
                                            onClick={() =>
                                                setPage(
                                                    (
                                                        current,
                                                    ) =>
                                                        Math.max(
                                                            current -
                                                            1,
                                                            1,
                                                        ),
                                                )
                                            }
                                            className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                                        >
                                            <ChevronLeft className="size-4"/>
                                            Previous
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                !pagination.hasNextPage
                                            }
                                            onClick={() =>
                                                setPage(
                                                    (
                                                        current,
                                                    ) =>
                                                        current +
                                                        1,
                                                )
                                            }
                                            className="inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                                        >
                                            Next
                                            <ChevronRight className="size-4"/>
                                        </button>
                                    </div>
                                </div>
                            )}
                    </>
                )}
            </section>
        </main>
    );
}