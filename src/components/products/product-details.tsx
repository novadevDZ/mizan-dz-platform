"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Archive,
    CalendarDays,
    Edit3,
    Package,
    Tag,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";
import {useRouter} from "next/navigation";

import {useConfirm} from "@/src/components/dashboard/confirm-provider";

type Product = {
    id: string;
    organizationId?: string;
    name: string;
    sku: string | null;
    description: string | null;
    purchasePrice: string;
    sellingPrice: string;
    stockQuantity: number;
    createdAt: string;
    updatedAt: string;
};

type ApiResponse<T = unknown> = {
    success?: boolean;
    data?: T;
    message?: string;
    error?: {
        message?: string;
    } | string;
};

export default function ProductDetails({
                                           id,
                                       }: {
    id: string;
}) {
    const router = useRouter();
    const confirm = useConfirm();

    const [product, setProduct] =
        useState<Product | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [archiving, setArchiving] =
        useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const response = await fetch(
                    `/api/products/${id}`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                        },
                        cache: "no-store",
                    },
                );

                const raw = await response.text();

                let result: ApiResponse<Product> = {};

                if (raw.trim()) {
                    try {
                        result = JSON.parse(raw);
                    } catch {
                        throw new Error(
                            "The server returned an invalid response.",
                        );
                    }
                }

                if (response.status === 404) {
                    router.replace("/products");
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        getApiErrorMessage(
                            result,
                            "Failed to load product.",
                        ),
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Product data was not returned by the server.",
                    );
                }

                if (!cancelled) {
                    setProduct(result.data);
                }
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("[ProductDetails]", err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load product.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [id, router]);

    async function handleArchive() {
        if (!product || archiving) {
            return;
        }

        const confirmed = await confirm({
            variant: "danger",
            destructive: true,
            title: "Archive this product?",
            description: `"${product.name}" will be removed from the active products list but kept in your records.`,
            confirmLabel: "Archive product",
            cancelLabel: "Keep product",
        });

        if (!confirmed) {
            return;
        }

        setArchiving(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/products/${product.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                },
            );

            const result =
                (await response.json()) as ApiResponse;

            if (!response.ok) {
                throw new Error(
                    getApiErrorMessage(
                        result,
                        "Failed to archive product.",
                    ),
                );
            }

            router.replace("/products");
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to archive product.",
            );
        } finally {
            setArchiving(false);
        }
    }

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
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="mizan-empty">
                <p className="text-sm font-semibold text-[var(--danger)]">
                    {error ?? "Product not found."}
                </p>

                <Link
                    href="/products"
                    className="mizan-primary-action mt-5"
                >
                    <ArrowLeft className="h-4 w-4"/>

                    <span className="ml-2">
                        Back to products
                    </span>
                </Link>
            </div>
        );
    }

    return (
        <div className="mizan-page-enter space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href="/products"
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5"/>
                        Products
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <ProductAvatar name={product.name}/>

                        <div className="min-w-0">
                            <h1 className="mizan-page-title">
                                {product.name}
                            </h1>

                            <p className="mt-1 break-all text-xs text-[var(--text-muted)]">
                                Product ID: {product.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Link
                        href={`/products/${product.id}/inventory`}
                        className="mizan-primary-action"
                    >
                        <Package className="h-4 w-4"/>

                        <span className="ml-2">
                            Inventory
                        </span>
                    </Link>

                    <Link
                        href={`/products/${product.id}/edit`}
                        className="mizan-ghost-action"
                    >
                        <Edit3 className="h-4 w-4"/>

                        <span className="ml-2">
                            Edit
                        </span>
                    </Link>

                    <button
                        type="button"
                        disabled={archiving}
                        onClick={handleArchive}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 text-xs font-semibold text-[var(--danger)] transition hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Archive className="h-4 w-4"/>

                        <span className="ml-2">
                            {archiving
                                ? "Archiving..."
                                : "Archive"}
                        </span>
                    </button>
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
                <section className="mizan-dashboard-section">
                    <div className="mizan-dashboard-section-header">
                        <div>
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                Product information
                            </h2>

                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Pricing, SKU, and inventory.
                            </p>
                        </div>

                        <Package className="h-4 w-4 text-[var(--text-muted)]"/>
                    </div>

                    <div className="mizan-dashboard-section-body grid gap-5 sm:grid-cols-2">
                        <InfoItem
                            icon={Tag}
                            label="SKU"
                            value={product.sku || "Not provided"}
                        />

                        <InfoItem
                            icon={Package}
                            label="Stock"
                            value={`${product.stockQuantity}`}
                        />

                        <InfoItem
                            icon={Tag}
                            label="Purchase price"
                            value={formatMoney(
                                product.purchasePrice,
                            )}
                        />

                        <InfoItem
                            icon={Tag}
                            label="Selling price"
                            value={formatMoney(
                                product.sellingPrice,
                            )}
                        />

                        <InfoItem
                            icon={CalendarDays}
                            label="Created"
                            value={formatDateTime(
                                product.createdAt,
                            )}
                        />

                        <InfoItem
                            icon={CalendarDays}
                            label="Last updated"
                            value={formatDateTime(
                                product.updatedAt,
                            )}
                        />
                    </div>
                </section>

                <section className="mizan-dashboard-section">
                    <div className="mizan-dashboard-section-header">
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">
                            Description
                        </h2>
                    </div>

                    <div className="mizan-dashboard-section-body">
                        {product.description ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-secondary)]">
                                {product.description}
                            </p>
                        ) : (
                            <p className="text-sm text-[var(--text-muted)]">
                                No description has been added.
                            </p>
                        )}
                    </div>
                </section>
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

function ProductAvatar({
                           name,
                       }: {
    name: string;
}) {
    const initials =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "P";

    return (
        <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-sm font-bold text-[var(--primary)]">
            {initials}
        </div>
    );
}

function getApiErrorMessage(
    result: ApiResponse,
    fallback: string,
) {
    if (typeof result.error === "string") {
        return result.error;
    }

    if (
        result.error &&
        typeof result.error === "object" &&
        typeof result.error.message === "string"
    ) {
        return result.error.message;
    }

    if (typeof result.message === "string") {
        return result.message;
    }

    return fallback;
}

function formatMoney(value: string) {
    return new Intl.NumberFormat("en-DZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-DZ", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}