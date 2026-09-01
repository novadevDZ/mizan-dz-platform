"use client";

import {
    AlertTriangle,
    CheckCircle2,
    Info,
    Loader2,
    X,
} from "lucide-react";
import {
    useEffect,
    useId,
    useRef,
} from "react";

type ConfirmVariant =
    | "danger"
    | "warning"
    | "info"
    | "success";

type ConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;

    title?: string;
    description?: string;

    confirmLabel?: string;
    cancelLabel?: string;

    variant?: ConfirmVariant;

    loading?: boolean;

    destructive?: boolean;

    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
};

const variantConfig: Record<
    ConfirmVariant,
    {
        icon: typeof AlertTriangle;
        iconClass: string;
        iconBackground: string;
        confirmClass: string;
    }
> = {
    danger: {
        icon: AlertTriangle,
        iconClass:
            "text-[var(--danger)]",
        iconBackground:
            "bg-[var(--danger-soft)]",
        confirmClass:
            "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]",
    },

    warning: {
        icon: AlertTriangle,
        iconClass:
            "text-[var(--warning)]",
        iconBackground:
            "bg-[var(--warning-soft)]",
        confirmClass:
            "bg-[var(--warning)] text-white hover:bg-[var(--warning-hover)]",
    },

    info: {
        icon: Info,
        iconClass:
            "text-[var(--primary)]",
        iconBackground:
            "bg-[var(--mizan-blue-soft)]",
        confirmClass:
            "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
    },

    success: {
        icon: CheckCircle2,
        iconClass:
            "text-[var(--success)]",
        iconBackground:
            "bg-[var(--success-soft)]",
        confirmClass:
            "bg-[var(--success)] text-white hover:bg-[var(--success-hover)]",
    },
};

export default function ConfirmDialog({
                                          open,
                                          onClose,
                                          onConfirm,

                                          title = "Are you sure?",
                                          description = "This action cannot be undone.",

                                          confirmLabel = "Confirm",
                                          cancelLabel = "Cancel",

                                          variant = "danger",

                                          loading = false,

                                          destructive = false,

                                          closeOnOverlayClick = true,
                                          closeOnEscape = true,
                                      }: ConfirmDialogProps) {
    const titleId = useId();
    const descriptionId = useId();

    const dialogRef =
        useRef<HTMLDivElement>(null);

    const confirmButtonRef =
        useRef<HTMLButtonElement>(null);

    const config =
        variantConfig[variant];

    const Icon = config.icon;

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        requestAnimationFrame(() => {
            confirmButtonRef.current?.focus();
        });

        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (
                event.key === "Escape" &&
                closeOnEscape &&
                !loading
            ) {
                event.preventDefault();
                onClose();
            }

            if (
                event.key === "Tab"
            ) {
                const dialog =
                    dialogRef.current;

                if (!dialog) {
                    return;
                }

                const focusable =
                    dialog.querySelectorAll<
                        HTMLButtonElement |
                        HTMLInputElement |
                        HTMLTextAreaElement |
                        HTMLSelectElement |
                        HTMLAnchorElement
                    >(
                        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
                    );

                if (
                    focusable.length === 0
                ) {
                    return;
                }

                const first =
                    focusable[0];

                const last =
                    focusable[
                    focusable.length - 1
                        ];

                if (
                    event.shiftKey &&
                    document.activeElement ===
                    first
                ) {
                    event.preventDefault();
                    last.focus();
                    return;
                }

                if (
                    !event.shiftKey &&
                    document.activeElement ===
                    last
                ) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [
        open,
        closeOnEscape,
        loading,
        onClose,
    ]);

    if (!open) {
        return null;
    }

    async function handleConfirm() {
        if (loading) {
            return;
        }

        try {
            await onConfirm();
        } catch (error) {
            console.error(
                "[ConfirmDialog] Confirm action failed:",
                error,
            );
        }
    }

    function handleOverlayClick(
        event: React.MouseEvent<HTMLDivElement>,
    ) {
        if (
            !closeOnOverlayClick ||
            loading
        ) {
            return;
        }

        if (
            event.target ===
            event.currentTarget
        ) {
            onClose();
        }
    }

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
            role="presentation"
            onMouseDown={handleOverlayClick}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />

            {/* Dialog */}
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={
                    descriptionId
                }
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_30px_90px_rgba(15,23,42,0.20)]"
            >
                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close dialog"
                    className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Content */}
                <div className="p-6 sm:p-7">
                    <div
                        className={[
                            "grid h-11 w-11 place-items-center rounded-xl",
                            config.iconBackground,
                        ].join(" ")}
                    >
                        <Icon
                            className={[
                                "h-5 w-5",
                                config.iconClass,
                            ].join(" ")}
                        />
                    </div>

                    <h2
                        id={titleId}
                        className="mt-5 pr-8 text-lg font-bold tracking-[-0.025em] text-[var(--text-primary)]"
                    >
                        {title}
                    </h2>

                    <p
                        id={descriptionId}
                        className="mt-2 pr-4 text-sm leading-6 text-[var(--text-secondary)]"
                    >
                        {description}
                    </p>

                    {destructive ? (
                        <div className="mt-4 rounded-xl border border-[var(--danger)]/15 bg-[var(--danger-soft)] px-3.5 py-3">
                            <p className="text-xs leading-5 text-[var(--danger)]">
                                This action is destructive and
                                may permanently remove data.
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-soft)] bg-[var(--surface-secondary)] p-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="mizan-ghost-action w-full sm:w-auto"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        ref={confirmButtonRef}
                        type="button"
                        onClick={
                            handleConfirm
                        }
                        disabled={loading}
                        className={[
                            "inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
                            "disabled:cursor-not-allowed disabled:opacity-60",
                            config.confirmClass,
                        ].join(" ")}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />

                                <span className="ml-2">
                                    Processing...
                                </span>
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}