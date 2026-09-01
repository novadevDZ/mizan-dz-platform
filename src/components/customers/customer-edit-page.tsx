"use client";

import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import CustomerForm from "./customer-form";

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
};

type ApiResponse<T> = {
    data?: T;
    message?: string;
};

export default function CustomerEditPage({
                                             id,
                                         }: {
    id: string;
}) {
    const router = useRouter();

    const [customer, setCustomer] =
        useState<Customer | null>(null);

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
                        `/api/customers/${id}`,
                        {
                            method: "GET",
                            headers: {
                                Accept:
                                    "application/json",
                            },
                            cache: "no-store",
                        },
                    );

                const result =
                    (await response.json()) as ApiResponse<Customer>;

                if (
                    response.status ===
                    404
                ) {
                    router.replace(
                        "/customers",
                    );
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        result.message ??
                        "Failed to load customer.",
                    );
                }

                if (!result.data) {
                    throw new Error(
                        "Invalid customer response.",
                    );
                }

                if (!cancelled) {
                    setCustomer(
                        result.data,
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load customer.",
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

    if (error || !customer) {
        return (
            <div className="mizan-empty">
                <p className="text-sm text-[var(--danger)]">
                    {error ??
                        "Customer not found."}
                </p>
            </div>
        );
    }

    return (
        <CustomerForm
            mode="edit"
            initialData={customer}
        />
    );
}