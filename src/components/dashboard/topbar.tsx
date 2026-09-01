"use client";

import Link from "next/link";
import {
    Bell,
    ChevronDown,
    CreditCard,
    FileText,
    LayoutDashboard,
    Menu,
    Moon,
    Package,
    Plus,
    Search,
    ShoppingCart,
    Sun,
    Users,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {useTheme} from "@/src/hooks/use-theme";

type TopbarUser = {
    name: string | null;
    email?: string | null;
    image?: string | null;
};

type CreateAction =
    | "customer"
    | "sale"
    | "invoice"
    | "payment"
    | "product";

type TopbarProps = {
    onMenuClick: () => void;
    user?: TopbarUser | null;
    notificationCount?: number;
    onProfileClick?: () => void;
    onNotificationsClick?: () => void;
    onSearch?: (query: string) => void;
    onCreateAction?: (
        action: CreateAction,
    ) => void;
};

type SearchResult = {
    label: string;
    description: string;
    href: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
};

const searchResults: SearchResult[] = [
    {
        label: "Customers",
        description: "Manage your customers",
        href: "/customers",
        icon: Users,
    },
    {
        label: "Members",
        description:
            "Manage members and invite employees",
        href: "/members",
        icon: Users,
    },
    {
        label: "Sales",
        description: "View sales records",
        href: "/sales",
        icon: ShoppingCart,
    },
    {
        label: "Invoices",
        description: "Manage invoices",
        href: "/invoices",
        icon: FileText,
    },
    {
        label: "Products",
        description: "Manage your products",
        href: "/products",
        icon: Package,
    },
    {
        label: "Dashboard",
        description: "Business overview",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
];

const createActions: Array<{
    label: string;
    description: string;
    action: CreateAction;
    icon: React.ComponentType<{
        className?: string;
    }>;
}> = [
    {
        label: "New customer",
        description: "Add a customer",
        action: "customer",
        icon: Users,
    },
    {
        label: "New sale",
        description: "Record a new sale",
        action: "sale",
        icon: ShoppingCart,
    },
    {
        label: "New invoice",
        description: "Create an invoice",
        action: "invoice",
        icon: FileText,
    },
    {
        label: "New payment",
        description: "Record a payment",
        action: "payment",
        icon: CreditCard,
    },
    {
        label: "New product",
        description: "Add a product",
        action: "product",
        icon: Package,
    },
];

export default function Topbar({
                                   onMenuClick,
                                   user,
                                   notificationCount = 0,
                                   onProfileClick,
                                   onNotificationsClick,
                                   onSearch,
                                   onCreateAction,
                               }: TopbarProps) {
    const {
        theme,
        setTheme,
    } = useTheme();

    const [searchOpen, setSearchOpen] =
        useState(false);

    const [searchQuery, setSearchQuery] =
        useState("");

    const [createOpen, setCreateOpen] =
        useState(false);

    const searchRef =
        useRef<HTMLInputElement>(null);

    const searchContainerRef =
        useRef<HTMLDivElement>(null);

    const createMenuRef =
        useRef<HTMLDivElement>(null);

    const createButtonRef =
        useRef<HTMLButtonElement>(null);

    const userName =
        user?.name?.trim() ||
        "Mizan User";

    const isDark =
        theme === "dark";

    const filteredResults =
        searchQuery.trim().length === 0
            ? searchResults
            : searchResults.filter(
                (result) => {
                    const query =
                        searchQuery
                            .trim()
                            .toLowerCase();

                    return (
                        result.label
                            .toLowerCase()
                            .includes(query) ||
                        result.description
                            .toLowerCase()
                            .includes(query)
                    );
                },
            );

    const closeCreateMenu =
        useCallback(() => {
            setCreateOpen(false);

            requestAnimationFrame(() => {
                createButtonRef.current?.focus();
            });
        }, []);

    const openSearch =
        useCallback(() => {
            setSearchOpen(true);

            requestAnimationFrame(() => {
                searchRef.current?.focus();
            });
        }, []);

    const closeSearch =
        useCallback(() => {
            setSearchOpen(false);
        }, []);

    const handleSearchSubmit =
        useCallback(
            (event: React.FormEvent) => {
                event.preventDefault();

                const query =
                    searchQuery.trim();

                if (!query) {
                    return;
                }

                onSearch?.(query);
            },
            [onSearch, searchQuery],
        );

    const handleCreateAction =
        useCallback(
            (action: CreateAction) => {
                setCreateOpen(false);
                onCreateAction?.(action);
            },
            [onCreateAction],
        );

    const handleThemeToggle =
        useCallback(() => {
            setTheme(
                isDark
                    ? "light"
                    : "dark",
            );
        }, [
            isDark,
            setTheme,
        ]);

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent,
        ) {
            const target =
                event.target as HTMLElement | null;

            const isTyping =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable;

            if (
                event.key === "/" &&
                !isTyping
            ) {
                event.preventDefault();
                openSearch();
                return;
            }

            if (event.key === "Escape") {
                if (createOpen) {
                    closeCreateMenu();
                    return;
                }

                if (searchOpen) {
                    closeSearch();
                }
            }
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
    }, [
        closeCreateMenu,
        closeSearch,
        createOpen,
        openSearch,
        searchOpen,
    ]);

    useEffect(() => {
        function handlePointerDown(
            event: PointerEvent,
        ) {
            const target =
                event.target as Node;

            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(
                    target,
                )
            ) {
                setSearchOpen(false);
            }

            if (
                createMenuRef.current &&
                !createMenuRef.current.contains(
                    target,
                )
            ) {
                setCreateOpen(false);
            }
        }

        document.addEventListener(
            "pointerdown",
            handlePointerDown,
        );

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
            );
        };
    }, []);

    return (
        <header className="mizan-header">
            <div className="flex h-full w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                {/* =====================================================
                    LEFT
                ===================================================== */}

                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        aria-label="Open navigation"
                        className="mizan-icon-button border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] lg:hidden"
                    >
                        <Menu className="h-4 w-4"/>
                    </button>

                    {/* Search */}
                    <div
                        ref={searchContainerRef}
                        className="relative hidden w-full max-w-[420px] md:block"
                    >
                        <form
                            onSubmit={
                                handleSearchSubmit
                            }
                        >
                            <div
                                className={[
                                    "flex h-10 items-center gap-2 rounded-xl border bg-[var(--card)] px-3 transition-all duration-150",
                                    searchOpen
                                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10"
                                        : "border-[var(--border)] hover:border-[var(--border-strong)]",
                                ].join(" ")}
                            >
                                <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]"/>

                                <input
                                    ref={searchRef}
                                    value={searchQuery}
                                    onFocus={
                                        openSearch
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setSearchQuery(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="Search customers, members, invoices..."
                                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                                    aria-label="Search Mizan"
                                    autoComplete="off"
                                    spellCheck={false}
                                />

                                <kbd
                                    className="hidden shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] sm:inline-flex">
                                    /
                                </kbd>
                            </div>
                        </form>

                        {searchOpen ? (
                            <SearchDropdown
                                query={
                                    searchQuery
                                }
                                results={
                                    filteredResults
                                }
                                onClose={
                                    closeSearch
                                }
                            />
                        ) : null}
                    </div>
                </div>

                {/* =====================================================
                    RIGHT
                ===================================================== */}

                <div className="flex shrink-0 items-center gap-2">
                    {/* New */}
                    <div
                        ref={createMenuRef}
                        className="relative"
                    >
                        <button
                            ref={
                                createButtonRef
                            }
                            type="button"
                            onClick={() =>
                                setCreateOpen(
                                    (current) =>
                                        !current,
                                )
                            }
                            aria-expanded={
                                createOpen
                            }
                            aria-haspopup="menu"
                            className={[
                                "hidden h-10 items-center rounded-xl px-3 text-sm font-semibold transition-all duration-150 sm:inline-flex",
                                "bg-[var(--primary)] text-white shadow-sm",
                                "hover:-translate-y-px hover:bg-[var(--primary-hover)] hover:shadow-md",
                                "active:translate-y-0",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
                                createOpen
                                    ? "ring-2 ring-[var(--primary)]/20"
                                    : "",
                            ].join(" ")}
                        >
                            <Plus className="h-4 w-4 shrink-0"/>

                            <span className="ml-2">
                                New
                            </span>

                            <ChevronDown
                                className={[
                                    "ml-1.5 h-3.5 w-3.5 transition-transform duration-150",
                                    createOpen
                                        ? "rotate-180"
                                        : "",
                                ].join(" ")}
                            />
                        </button>

                        {createOpen ? (
                            <CreateMenu
                                onSelect={
                                    handleCreateAction
                                }
                            />
                        ) : null}
                    </div>

                    {/* Theme */}
                    <button
                        type="button"
                        onClick={
                            handleThemeToggle
                        }
                        aria-label={
                            isDark
                                ? "Switch to light mode"
                                : "Switch to dark mode"
                        }
                        title={
                            isDark
                                ? "Light mode"
                                : "Dark mode"
                        }
                        className="mizan-icon-button border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        {isDark ? (
                            <Sun className="h-4 w-4"/>
                        ) : (
                            <Moon className="h-4 w-4"/>
                        )}
                    </button>

                    {/* Notifications */}
                    <button
                        type="button"
                        onClick={
                            onNotificationsClick
                        }
                        aria-label={
                            notificationCount >
                            0
                                ? `${notificationCount} unread notifications`
                                : "Notifications"
                        }
                        className="relative mizan-icon-button border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        <Bell className="h-4 w-4"/>

                        {notificationCount >
                        0 ? (
                            <span
                                aria-hidden="true"
                                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--primary)] px-1 text-[8px] font-bold leading-none text-white"
                            >
                                {notificationCount >
                                99
                                    ? "99+"
                                    : notificationCount}
                            </span>
                        ) : null}
                    </button>

                    {/* Profile */}
                    <button
                        type="button"
                        onClick={
                            onProfileClick
                        }
                        aria-label={`Open profile for ${userName}`}
                        className="group flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-1.5 pr-2 transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                        <Avatar
                            name={userName}
                            image={
                                user?.image ??
                                null
                            }
                        />

                        <div className="hidden min-w-0 max-w-[150px] text-left sm:block">
                            <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                                {userName}
                            </p>

                            {user?.email ? (
                                <p className="truncate text-[10px] text-[var(--text-muted)]">
                                    {user.email}
                                </p>
                            ) : null}
                        </div>

                        <ChevronDown
                            className="hidden h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition group-hover:text-[var(--text-secondary)] sm:block"/>
                    </button>
                </div>
            </div>
        </header>
    );
}

