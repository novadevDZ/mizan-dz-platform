"use client";

import Link from "next/link";
import {
    ArrowLeft,
    Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PaymentEditPage({
                                            id,
                                        }: {
    id: string;
}) {
    const router = useRouter();

    useEffect(() => {
        router.replace(
            `/payments/${id}`,
        );
    }, [id, router]);

    return (
        <div className="mizan-page-enter space-y-6">
            <section className="mizan-page-header">
                <div className="min-w-0">
                    <Link
                        href={`/payments/${id}`}
                        className="inline-flex items-center text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                    >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                        Back to payment
                    </Link>

                    <div className="mt-3 flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                            <Receipt className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <h1 className="mizan-page-title">
                                Payment
                            </h1>

                            <p className="mizan-page-description">
                                Payment records are
                                read-only after creation.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mizan-card p-6">
                <div className="mizan-empty min-h-[260px]">
                    <div className="mizan-empty-icon">
                        <Receipt className="h-5 w-5" />
                    </div>

                    <h2 className="mt-3 text-lg font-bold text-[var(--text-primary)]">
                        Payment records are read-only
                    </h2>

                    <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
                        Payments cannot be edited after
                        they are recorded.
                    </p>

                    <Link
                        href={`/payments/${id}`}
                        className="mizan-primary-action mt-5"
                    >
                        <Receipt className="h-4 w-4" />

                        <span className="ml-2">
                            View payment
                        </span>
                    </Link>
                </div>
            </section>
        </div>
    );
}