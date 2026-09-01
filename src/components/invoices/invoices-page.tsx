"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";

import {
    FileText,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCw,
} from "lucide-react";

type InvoiceStatus =
    | "draft"
    | "issued"
    | "paid"
    | "cancelled";

type Customer = {
    id: string;
    name: string;
    phone: string | null;
};

type Sale = {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
};

type Invoice = {
    id: string;
    invoiceNumber: string;
    saleId: string;
    customerId: string;
    status: InvoiceStatus;
    issuedAt: string | null;
    dueAt: string | null;
    subtotal: number;
    discount: number;
    total: number;
    notes: string | null;
    createdAt: string;
    updatedAt: string;

    customer: Customer | null;
    sale: Sale | null;
};

type ApiResponse = {
    items: Invoice[];

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

const LIMIT = 20;

function formatAmount(
    amount: number,
) {
    return new Intl.NumberFormat(
        "fr-DZ",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    ).format(amount);
}

function formatDate(
    date: string | null,
) {
    if (!date) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "fr-DZ",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        },
    ).format(new Date(date));
}

function getStatusLabel(
    status: InvoiceStatus,
) {
    switch (status) {
        case "draft":
            return "Draft";

        case "issued":
            return "Issued";

        case "paid":
            return "Paid";

        case "cancelled":
            return "Cancelled";

        default:
            return status;
    }
}

function getStatusClass(
    status: InvoiceStatus,
) {
    switch (status) {
        case "paid":
            return "bg-emerald-50 text-emerald-700";

        case "issued":
            return "bg-blue-50 text-blue-700";

        case "cancelled":
            return "bg-red-50 text-red-700";

        case "draft":
        default:
            return "bg-gray-100 text-gray-700";
    }
}

