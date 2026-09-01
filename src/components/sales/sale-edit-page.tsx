"use client";

import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import SaleForm from "./sale-form";

type Sale = {
    id: string;
    saleNumber: string;
    customerId: string;
    status: "draft";
    items: Array<{
        productId: string;
        quantity: number;
    }>;
};

type ApiResponse<T> = {
    data?: T;
    message?: string;
};

export default function SaleEditPage({
                                         id,
                                     }: {
    id: string;
}) {
    const router = useRouter();

    const [sale, setSale] =
        useState<Sale | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const response =
                    await fetch(
                        `/api/sales/${id}`,
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

                const result =
                    (await response.json()) as ApiResponse<
                        Sale & {
                        status:
                            | "draft"
                            | "confirmed"
                            | "canceled";
                        items: Array<{
                            productId: string;
                            quantity: number;
                        }>;
                    }
                    >;

                if (
                    response.status ===
                    404
                ) {
                    router.replace(
                        "/sales",
                    );
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        result.message ??
                        "Failed to load sale.",
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Invalid sale response.",
                    );
                }

                if (
                    result.data.status !==
                    "draft"
                ) {
                    router.replace(
                        `/sales/${id}`,
                    );
                    return;
                }

                if (!cancelled) {
                    setSale(
                        result.data,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load sale.",
                    );
                }
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

    if (loading) {
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

    if (error || !sale) {
        return (
            <div className="mizan-empty">
                <p className="text-sm text-[var(--danger)]">
                    {error ??
                        "Sale not found."}
                </p>
            </div>
        );
    }

    return (
        <SaleForm
            mode="edit"
            initialData={{
                id: sale.id,
                saleNumber:
                sale.saleNumber,
                customerId:
                sale.customerId,
                status: "draft",
                items: sale.items.map(
                    (item) => ({
                        productId:
                        item.productId,
                        quantity:
                        item.quantity,
                    }),
                ),
            }}
        />
    );
}