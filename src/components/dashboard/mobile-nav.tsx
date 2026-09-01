"use client";

import Link from "next/link";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    Boxes,
    CreditCard,
    FileText,
    History,
    LayoutDashboard,
    MoreHorizontal,
    Package,
    Plus,
    Receipt,
    SlidersHorizontal,
    Users,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";

const navigation = [
    {
        label: "Home",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Customers",
        href: "/customers",
        icon: Users,
    },
    {
        label: "Invoices",
        href: "/invoices",
        icon: FileText,
    },
] as const;

const moreItems = [
    {
        label: "Sales",
        href: "/sales",
        icon: CreditCard,
    },
    {
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
    },
    {
        label: "Expenses",
        href: "/expenses",
        icon: Receipt,
    },
    {
        label: "Products",
        href: "/products",
        icon: Package,
    },
    {
        label: "Inventory",
        href: "/inventory",
        icon: Boxes,
    },
    {
        label: "Movements",
        href: "/inventory/movements",
        icon: History,
    },
    {
        label: "Adjustments",
        href: "/inventory/adjustments",
        icon: SlidersHorizontal,
    },
] as const;

const createItems = [
    {
        label: "Customer",
        description: "Add a customer",
        href: "/customers/new",
        icon: Users,
    },
    {
        label: "Sale",
        description: "Record a new sale",
        href: "/sales/new",
        icon: CreditCard,
    },
    {
        label: "Invoice",
        description: "Create an invoice",
        href: "/invoices/new",
        icon: FileText,
    },
    {
        label: "Payment",
        description: "Record a payment",
        href: "/payments/new",
        icon: CreditCard,
    },
    {
        label: "Expense",
        description: "Record a business expense",
        href: "/expenses/new",
        icon: Receipt,
    },
    {
        label: "Product",
        description: "Add a product",
        href: "/products/new",
        icon: Package,
    },
] as const;

type MobileNavItemProps = {
    label: string;
    href: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    active: boolean;
    onNavigate: () => void;
};