/* ================================================================
   SEARCH DROPDOWN
================================================================ */

function SearchDropdown({
                            query,
                            results,
                            onClose,
                        }: {
    query: string;
    results: SearchResult[];
    onClose: () => void;
}) {
    return (
        <div
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[80] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
            role="listbox"
        >
            <div className="border-b border-[var(--border)] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Quick navigation
                </p>
            </div>

            <div className="max-h-[min(420px,calc(100vh-6rem))] overflow-y-auto p-2">
                {results.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <div
                            className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                            <Search className="h-4 w-4"/>
                        </div>

                        <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                            No results
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                            Nothing matches{" "}
                            <span className="font-semibold text-[var(--text-secondary)]">
                                "{query}"
                            </span>
                            .
                        </p>
                    </div>
                ) : (
                    results.map(
                        ({
                             label,
                             description,
                             href,
                             icon: Icon,
                         }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={onClose}
                                className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150 hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                            >
                                <span
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--mizan-blue-soft)] text-[var(--primary)] transition group-hover:scale-[1.02]">
                                    <Icon className="h-4 w-4"/>
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-semibold text-[var(--text-primary)]">
                                        {label}
                                    </span>

                                    <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">
                                        {description}
                                    </span>
                                </span>

                                <span
                                    className="text-[10px] font-semibold text-[var(--text-muted)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100">
                                    Open
                                </span>
                            </Link>
                        ),
                    )
                )}
            </div>
        </div>
    );
}

