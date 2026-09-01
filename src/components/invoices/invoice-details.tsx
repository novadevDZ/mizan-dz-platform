"use client";

import {
    ArrowLeft,
    Calendar,
    FileText,
    Loader2,
    MapPin,
    Phone,
    Printer,
    ShieldX,
} from "lucide-react";

import Link from "next/link";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

type InvoiceStatus =
    | "draft"
    | "issued"
    | "paid"
    | "cancelled";

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
};

type InvoiceItem = {
    id: string;
    invoiceId: string;
    productId: string;
    productName: string;
    description: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
};

type Invoice = {
    id: string;
    organizationId: string;
    saleId: string;
    customerId: string;

    invoiceNumber: string;
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

    items: InvoiceItem[];
};

type Props = {
    id: string;
    canRead: boolean;
};

function formatAmount(amount: number) {
    return (
        new Intl.NumberFormat(
            "fr-DZ",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        ).format(amount) + " DZD"
    );
}

function formatDate(
    date: string | null,
) {
    if (!date) {
        return "—";
    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime(),
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "fr-DZ",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        },
    ).format(parsed);
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
            return "bg-emerald-100 text-emerald-700";

        case "issued":
            return "bg-blue-100 text-blue-700";

        case "cancelled":
            return "bg-red-100 text-red-700";

        case "draft":
        default:
            return "bg-gray-100 text-gray-700";
    }
}

