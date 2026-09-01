"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/src/lib/auth-client";

export function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (loading) {
            return;
        }

        setLoading(true);

        try {
            const { error } = await authClient.signOut();

            if (error) {
                console.error(
                    "[Mizan DZ] Sign out failed:",
                    error,
                );

                setLoading(false);
                return;
            }

            router.replace("/login");
            router.refresh();
        } catch (error) {
            console.error(
                "[Mizan DZ] Unexpected sign out error:",
                error,
            );

            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-secondary)] transition group-hover:bg-red-100">
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <LogOut className="h-4 w-4" />
                )}
            </span>

            <span>
                {loading ? "Signing out..." : "Sign out"}
            </span>
        </button>
    );
}