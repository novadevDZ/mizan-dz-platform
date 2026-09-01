"use client";

import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import ProductForm from "./product-form";

type Product = {
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
    purchasePrice: string;
    sellingPrice: string;
    stockQuantity: number;
};

type ApiResponse<T> = {
    data?: T;
    message?: string;
};

export default function ProductEditPage({
                                            id,
                                        }: {
    id: string;
}) {
    const router = useRouter();

    const [product, setProduct] =
        useState<Product | null>(null);

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
                        `/api/products/${id}`,
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
                    (await response.json()) as ApiResponse<Product>;

                if (
                    response.status ===
                    404
                ) {
                    router.replace(
                        "/products",
                    );
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        result.message ??
                        "Failed to load product.",
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Invalid product response.",
                    );
                }

                if (!cancelled) {
                    setProduct(
                        result.data,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load product.",
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
                    <div className="mizan-skeleton h-24 w-full rounded" />
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="mizan-empty">
                <p className="text-sm text-[var(--danger)]">
                    {error ??
                        "Product not found."}
                </p>
            </div>
        );
    }

    return (
        <ProductForm
            mode="edit"
            initialData={product}
        />
    );
}