export default function InvoiceDetails({
                                           id,
                                           canRead,
                                       }: Props) {
    const [invoice, setInvoice] =
        useState<Invoice | null>(
            null,
        );

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(
            null,
        );

    /*
     * =========================================================
     * UI PERMISSION
     * =========================================================
     */

    if (!canRead) {
        return (
            <div className="flex min-h-[500px] items-center justify-center px-6">
                <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                        <ShieldX className="h-6 w-6" />
                    </div>

                    <h1 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                        Access restricted
                    </h1>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--text-muted)]">
                        You do not have permission to view invoices.
                    </p>

                    <Link
                        href="/invoices"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to invoices
                    </Link>
                </div>
            </div>
        );
    }

    const fetchInvoice =
        useCallback(
            async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const response =
                        await fetch(
                            `/api/invoices/${id}`,
                            {
                                method:
                                    "GET",

                                cache:
                                    "no-store",

                                credentials:
                                    "include",

                                headers: {
                                    Accept:
                                        "application/json",
                                },
                            },
                        );

                    const result =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            typeof result?.error ===
                            "string"
                                ? result.error
                                : result?.message ??
                                "Failed to fetch invoice.",
                        );
                    }

                    setInvoice(
                        result.data ??
                        null,
                    );
                } catch (error) {
                    console.error(
                        "Failed to fetch invoice:",
                        error,
                    );

                    setError(
                        error instanceof
                        Error
                            ? error.message
                            : "Failed to fetch invoice.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            [id],
        );

    useEffect(() => {
        void fetchInvoice();
    }, [fetchInvoice]);

    /*
     * =========================================================
     * LOADING
     * =========================================================
     */

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading invoice...
                </div>
            </div>
        );
    }

    /*
     * =========================================================
     * ERROR
     * =========================================================
     */

    if (error || !invoice) {
        return (
            <div className="space-y-4 print:hidden">
                <Link
                    href="/invoices"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to invoices
                </Link>

                <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-red-400" />

                    <h2 className="mt-4 font-semibold text-red-900">
                        Unable to load invoice
                    </h2>

                    <p className="mt-1 text-sm text-red-700">
                        {error ??
                            "Invoice not found."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* =====================================================
                SCREEN ONLY
            ===================================================== */}

            <div className="space-y-6 print:hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/invoices"
                            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to invoices
                        </Link>

                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {
                                        invoice.invoiceNumber
                                    }
                                </h1>

                                <p className="text-sm text-muted-foreground">
                                    Invoice details
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            window.print()
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                        <Printer className="h-4 w-4" />
                        Print Invoice
                    </button>
                </div>
            </div>

            {/* =====================================================
                PRINTABLE INVOICE
            ===================================================== */}

            <main
                id="invoice-print"
                className="invoice-print mx-auto mt-6 w-full max-w-4xl overflow-hidden rounded-xl border bg-background shadow-sm print:mt-0 print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none"
            >
                <header className="border-b p-6 sm:p-8 print:px-0 print:py-5">
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground print:border print:border-black print:bg-white print:text-black">
                                    <FileText className="h-6 w-6" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold">
                                        INVOICE
                                    </h2>

                                    <p className="text-sm text-muted-foreground print:text-gray-600">
                                        {
                                            invoice.invoiceNumber
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-left sm:text-right">
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold print:border print:border-gray-300 print:bg-white print:text-black ${getStatusClass(
                                    invoice.status,
                                )}`}
                            >
                                {getStatusLabel(
                                    invoice.status,
                                )}
                            </span>

                            <p className="mt-2 text-sm text-muted-foreground print:text-gray-600">
                                Created{" "}
                                {formatDate(
                                    invoice.createdAt,
                                )}
                            </p>
                        </div>
                    </div>
                </header>

                <section className="grid gap-8 border-b p-6 sm:grid-cols-2 sm:p-8 print:px-0 print:py-5">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                            Bill To
                        </p>

                        <h3 className="text-base font-semibold">
                            {invoice.customer
                                    ?.name ??
                                "Unknown customer"}
                        </h3>

                        <div className="mt-3 space-y-2 text-sm text-muted-foreground print:text-gray-700">
                            {invoice.customer
                                ?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 shrink-0" />
                                    <span>
                                        {
                                            invoice.customer.phone
                                        }
                                    </span>
                                </div>
                            )}

                            {invoice.customer
                                ?.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>
                                        {
                                            invoice.customer.address
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sm:text-right">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                            Invoice Information
                        </p>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-6 sm:justify-end">
                                <span className="text-muted-foreground">
                                    Invoice:
                                </span>

                                <span className="font-medium">
                                    {
                                        invoice.invoiceNumber
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between gap-6 sm:justify-end">
                                <span className="text-muted-foreground">
                                    Issue date:
                                </span>

                                <span className="font-medium">
                                    {formatDate(
                                        invoice.issuedAt ??
                                        invoice.createdAt,
                                    )}
                                </span>
                            </div>

                            <div className="flex justify-between gap-6 sm:justify-end">
                                <span className="text-muted-foreground">
                                    Due date:
                                </span>

                                <span className="font-medium">
                                    {formatDate(
                                        invoice.dueAt,
                                    )}
                                </span>
                            </div>

                            <div className="flex justify-between gap-6 sm:justify-end">
                                <span className="text-muted-foreground">
                                    Sale:
                                </span>

                                <span className="font-mono text-xs">
                                    {invoice.saleId.slice(
                                        0,
                                        8,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="p-6 sm:p-8 print:px-0 print:py-5">
                    <div className="overflow-hidden rounded-lg border print:rounded-none">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40 print:bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">
                                    Item
                                </th>

                                <th className="px-4 py-3 text-center font-semibold">
                                    Qty
                                </th>

                                <th className="px-4 py-3 text-right font-semibold">
                                    Unit Price
                                </th>

                                <th className="px-4 py-3 text-right font-semibold">
                                    Subtotal
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y">
                            {invoice.items.map(
                                (item) => (
                                    <tr
                                        key={
                                            item.id
                                        }
                                        className="break-inside-avoid"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="font-medium">
                                                {
                                                    item.productName
                                                }
                                            </div>

                                            {item.description && (
                                                <div className="mt-1 text-xs text-muted-foreground print:text-gray-600">
                                                    {
                                                        item.description
                                                    }
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            {
                                                item.quantity
                                            }
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            {formatAmount(
                                                item.unitPrice,
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-right font-medium">
                                            {formatAmount(
                                                item.subtotal,
                                            )}
                                        </td>
                                    </tr>
                                ),
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex justify-end break-inside-avoid">
                        <div className="w-full max-w-sm space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>

                                <span>
                                    {formatAmount(
                                        invoice.subtotal,
                                    )}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Discount
                                </span>

                                <span>
                                    -
                                    {formatAmount(
                                        invoice.discount,
                                    )}
                                </span>
                            </div>

                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-semibold">
                                        Total
                                    </span>

                                    <span className="text-xl font-bold">
                                        {formatAmount(
                                            invoice.total,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {invoice.notes && (
                    <section className="break-inside-avoid border-t px-6 py-6 sm:px-8 print:px-0 print:py-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                            Notes
                        </p>

                        <p className="whitespace-pre-wrap text-sm text-muted-foreground print:text-gray-700">
                            {invoice.notes}
                        </p>
                    </section>
                )}

                <footer className="break-inside-avoid border-t px-6 py-6 sm:px-8 print:px-0 print:py-5">
                    <div className="flex flex-col gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left print:text-gray-600">
                        <span>
                            Thank you for your business.
                        </span>

                        <span className="flex items-center justify-center gap-1 sm:justify-end">
                            <Calendar className="h-3.5 w-3.5" />

                            {formatDate(
                                invoice.createdAt,
                            )}
                        </span>
                    </div>
                </footer>
            </main>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 12mm;
                    }

                    html,
                    body {
                        width: 100%;
                        min-height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }

                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #invoice-print,
                    #invoice-print * {
                        visibility: visible !important;
                    }

                    #invoice-print {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                    }

                    #invoice-print a {
                        color: inherit !important;
                        text-decoration: none !important;
                    }

                    #invoice-print tr {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    #invoice-print table {
                        width: 100%;
                        page-break-inside: auto;
                    }

                    #invoice-print thead {
                        display: table-header-group;
                    }

                    #invoice-print tfoot {
                        display: table-footer-group;
                    }

                    #invoice-print .break-inside-avoid {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }

                    #invoice-print {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </>
    );
}