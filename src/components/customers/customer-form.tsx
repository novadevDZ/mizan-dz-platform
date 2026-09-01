"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Loader2,
    Save,
} from "lucide-react";
import {
    useState,
} from "react";

type CustomerFormProps = {
    mode: "create" | "edit";

    initialData?: {
        id?: string;
        name: string;
        phone: string | null;
        address: string | null;
        notes: string | null;
    };
};

export default function CustomerForm({
                                         mode,
                                         initialData,
                                     }: CustomerFormProps) {
    const router = useRouter();

    const [name, setName] =
        useState(
            initialData?.name ?? "",
        );

    const [phone, setPhone] =
        useState(
            initialData?.phone ?? "",
        );

    const [address, setAddress] =
        useState(
            initialData?.address ?? "",
        );

    const [notes, setNotes] =
        useState(
            initialData?.notes ?? "",
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const trimmedName =
            name.trim();

        if (!trimmedName) {
            setError(
                "Customer name is required.",
            );
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const endpoint =
                mode === "create"
                    ? "/api/customers"
                    : `/api/customers/${initialData?.id}`;

            const method =
                mode === "create"
                    ? "POST"
                    : "PATCH";

            const response =
                await fetch(endpoint, {
                    method,
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json",
                    },
                    body: JSON.stringify({
                        name: trimmedName,
                        phone:
                            phone.trim() ||
                            null,
                        address:
                            address.trim() ||
                            null,
                        notes:
                            notes.trim() ||
                            null,
                    }),
                });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ??
                    "Failed to save customer.",
                );
            }

            router.push(
                mode === "create"
                    ? "/customers"
                    : `/customers/${initialData?.id}`,
            );

            router.refresh();
        } catch (err) {
            console.error(
                "[CustomerForm]",
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save customer.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mizan-page-enter mx-auto max-w-3xl space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href={
                            mode === "edit" &&
                            initialData?.id
                                ? `/customers/${initialData.id}`
                                : "/customers"
                        }
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                        Back to customers
                    </Link>

                    <h1 className="mizan-page-title mt-3">
                        {mode === "create"
                            ? "New customer"
                            : "Edit customer"}
                    </h1>

                    <p className="mizan-page-description">
                        {mode === "create"
                            ? "Add a customer to your Mizan workspace."
                            : "Update this customer's business information."}
                    </p>
                </div>
            </section>

            <form
                onSubmit={handleSubmit}
                className="mizan-card p-5 sm:p-7"
            >
                {error ? (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
                    >
                        {error}
                    </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label
                            htmlFor="customer-name"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Customer name
                        </label>

                        <input
                            id="customer-name"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="e.g. Ahmed Benali"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="customer-phone"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Phone
                        </label>

                        <input
                            id="customer-phone"
                            type="tel"
                            value={phone}
                            onChange={(event) =>
                                setPhone(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="0555 00 00 00"
                            autoComplete="tel"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="customer-address"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Address
                        </label>

                        <input
                            id="customer-address"
                            value={address}
                            onChange={(event) =>
                                setAddress(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Customer address"
                            autoComplete="street-address"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="customer-notes"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Notes
                        </label>

                        <textarea
                            id="customer-notes"
                            value={notes}
                            onChange={(event) =>
                                setNotes(
                                    event.target
                                        .value,
                                )
                            }
                            rows={5}
                            placeholder="Internal notes about this customer..."
                        />
                    </div>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-2 border-t border-[var(--border-soft)] pt-5 sm:flex-row sm:justify-end">
                    <Link
                        href={
                            mode === "edit" &&
                            initialData?.id
                                ? `/customers/${initialData.id}`
                                : "/customers"
                        }
                        className="mizan-ghost-action"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mizan-primary-action"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        <span className="ml-2">
                            {loading
                                ? "Saving..."
                                : mode ===
                                "create"
                                    ? "Create customer"
                                    : "Save changes"}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}