export default function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();

    const [createOpen, setCreateOpen] =
        useState(false);

    const [moreOpen, setMoreOpen] =
        useState(false);

    const createButtonRef =
        useRef<HTMLButtonElement>(null);

    function isActive(href: string) {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }

        return (
            pathname === href ||
            pathname.startsWith(`${href}/`)
        );
    }

    function closeMenus() {
        setCreateOpen(false);
        setMoreOpen(false);
    }

    useEffect(() => {
        const isMenuOpen =
            createOpen || moreOpen;

        if (!isMenuOpen) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                previousOverflow;
        };
    }, [createOpen, moreOpen]);

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            if (event.key !== "Escape") {
                return;
            }

            if (!createOpen && !moreOpen) {
                return;
            }

            closeMenus();

            requestAnimationFrame(() => {
                createButtonRef.current?.focus();
            });
        }

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );
        };
    }, [createOpen, moreOpen]);

    useEffect(() => {
        closeMenus();
    }, [pathname]);

    return (
        <>
            {createOpen ? (
                <CreateSheet
                    onClose={() =>
                        setCreateOpen(false)
                    }
                    onNavigate={(href) => {
                        setCreateOpen(false);
                        router.push(href);
                    }}
                />
            ) : null}

            {moreOpen ? (
                <MoreSheet
                    isActive={isActive}
                    onClose={() =>
                        setMoreOpen(false)
                    }
                />
            ) : null}

            <nav
                className="mizan-mobile-nav lg:hidden"
                aria-label="Mobile navigation"
            >
                <div
                    className="mx-auto grid max-w-xl grid-cols-5 items-center px-2"
                    style={{
                        height:
                            "var(--mobile-nav-height)",
                    }}
                >
                    <MobileNavItem
                        label={navigation[0].label}
                        href={navigation[0].href}
                        icon={navigation[0].icon}
                        active={isActive(
                            navigation[0].href,
                        )}
                        onNavigate={closeMenus}
                    />

                    <MobileNavItem
                        label={navigation[1].label}
                        href={navigation[1].href}
                        icon={navigation[1].icon}
                        active={isActive(
                            navigation[1].href,
                        )}
                        onNavigate={closeMenus}
                    />

                    <div className="flex h-full items-center justify-center">
                        <button
                            ref={createButtonRef}
                            type="button"
                            onClick={() => {
                                setMoreOpen(false);
                                setCreateOpen(
                                    (value) => !value,
                                );
                            }}
                            aria-label="Create new"
                            aria-expanded={createOpen}
                            aria-haspopup="dialog"
                            className={[
                                "relative grid h-12 w-12 place-items-center rounded-2xl",
                                "bg-[var(--primary)] text-white",
                                "shadow-[0_10px_24px_rgba(37,99,235,0.28)]",
                                "transition-all duration-150",
                                "hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]",
                                "active:translate-y-0",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
                                createOpen
                                    ? "-translate-y-0.5 rotate-45"
                                    : "",
                            ].join(" ")}
                        >
                            <Plus className="h-5 w-5"/>
                        </button>
                    </div>

                    <MobileNavItem
                        label={navigation[2].label}
                        href={navigation[2].href}
                        icon={navigation[2].icon}
                        active={isActive(
                            navigation[2].href,
                        )}
                        onNavigate={closeMenus}
                    />

                    <button
                        type="button"
                        onClick={() => {
                            setCreateOpen(false);
                            setMoreOpen(
                                (value) => !value,
                            );
                        }}
                        aria-label="More navigation"
                        aria-expanded={moreOpen}
                        aria-haspopup="dialog"
                        className={[
                            "relative flex h-full flex-col items-center justify-center gap-1 rounded-xl border-b-[5px] py-1.5",
                            "text-[10px] font-semibold transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                            moreOpen
                                ? "border-b-white bg-transparent text-white"
                                : "border-b-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                        ].join(" ")}
                    >
                        <MoreHorizontal className="h-4 w-4"/>

                        <span>More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}

function MobileNavItem({
                           label,
                           href,
                           icon: Icon,
                           active,
                           onNavigate,
                       }: MobileNavItemProps) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            aria-current={
                active ? "page" : undefined
            }
            className={[
                "relative flex h-full flex-col items-center justify-center gap-1 rounded-xl border-b-[5px] py-1.5",
                "text-[10px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                active
                    ? "border-b-white bg-transparent text-white"
                    : "border-b-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            ].join(" ")}
        >
            <Icon
                aria-hidden="true"
                className={[
                    "h-4 w-4 transition-transform duration-150",
                    active ? "scale-105" : "",
                ].join(" ")}
            />

            <span>{label}</span>
        </Link>
    );
}

function CreateSheet({
                         onClose,
                         onNavigate,
                     }: {
    onClose: () => void;
    onNavigate: (href: string) => void;
}) {
    return (
        <div
            className="fixed inset-0 z-[120] overflow-hidden lg:hidden"
            role="presentation"
        >
            <button
                type="button"
                aria-label="Close create menu"
                onClick={onClose}
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            />

            <div
                className="absolute inset-x-3 bottom-[calc(var(--mobile-nav-height)+0.75rem)] flex max-h-[calc(100dvh-var(--mobile-nav-height)-1.5rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <div className="shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3.5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                                Create new
                            </p>

                            <p className="truncate text-[11px] text-[var(--text-muted)]">
                                Start a business action.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close create menu"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                        >
                            <Plus className="h-4 w-4 rotate-45"/>
                        </button>
                    </div>
                </div>

                <div
                    className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2 [scrollbar-color:var(--primary)_transparent] [scrollbar-width:thin]">
                    <div className="min-w-0">
                        {createItems.map(
                            ({
                                 label,
                                 description,
                                 href,
                                 icon: Icon,
                             }) => (
                                <button
                                    key={href}
                                    type="button"
                                    onClick={() =>
                                        onNavigate(
                                            href,
                                        )
                                    }
                                    className="group flex min-h-[60px] w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                                >
                                    <span
                                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                                        <Icon className="h-4 w-4"/>
                                    </span>

                                    <span className="min-w-0 flex-1 overflow-hidden">
                                        <span
                                            className="block truncate text-xs font-semibold text-[var(--text-primary)]">
                                            {label}
                                        </span>

                                        <span
                                            className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--text-muted)]">
                                            {description}
                                        </span>
                                    </span>
                                </button>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MoreSheet({
                       isActive,
                       onClose,
                   }: {
    isActive: (href: string) => boolean;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-[120] overflow-hidden lg:hidden"
            role="presentation"
        >
            <button
                type="button"
                aria-label="Close more menu"
                onClick={onClose}
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            />

            <div
                className="absolute inset-x-3 bottom-[calc(var(--mobile-nav-height)+0.75rem)] flex h-[min(32rem,calc(100dvh-var(--mobile-nav-height)-1.5rem))] min-w-0 max-h-[calc(100dvh-var(--mobile-nav-height)-1.5rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <div className="min-w-0 shrink-0 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3.5">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                        More
                    </p>

                    <p className="truncate text-[11px] text-[var(--text-muted)]">
                        All business areas and tools.
                    </p>
                </div>

                <div
                    className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2 [scrollbar-color:var(--primary)_transparent] [scrollbar-width:thin]">
                    <div className="grid min-w-0 gap-1">
                        {moreItems.map(
                            ({
                                 label,
                                 href,
                                 icon: Icon,
                             }) => {
                                const active =
                                    isActive(href);

                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={onClose}
                                        aria-current={
                                            active
                                                ? "page"
                                                : undefined
                                        }
                                        className={[
                                            "flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-xl border-b-[5px] px-3 py-3 transition-colors",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                                            active
                                                ? "border-b-white bg-[var(--surface-secondary)] text-[var(--text-primary)]"
                                                : "border-b-transparent text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                                                active
                                                    ? "bg-[var(--primary)] text-white"
                                                    : "bg-[var(--surface-secondary)] text-[var(--text-muted)]",
                                            ].join(" ")}
                                        >
                                            <Icon className="h-4 w-4"/>
                                        </span>

                                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                                            {label}
                                        </span>
                                    </Link>
                                );
                            },
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}