"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Plus,
    Receipt,
    Save,
    Trash2,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

type Customer = {
    id: string;
    name: string;
};

type Product = {
    id: string;
    name: string;
    sku: string | null;
    sellingPrice: string;
    stockQuantity: number;
};

type SaleItem = {
    productId: string;
    quantity: number;
};

type SaleStatus =
    | "draft"
    | "confirmed";

type SaleFormProps = {
    mode: "create" | "edit";

    initialData?: {
        id: string;
        saleNumber: string;
        customerId: string;
        status: "draft";
        dueAt?: string | null;
        items: Array<{
            productId: string;
            quantity: number;
        }>;
    };
};

type ListResponse<T> = {
    data?: {
        items: T[];
    };
    message?: string;
};

type SaleCreateResponse = {
    sale: {
        id: string;
        organizationId: string;
        customerId: string;
        saleNumber: string;
        status: SaleStatus;
        totalAmount: string;
        createdAt: string;
        updatedAt: string;
    };

    invoice: {
        id: string;
        organizationId: string;
        saleId: string;
        customerId: string;
        invoiceNumber: string;
        status: string;
        issuedAt: string | null;
        dueAt: string | null;
        subtotal: string;
        discount: string;
        total: string;
        notes: string | null;
        createdAt: string;
        updatedAt: string;
    };

    total: string;
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

function toNumber(
    value:
        | string
        | number
        | null
        | undefined,
) {
    const parsed =
        Number(value);

    return Number.isFinite(
        parsed,
    )
        ? parsed
        : 0;
}

function roundMoney(
    value: number,
) {
    return (
        Math.round(
            (value +
                Number.EPSILON) *
            100,
        ) / 100
    );
}

function formatMoney(
    value:
        | number
        | string,
) {
    return (
        new Intl.NumberFormat(
            "fr-DZ",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            },
        ).format(
            toNumber(value),
        ) + " DZD"
    );
}

function generateSaleNumber() {
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1,
        ).padStart(2, "0");

    const day =
        String(
            now.getDate(),
        ).padStart(2, "0");

    const random =
        Math.floor(
            1000 +
            Math.random() *
            9000,
        );

    return `SALE-${year}${month}${day}-${random}`;
}

/**
 * Returns today's date in the format
 * required by <input type="date">.
 *
 * Example:
 * 2026-08-20
 */
function getTodayDateInputValue() {
    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1,
        ).padStart(2, "0");

    const day =
        String(
            date.getDate(),
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * Converts a date input value:
 *
 * YYYY-MM-DD
 *
 * into an ISO timestamp representing
 * the end of that local day.
 *
 * Example:
 * 2026-09-19
 *
 * -> 2026-09-19T22:59:59.999Z
 *
 * depending on the local timezone.
 */
function dateInputToISO(
    value: string,
): string | null {
    if (!value) {
        return null;
    }

    const parts =
        value
            .split("-")
            .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(
            (part) =>
                !Number.isFinite(
                    part,
                ),
        )
    ) {
        return null;
    }

    const [
        year,
        month,
        day,
    ] = parts;

    const date =
        new Date(
            year,
            month - 1,
            day,
            23,
            59,
            59,
            999,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return null;
    }

    return date.toISOString();
}

/**
 * Converts an existing ISO dueAt
 * into YYYY-MM-DD for <input type="date">.
 */
function isoToDateInputValue(
    dueAt?: string | null,
): string {
    if (!dueAt) {
        return "";
    }

    const date =
        new Date(dueAt);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1,
        ).padStart(2, "0");

    const day =
        String(
            date.getDate(),
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDueDate(
    dueAt:
        | string
        | null,
) {
    if (!dueAt) {
        return "No due date";
    }

    const date =
        new Date(dueAt);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "No due date";
    }

    return new Intl.DateTimeFormat(
        "fr-DZ",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        },
    ).format(date);
}

