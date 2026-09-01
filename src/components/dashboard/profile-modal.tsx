"use client";

import {
    useEffect,
    useRef,
} from "react";

import {
    Building2,
    Mail,
    MapPin,
    Phone,
    X,
} from "lucide-react";

import type {
    DashboardData,
} from "@/src/lib/dashboard/dashboard.types";

type ProfileModalProps = {
    open: boolean;
    onClose: () => void;
    data: DashboardData;
};

export default function ProfileModal({
                                         open,
                                         onClose,
                                         data,
                                     }: ProfileModalProps) {
    const closeButtonRef =
        useRef<HTMLButtonElement>(null);

    const previousActiveElementRef =
        useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        previousActiveElementRef.current =
            document.activeElement as
                | HTMLElement
                | null;

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        closeButtonRef.current?.focus();

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );

            document.body.style.overflow =
                previousOverflow;

            previousActiveElementRef.current?.focus();
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }



    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 px-3 pt-3 backdrop-blur-sm sm:px-5 sm:pt-6"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-modal-title"
                className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
            >
                <div className="border-b border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-5 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                            <ProfileAvatar
                                name={
                                    data.user.name
                                }
                                image={
                                    data.user.image
                                }
                            />

                            <div className="min-w-0">
                                <h2
                                    id="profile-modal-title"
                                    className="truncate text-base font-bold text-[var(--text-primary)]"
                                >
                                    {data.user.name ||
                                        "Mizan User"}
                                </h2>

                                <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                    {
                                        data.user
                                            .email
                                    }
                                </p>
                            </div>
                        </div>

                        <button
                            ref={
                                closeButtonRef
                            }
                            type="button"
                            onClick={onClose}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                            aria-label="Close profile"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <ProfileItem
                            icon={Mail}
                            label="Email"
                            value={
                                data.user
                                    .email
                            }
                        />


                        <ProfileItem
                            icon={
                                Building2
                            }
                            label="Business"
                            value={
                                data.organization
                                    .name
                            }
                        />

                        <ProfileItem
                            icon={MapPin}
                            label="Wilaya"
                            value={
                                data.organization
                                    .wilaya ||
                                "Not provided"
                            }
                        />
                    </div>

                    <section
                        className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-muted)]">
                                    Profile completion
                                </p>

                                <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">
                                    {
                                        data.profile
                                            .percentage
                                    }
                                    %
                                </p>
                            </div>

                            <span className="text-xs font-semibold text-[var(--text-secondary)]">
                                {
                                    data.profile
                                        .completed
                                }
                                /
                                {
                                    data.profile
                                        .total
                                }{" "}
                                completed
                            </span>
                        </div>

                        <div
                            className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-tertiary)]"
                            aria-hidden="true"
                        >
                            <div
                                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            data.profile
                                                .percentage,
                                        ),
                                    )}%`,
                                }}
                            />
                        </div>
                    </section>

                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        >
                            Close
                        </button>

                        <a
                            href="/settings"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-xs font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                        >
                            Edit profile
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileAvatar({
                           name,
                           image,
                       }: {
    name: string | null;
    image: string | null;
}) {
    if (image) {
        return (
            <img
                src={image}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14"
            />
        );
    }

    return (
        <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-sm font-bold text-[var(--primary)] sm:h-14 sm:w-14">
            {getInitials(name)}
        </div>
    );
}

function ProfileItem({
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
        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
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

function getInitials(
    name: string | null,
): string {
    const value =
        name?.trim() || "M";

    const parts =
        value.split(/\s+/);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}