/* ================================================================
   CREATE MENU
================================================================ */

function CreateMenu({
                        onSelect,
                    }: {
    onSelect: (
        action: CreateAction,
    ) => void;
}) {
    return (
        <div
            role="menu"
            aria-label="Create new"
            className="absolute right-0 top-[calc(100%+10px)] z-[90] w-[280px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.14)]"
        >
            <div className="px-3 pb-2 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Create new
                </p>

                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Start a business action.
                </p>
            </div>

            <div className="space-y-1">
                {createActions.map(
                    ({
                         label,
                         description,
                         action,
                         icon: Icon,
                     }) => (
                        <button
                            key={action}
                            type="button"
                            role="menuitem"
                            onClick={() =>
                                onSelect(
                                    action,
                                )
                            }
                            className="group flex min-h-[58px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-[var(--surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        >
                            <span
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)] transition-all duration-150 group-hover:bg-[var(--primary)] group-hover:text-white">
                                <Icon className="h-4 w-4"/>
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold text-[var(--text-primary)]">
                                    {label}
                                </span>

                                <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--text-muted)]">
                                    {description}
                                </span>
                            </span>

                            <span
                                className="shrink-0 translate-x-[-2px] text-[var(--text-muted)] opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                                →
                            </span>
                        </button>
                    ),
                )}
            </div>

            <div className="mt-2 border-t border-[var(--border)] px-3 py-2.5">
                <p className="text-[10px] leading-4 text-[var(--text-muted)]">
                    Select an action to continue.
                </p>
            </div>
        </div>
    );
}

/* ================================================================
   AVATAR
================================================================ */

function Avatar({
                    name,
                    image,
                }: {
    name: string;
    image: string | null;
}) {
    if (image) {
        return (
            <img
                src={image}
                alt=""
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-black/5"
            />
        );
    }

    return (
        <span
            className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--text-primary)] text-[10px] font-bold text-white ring-1 ring-black/5">
            {getInitials(name)}
        </span>
    );
}

function getInitials(name: string) {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return "M";
    }

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}