export default function SaleForm({
                                     mode,
                                     initialData,
                                 }: SaleFormProps) {
    const router =
        useRouter();

    /*
     * ----------------------------------------------------------
     * Form state
     * ----------------------------------------------------------
     */

    const [
        saleNumber,
        setSaleNumber,
    ] = useState(
        initialData?.saleNumber ??
        (mode === "create"
            ? generateSaleNumber()
            : ""),
    );

    const [
        customerId,
        setCustomerId,
    ] = useState(
        initialData?.customerId ??
        "",
    );

    /**
     * Date shown in the date input.
     *
     * Create:
     * today's date by default.
     *
     * Edit:
     * existing invoice dueAt.
     */
    const [
        dueDate,
        setDueDate,
    ] = useState(
        initialData?.dueAt
            ? isoToDateInputValue(
                initialData.dueAt,
            )
            : getTodayDateInputValue(),
    );

    const [
        customers,
        setCustomers,
    ] = useState<Customer[]>(
        [],
    );

    const [
        products,
        setProducts,
    ] = useState<Product[]>(
        [],
    );

    const [
        items,
        setItems,
    ] = useState<SaleItem[]>(
        initialData?.items ??
        [
            {
                productId: "",
                quantity: 1,
            },
        ],
    );

    const [
        loadingData,
        setLoadingData,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<
        string | null
    >(null);

    const [
        createdResult,
        setCreatedResult,
    ] =
        useState<SaleCreateResponse | null>(
            null,
        );

    /*
     * ----------------------------------------------------------
     * Due date
     * ----------------------------------------------------------
     */

    const dueAt =
        useMemo(
            () =>
                dateInputToISO(
                    dueDate,
                ),
            [dueDate],
        );

    /*
     * ----------------------------------------------------------
     * Load customers + products
     * ----------------------------------------------------------
     */

    useEffect(() => {
        let cancelled =
            false;

        async function loadData() {
            setLoadingData(
                true,
            );

            setError(null);

            try {
                const [
                    customersResponse,
                    productsResponse,
                ] =
                    await Promise.all([
                        fetch(
                            "/api/customers?page=1&limit=100",
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
                        ),

                        fetch(
                            "/api/products?page=1&limit=100",
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
                        ),
                    ]);

                const customersRaw =
                    await customersResponse.text();

                const productsRaw =
                    await productsResponse.text();

                let customersResult:
                    ListResponse<Customer> =
                    {};

                let productsResult:
                    ListResponse<Product> =
                    {};

                if (
                    customersRaw.trim()
                ) {
                    customersResult =
                        JSON.parse(
                            customersRaw,
                        );
                }

                if (
                    productsRaw.trim()
                ) {
                    productsResult =
                        JSON.parse(
                            productsRaw,
                        );
                }

                if (
                    !customersResponse.ok
                ) {
                    throw new Error(
                        customersResult.message ??
                        "Failed to load customers.",
                    );
                }

                if (
                    !productsResponse.ok
                ) {
                    throw new Error(
                        productsResult.message ??
                        "Failed to load products.",
                    );
                }

                if (
                    cancelled
                ) {
                    return;
                }

                setCustomers(
                    customersResult.data
                        ?.items ??
                    [],
                );

                setProducts(
                    productsResult.data
                        ?.items ??
                    [],
                );
            } catch (err) {
                if (
                    cancelled
                ) {
                    return;
                }

                console.error(
                    "[SaleForm load]",
                    err,
                );

                setError(
                    err instanceof
                    Error
                        ? err.message
                        : "Failed to load sale data.",
                );
            } finally {
                if (
                    !cancelled
                ) {
                    setLoadingData(
                        false,
                    );
                }
            }
        }

        void loadData();

        return () => {
            cancelled = true;
        };
    }, []);

    /*
     * ----------------------------------------------------------
     * Calculate total
     * ----------------------------------------------------------
     */

    const total =
        useMemo(() => {
            return roundMoney(
                items.reduce(
                    (
                        sum,
                        item,
                    ) => {
                        const product =
                            products.find(
                                (
                                    candidate,
                                ) =>
                                    candidate.id ===
                                    item.productId,
                            );

                        if (
                            !product
                        ) {
                            return sum;
                        }

                        return (
                            sum +
                            toNumber(
                                product.sellingPrice,
                            ) *
                            item.quantity
                        );
                    },
                    0,
                ),
            );
        }, [
            items,
            products,
        ]);

    /*
     * ----------------------------------------------------------
     * Item operations
     * ----------------------------------------------------------
     */

    function updateItem(
        index: number,
        patch: Partial<SaleItem>,
    ) {
        setItems(
            (current) =>
                current.map(
                    (
                        item,
                        itemIndex,
                    ) =>
                        itemIndex ===
                        index
                            ? {
                                ...item,
                                ...patch,
                            }
                            : item,
                ),
        );
    }

    function addItem() {
        setItems(
            (current) => [
                ...current,
                {
                    productId: "",
                    quantity: 1,
                },
            ],
        );
    }

    function removeItem(
        index: number,
    ) {
        setItems(
            (current) =>
                current.filter(
                    (
                        _,
                        itemIndex,
                    ) =>
                        itemIndex !==
                        index,
                ),
        );
    }

    /*
     * ----------------------------------------------------------
     * Save
     * ----------------------------------------------------------
     */

    async function save(
        status: SaleStatus,
    ) {
        if (saving) {
            return;
        }

        setError(null);

        /*
         * Basic validation
         */

        if (
            !saleNumber.trim()
        ) {
            setError(
                "Sale number is required.",
            );
            return;
        }

        if (!customerId) {
            setError(
                "Please select a customer.",
            );
            return;
        }

        if (
            items.length === 0
        ) {
            setError(
                "Add at least one product.",
            );
            return;
        }

        /*
         * Due date validation
         */

        if (!dueDate) {
            setError(
                "Please select a payment due date.",
            );
            return;
        }

        const calculatedDueAt =
            dateInputToISO(
                dueDate,
            );

        if (!calculatedDueAt) {
            setError(
                "The selected payment due date is invalid.",
            );
            return;
        }

        /*
         * Validate items
         */

        const invalidItem =
            items.find(
                (item) =>
                    !item.productId ||
                    !Number.isInteger(
                        item.quantity,
                    ) ||
                    item.quantity <= 0,
            );

        if (
            invalidItem
        ) {
            setError(
                "Every sale item must have a valid product and quantity.",
            );
            return;
        }

        /*
         * Prevent duplicate products
         */

        const productIds =
            new Set<string>();

        for (
            const item of items
            ) {
            if (
                productIds.has(
                    item.productId,
                )
            ) {
                setError(
                    "A product cannot appear more than once in the same sale.",
                );
                return;
            }

            productIds.add(
                item.productId,
            );

            /*
             * Stock validation only when
             * confirming the sale.
             */

            if (
                status ===
                "confirmed"
            ) {
                const product =
                    products.find(
                        (
                            candidate,
                        ) =>
                            candidate.id ===
                            item.productId,
                    );

                if (!product) {
                    setError(
                        "One or more selected products no longer exist.",
                    );
                    return;
                }

                const available =
                    toNumber(
                        product.stockQuantity,
                    );

                if (
                    item.quantity >
                    available
                ) {
                    setError(
                        `${product.name} does not have enough stock. Available: ${available}.`,
                    );
                    return;
                }
            }
        }

        /*
         * ----------------------------------------------------------
         * API request
         * ----------------------------------------------------------
         */

        setSaving(true);

        try {
            const endpoint =
                mode === "create"
                    ? "/api/sales"
                    : `/api/sales/${initialData?.id}`;

            const method =
                mode === "create"
                    ? "POST"
                    : "PATCH";

            const body =
                mode === "create"
                    ? {
                        saleNumber:
                            saleNumber.trim(),

                        customerId,

                        status,

                        items,

                        dueAt:
                        calculatedDueAt,
                    }
                    : {
                        saleNumber:
                            saleNumber.trim(),

                        customerId,

                        items,

                        dueAt:
                        calculatedDueAt,
                    };

            const response =
                await fetch(
                    endpoint,
                    {
                        method,
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },
                        body:
                            JSON.stringify(
                                body,
                            ),
                    },
                );

            const raw =
                await response.text();

            let result:
                ApiResponse<SaleCreateResponse> =
                {};

            if (
                raw.trim()
            ) {
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
                !response.ok
            ) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        "Failed to save sale.",
                    ),
                );
            }

            /*
             * ------------------------------------------------------
             * CREATE
             * ------------------------------------------------------
             */

            if (
                mode === "create"
            ) {
                const created =
                    result.data;

                if (
                    !created?.sale
                        ?.id
                ) {
                    throw new Error(
                        "Sale was created but no sale ID was returned.",
                    );
                }

                if (
                    !created
                        ?.invoice
                        ?.id
                ) {
                    throw new Error(
                        "Sale was created but no invoice was returned.",
                    );
                }

                setCreatedResult(
                    created,
                );

                return;
            }

            /*
             * ------------------------------------------------------
             * EDIT
             * ------------------------------------------------------
             */

            const updatedSaleId =
                result.data &&
                typeof result.data ===
                "object" &&
                "sale" in
                result.data
                    ? (
                        result.data as {
                            sale?: {
                                id?: string;
                            };
                        }
                    ).sale?.id
                    : (
                        result.data as {
                            id?: string;
                        } | undefined
                    )?.id;

            router.push(
                updatedSaleId
                    ? `/sales/${updatedSaleId}`
                    : initialData?.id
                        ? `/sales/${initialData.id}`
                        : "/sales",
            );

            router.refresh();
        } catch (err) {
            console.error(
                "[SaleForm]",
                err,
            );

            setError(
                err instanceof
                Error
                    ? err.message
                    : "Failed to save sale.",
            );
        } finally {
            setSaving(false);
        }
    }

    /*
     * ----------------------------------------------------------
     * Success screen
     * ----------------------------------------------------------
     */

    if (
        createdResult
    ) {
        return (
            <div className="mizan-page-enter mx-auto max-w-2xl">
                <section className="mizan-card p-8 text-center sm:p-10">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>

                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                        Sale created
                    </p>

                    <h1 className="mt-2 text-2xl font-black text-[var(--text-primary)]">
                        {
                            createdResult
                                .sale
                                .saleNumber
                        }
                    </h1>

                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        The sale and invoice were created successfully.
                    </p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                            <p className="text-[11px] text-[var(--text-muted)]">
                                Total
                            </p>

                            <p className="mt-1 text-lg font-black text-[var(--text-primary)]">
                                {formatMoney(
                                    createdResult.total,
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                            <p className="text-[11px] text-[var(--text-muted)]">
                                Invoice
                            </p>

                            <p className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]">
                                {
                                    createdResult
                                        .invoice
                                        .invoiceNumber
                                }
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                            <p className="text-[11px] text-[var(--text-muted)]">
                                Due date
                            </p>

                            <p className="mt-1 text-sm font-bold text-[var(--primary)]">
                                {formatDueDate(
                                    createdResult
                                        .invoice
                                        .dueAt,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <Link
                            href={`/sales/${createdResult.sale.id}`}
                            className="mizan-ghost-action"
                        >
                            <Receipt className="h-4 w-4" />

                            <span className="ml-2">
                                View sale
                            </span>
                        </Link>

                        <Link
                            href={`/invoices/${createdResult.invoice.id}`}
                            className="mizan-primary-action"
                        >
                            <Receipt className="h-4 w-4" />

                            <span className="ml-2">
                                View invoice
                            </span>
                        </Link>

                        <Link
                            href="/sales/new"
                            className="mizan-ghost-action"
                        >
                            <Plus className="h-4 w-4" />

                            <span className="ml-2">
                                New sale
                            </span>
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    /*
     * ----------------------------------------------------------
     * Loading
     * ----------------------------------------------------------
     */

    if (
        loadingData
    ) {
        return (
            <div className="mizan-card p-6">
                <div className="space-y-4">
                    <div className="mizan-skeleton h-6 w-48 rounded" />

                    <div className="mizan-skeleton h-10 w-full rounded" />

                    <div className="mizan-skeleton h-10 w-full rounded" />

                    <div className="mizan-skeleton h-32 w-full rounded" />
                </div>
            </div>
        );
    }

    /*
     * ----------------------------------------------------------
     * Form
     * ----------------------------------------------------------
     */

    return (
        <div className="mizan-page-enter mx-auto max-w-5xl space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href={
                            mode ===
                            "edit" &&
                            initialData?.id
                                ? `/sales/${initialData.id}`
                                : "/sales"
                        }
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />

                        Back to sales
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                            <Receipt className="h-5 w-5" />
                        </div>

                        <div>
                            <h1 className="mizan-page-title">
                                {mode ===
                                "create"
                                    ? "New sale"
                                    : "Edit sale"}
                            </h1>

                            <p className="mizan-page-description">
                                {mode ===
                                "create"
                                    ? "Create a draft or confirm a new sale."
                                    : "Update this draft sale before confirmation."}
                            </p>
                        </div>
                    </div>
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

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="mizan-card p-5 sm:p-7">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="sale-number"
                                className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                            >
                                Sale number
                            </label>

                            <input
                                id="sale-number"
                                value={
                                    saleNumber
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSaleNumber(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="e.g. SALE-0001"
                                maxLength={50}
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="sale-customer"
                                className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                            >
                                Customer
                            </label>

                            <select
                                id="sale-customer"
                                value={
                                    customerId
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCustomerId(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                required
                            >
                                <option value="">
                                    Select customer
                                </option>

                                {customers.map(
                                    (
                                        customer,
                                    ) => (
                                        <option
                                            key={
                                                customer.id
                                            }
                                            value={
                                                customer.id
                                            }
                                        >
                                            {
                                                customer.name
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    </div>

                    {/* ------------------------------------------------
                        Payment due date
                    ------------------------------------------------- */}

                    <div className="mt-5">
                        <label
                            htmlFor="sale-due-date"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Payment due date
                        </label>

                        <input
                            id="sale-due-date"
                            type="date"
                            value={
                                dueDate
                            }
                            min={
                                mode ===
                                "create"
                                    ? getTodayDateInputValue()
                                    : undefined
                            }
                            onChange={(
                                event,
                            ) =>
                                setDueDate(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            required
                        />

                        <div className="mt-2 rounded-lg bg-[var(--surface-secondary)] px-3 py-2">
                            <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                                {dueAt
                                    ? `Invoice due date: ${formatDueDate(dueAt)}`
                                    : "No payment due date selected."}
                            </p>
                        </div>
                    </div>

                    <div className="mt-7 border-t border-[var(--border-soft)] pt-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                    Sale items
                                </h2>

                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Select products and quantities.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    addItem
                                }
                                className="mizan-ghost-action"
                            >
                                <Plus className="h-4 w-4" />

                                <span className="ml-2">
                                    Add item
                                </span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map(
                                (
                                    item,
                                    index,
                                ) => {
                                    const product =
                                        products.find(
                                            (
                                                candidate,
                                            ) =>
                                                candidate.id ===
                                                item.productId,
                                        );

                                    return (
                                        <div
                                            key={
                                                index
                                            }
                                            className="rounded-xl border border-[var(--border-soft)] p-4"
                                        >
                                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
                                                <div>
                                                    <label
                                                        className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]"
                                                        htmlFor={`sale-product-${index}`}
                                                    >
                                                        Product
                                                    </label>

                                                    <select
                                                        id={`sale-product-${index}`}
                                                        value={
                                                            item.productId
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateItem(
                                                                index,
                                                                {
                                                                    productId:
                                                                    event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Select product
                                                        </option>

                                                        {products.map(
                                                            (
                                                                candidate,
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        candidate.id
                                                                    }
                                                                    value={
                                                                        candidate.id
                                                                    }
                                                                >
                                                                    {
                                                                        candidate.name
                                                                    }{" "}
                                                                    —{" "}
                                                                    {formatMoney(
                                                                        candidate.sellingPrice,
                                                                    )}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>

                                                    {product ? (
                                                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                                                            Stock:{" "}
                                                            {
                                                                product.stockQuantity
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <div>
                                                    <label
                                                        className="mb-2 block text-[11px] font-semibold text-[var(--text-muted)]"
                                                        htmlFor={`sale-quantity-${index}`}
                                                    >
                                                        Quantity
                                                    </label>

                                                    <input
                                                        id={`sale-quantity-${index}`}
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={
                                                            item.quantity
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            updateItem(
                                                                index,
                                                                {
                                                                    quantity:
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="flex items-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeItem(
                                                                index,
                                                            )
                                                        }
                                                        disabled={
                                                            items.length ===
                                                            1
                                                        }
                                                        className="mizan-ghost-action text-[var(--danger)] disabled:opacity-40"
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {product ? (
                                                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-soft)] pt-3 text-xs">
                                                    <span className="text-[var(--text-muted)]">
                                                        Subtotal
                                                    </span>

                                                    <span className="font-bold text-[var(--text-primary)]">
                                                        {formatMoney(
                                                            toNumber(
                                                                product.sellingPrice,
                                                            ) *
                                                            item.quantity,
                                                        )}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </section>

                {/* ----------------------------------------------------
                    Summary
                ----------------------------------------------------- */}

                <aside className="mizan-card h-fit p-5 sm:p-6 lg:sticky lg:top-6">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-[var(--primary)]" />

                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            Sale summary
                        </h2>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">
                                Items
                            </span>

                            <span className="font-semibold text-[var(--text-primary)]">
                                {
                                    items.length
                                }
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">
                                Quantity
                            </span>

                            <span className="font-semibold text-[var(--text-primary)]">
                                {items.reduce(
                                    (
                                        sum,
                                        item,
                                    ) =>
                                        sum +
                                        item.quantity,
                                    0,
                                )}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-muted)]">
                                Payment due
                            </span>

                            <span className="max-w-[120px] text-right text-xs font-semibold text-[var(--primary)]">
                                {dueAt
                                    ? formatDueDate(
                                        dueAt,
                                    )
                                    : "No due date"}
                            </span>
                        </div>

                        <div className="border-t border-[var(--border-soft)] pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[var(--text-primary)]">
                                    Total
                                </span>

                                <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                                    {formatMoney(
                                        total,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <button
                            type="button"
                            disabled={
                                saving
                            }
                            onClick={() =>
                                void save(
                                    "draft",
                                )
                            }
                            className="mizan-ghost-action w-full justify-center disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}

                            <span className="ml-2">
                                Save draft
                            </span>
                        </button>

                        {mode ===
                        "create" ? (
                            <button
                                type="button"
                                disabled={
                                    saving
                                }
                                onClick={() =>
                                    void save(
                                        "confirmed",
                                    )
                                }
                                className="mizan-primary-action w-full justify-center disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}

                                <span className="ml-2">
                                    Confirm sale
                                </span>
                            </button>
                        ) : null}
                    </div>

                    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                        <div className="flex items-start gap-2">
                            <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />

                            <p className="text-[11px] leading-5 text-[var(--text-muted)]">
                                The selected payment due date is saved directly on the generated invoice. Confirmed sales issue the invoice automatically and decrease stock.
                            </p>
                        </div>
                    </div>

                    <Link
                        href={
                            mode ===
                            "edit" &&
                            initialData?.id
                                ? `/sales/${initialData.id}`
                                : "/sales"
                        }
                        className="mt-2 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                    >
                        Cancel
                    </Link>
                </aside>
            </div>
        </div>
    );
}