import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-[var(--background)]">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <section
                    className="mizan-card w-full max-w-lg p-8 text-center sm:p-10"
                    aria-labelledby="not-found-title"
                >
                    <div className="mizan-empty-icon mx-auto mb-5">
                        <SearchX className="h-5 w-5" />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                        404 · Page not found
                    </p>

                    <h1
                        id="not-found-title"
                        className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-4xl"
                    >
                        We couldn't find that page.
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-muted)]">
                        The page you're looking for does not
                        exist or may have been moved.
                    </p>

                    <div className="mt-7 flex justify-center">
                        <Link
                            href="/dashboard"
                            className="mizan-primary-action"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to dashboard
                        </Link>
                    </div>

                    <p className="mt-8 text-[11px] text-[var(--text-muted)]">
                        Mizan DZ · Business management platform
                    </p>
                </section>
            </div>
        </main>
    );
}