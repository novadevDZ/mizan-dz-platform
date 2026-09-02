"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

function Logo() {
    return (
        <Link
            href="/"
            aria-label="Mizan home"
            className="inline-flex items-center gap-3"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.18)]">
                M
            </span>

            <div className="leading-none">
                <div className="text-[17px] font-bold tracking-tight text-[var(--text-primary)]">
                    Mizan
                </div>

                <div className="mt-1 text-[10px] font-medium text-[var(--text-muted)]">
                    Business Management
                </div>
            </div>
        </Link>
    );
}

export default function HomePage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <header className="relative z-20 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Logo />

                    <Link
                        href="/login"
                        className="mizan-ghost-action"
                    >
                        Sign in
                    </Link>
                </div>
            </header>

            <section className="relative flex min-h-[calc(100vh-var(--header-height))] items-center justify-center overflow-hidden px-4 text-center sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(37,99,235,0.06)] blur-3xl sm:h-[38rem] sm:w-[38rem]" />

                <div className="relative z-10 mx-auto w-full max-w-4xl py-20 sm:py-28 lg:py-32">
                    <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--mizan-blue-muted)] bg-[var(--mizan-blue-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--primary)]">
                        <Check className="h-3.5 w-3.5" />
                        Built for Algerian businesses
                    </div>

                    <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
                        Run your business.
                        <span className="block text-[var(--primary)]">
                            Simply.
                        </span>
                    </h1>

                    <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                        Mizan gives you one simple place to manage your sales,
                        stock, customers, payments, and daily business
                        operations.
                    </p>

                    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/register"
                            className="mizan-primary-action min-h-12 w-full justify-center rounded-xl px-7 sm:w-auto"
                        >
                            Get started
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>

                        <Link
                            href="/login"
                            className="mizan-ghost-action min-h-12 w-full justify-center rounded-xl px-7 sm:w-auto"
                        >
                            Sign in
                        </Link>
                    </div>

                    <p className="mt-6 text-xs text-[var(--text-muted)]">
                        Start organizing your business with Mizan.
                    </p>
                </div>
            </section>

            <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
                    <p className="text-xs text-[var(--text-muted)]">
                        © 2026 Mizan. All rights reserved.
                    </p>

                    <p className="text-xs text-[var(--text-muted)]">
                        Business management made simple.
                    </p>
                </div>
            </footer>
        </main>
    );
}