export default function InvoicesPage() {
    const [invoices, setInvoices] =
        useState<Invoice[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [search, setSearch] =
        useState("");

    const [page, setPage] =
        useState(1);

    const [pagination, setPagination] =
        useState<
            ApiResponse["pagination"] | null
        >(null);

    const fetchInvoices =
        useCallback(
            async (
                currentPage: number,
                currentSearch: string,
            ) => {
                try {
                    setLoading(true);
                    setError(null);

                    const params =
                        new URLSearchParams();

                    params.set(
                        "page",
                        String(currentPage),
                    );

                    params.set(
                        "limit",
                        String(LIMIT),
                    );

                    if (
                        currentSearch.trim()
                    ) {
                        params.set(
                            "search",
                            currentSearch.trim(),
                        );
                    }

                    const response =
                        await fetch(
                            `/api/invoices?${params.toString()}`,
                            {
                                method: "GET",
                                cache: "no-store",
                            },
                        );

                    const result =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result?.error ??
                            "Failed to fetch invoices.",
                        );
                    }

                    setInvoices(
                        result.data?.items ??
                        [],
                    );

                    setPagination(
                        result.data
                            ?.pagination ??
                        null,
                    );
                } catch (err) {
                    console.error(
                        "Failed to fetch invoices:",
                        err,
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to fetch invoices.",
                    );

                    setInvoices([]);
                    setPagination(null);
                } finally {
                    setLoading(false);
                }
            },
            [],
        );

    useEffect(() => {
        const timeout =
            setTimeout(() => {
                fetchInvoices(
                    page,
                    search,
                );
            }, 300);

        return () =>
            clearTimeout(timeout);
    }, [
        fetchInvoices,
        page,
        search,
    ]);

    function handleSearch(
        value: string,
    ) {
        setSearch(value);

        if (page !== 1) {
            setPage(1);
        }
    }

    function handlePreviousPage() {
        if (
            pagination?.hasPreviousPage
        ) {
            setPage(
                (current) =>
                    current - 1,
            );
        }
    }

    function handleNextPage() {
        if (
            pagination?.hasNextPage
        ) {
            setPage(
                (current) =>
                    current + 1,
            );
        }
    }

    function handleRefresh() {
        fetchInvoices(
            page,
            search,
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary"/>
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Invoices
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                View and manage your generated invoices.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${
                            loading
                                ? "animate-spin"
                                : ""
                        }`}
                    />

                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            handleSearch(
                                event.target.value,
                            )
                        }
                        placeholder="Search invoice, customer or phone..."
                        className="h-10 w-full rounded-md border bg-background pl-9 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">
                                Invoice
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                                Customer
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                                Date
                            </th>

                            <th className="px-4 py-3 text-left font-medium">
                                Status
                            </th>

                            <th className="px-4 py-3 text-right font-medium">
                                Total
                            </th>

                            <th className="px-4 py-3 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y">
                        {loading ? (
                            Array.from({
                                length: 6,
                            }).map(
                                (_, index) => (
                                    <tr
                                        key={
                                            index
                                        }
                                    >
                                        {Array.from(
                                            {
                                                length: 6,
                                            },
                                        ).map(
                                            (
                                                __,
                                                cellIndex,
                                            ) => (
                                                <td
                                                    key={
                                                        cellIndex
                                                    }
                                                    className="px-4 py-4"
                                                >
                                                    <div className="h-4 w-24 animate-pulse rounded bg-muted"/>
                                                </td>
                                            ),
                                        )}
                                    </tr>
                                ),
                            )
                        ) : invoices.length ===
                        0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        6
                                    }
                                    className="px-4 py-16 text-center"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div
                                            className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                            <FileText className="h-6 w-6 text-muted-foreground"/>
                                        </div>

                                        <div>
                                            <p className="font-medium">
                                                No invoices found
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {search
                                                    ? "Try a different search."
                                                    : "Invoices will appear here when sales generate them."}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            invoices.map(
                                (
                                    invoice,
                                ) => (
                                    <tr
                                        key={
                                            invoice.id
                                        }
                                        className="transition hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="font-medium">
                                                {
                                                    invoice.invoiceNumber
                                                }
                                            </div>

                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Sale #
                                                {invoice.saleId.slice(
                                                    0,
                                                    8,
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="font-medium">
                                                {invoice
                                                        .customer
                                                        ?.name ??
                                                    "—"}
                                            </div>

                                            {invoice
                                                .customer
                                                ?.phone && (
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {
                                                        invoice
                                                            .customer
                                                            .phone
                                                    }
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-muted-foreground">
                                            {formatDate(
                                                invoice.createdAt,
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                                        invoice.status,
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        invoice.status,
                                                    )}
                                                </span>
                                        </td>

                                        <td className="px-4 py-4 text-right font-medium">
                                            {formatAmount(
                                                invoice.total,
                                            )}{" "}
                                            DZD
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            <Link
                                                href={`/invoices/${invoice.id}`}
                                                className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition hover:bg-muted"
                                            >
                                                <Eye className="h-3.5 w-3.5"/>

                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ),
                            )
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading &&
                    pagination &&
                    pagination.total > 0 && (
                        <div
                            className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing{" "}
                                <span className="font-medium text-foreground">
                                    {Math.min(
                                        (pagination.page -
                                            1) *
                                        pagination.limit +
                                        1,
                                        pagination.total,
                                    )}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-foreground">
                                    {Math.min(
                                        pagination.page *
                                        pagination.limit,
                                        pagination.total,
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-foreground">
                                    {
                                        pagination.total
                                    }
                                </span>{" "}
                                invoices
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        handlePreviousPage
                                    }
                                    disabled={
                                        !pagination.hasPreviousPage
                                    }
                                    className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4"/>

                                    Previous
                                </button>

                                <span className="px-2 text-xs text-muted-foreground">
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
                                </span>

                                <button
                                    type="button"
                                    onClick={
                                        handleNextPage
                                    }
                                    disabled={
                                        !pagination.hasNextPage
                                    }
                                    className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next

                                    <ChevronRight className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}