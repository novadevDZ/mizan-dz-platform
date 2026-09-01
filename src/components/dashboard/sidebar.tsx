"use client";

import Link from "next/link";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    AlertTriangle,
    ArrowLeftRight,
    BadgeDollarSign,
    Boxes,
    Building2,
    ChevronDown,
    ClipboardCheck,
    CreditCard,
    FileText,
    History,
    LayoutDashboard,
    Loader2,
    LogOut,
    Package,
    Receipt,
    Users,
    X,
} from "lucide-react";

import {
    useCallback,
    useState,
} from "react";

import {authClient} from "@/src/lib/auth-client";

type SidebarOrganization = {
    id: string;
    name: string;
    subtitle?: string;
};

type SidebarProps = {
    open: boolean;
    onClose: () => void;
    organization?: SidebarOrganization | null;
    onOrganizationClick?: () => void;
};

const primaryNavigation = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Customers",
        href: "/customers",
        icon: Users,
    },
    {
        label: "Sales",
        href: "/sales",
        icon: BadgeDollarSign,
    },
    {
        label: "Invoices",
        href: "/invoices",
        icon: FileText,
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
] as const;

const inventoryNavigation = [
    {
        label: "Overview",
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
        icon: ArrowLeftRight,
    },
    {
        label: "Stock Count",
        href: "/inventory/stock-count",
        icon: ClipboardCheck,
    },
    {
        label: "Low Stock",
        href: "/inventory/low-stock",
        icon: AlertTriangle,
    },
] as const;

const teamNavigation = [
    {
        label: "Members",
        href: "/members",
        icon: Users,
    },
] as const;

export default function Sidebar({
                                    open,
                                    onClose,
                                    organization,
                                    onOrganizationClick,
                                }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [isLoggingOut, setIsLoggingOut] =
        useState(false);

    const [logoutError, setLogoutError] =
        useState<string | null>(null);

    const isActive = useCallback(
        (href: string) => {
            if (href === "/dashboard") {
                return pathname === "/dashboard";
            }

            if (href === "/inventory") {
                return pathname === "/inventory";
            }

            return (
                pathname === href ||
                pathname.startsWith(`${href}/`)
            );
        },
        [pathname],
    );

    const handleLogout = useCallback(
        async () => {
            if (isLoggingOut) {
                return;
            }

            setIsLoggingOut(true);
            setLogoutError(null);

            try {
                const {error} =
                    await authClient.signOut();

                if (error) {
                    console.error(
                        "[Mizan DZ] Sign out failed:",
                        error,
                    );

                    setLogoutError(
                        "Unable to sign out. Please try again.",
                    );

                    return;
                }

                onClose();

                router.replace("/login");
                router.refresh();
            } catch (error) {
                console.error(
                    "[Mizan DZ] Unexpected sign out error:",
                    error,
                );

                setLogoutError(
                    "Unable to sign out. Please try again.",
                );
            } finally {
                setIsLoggingOut(false);
            }
        },
        [
            isLoggingOut,
            onClose,
            router,
        ],
    );

    const organizationName =
        organization?.name?.trim() ||
        "Your business";

    const organizationSubtitle =
        organization?.subtitle?.trim() ||
        "Current workspace";

    return (
        <aside
            className="mizan-sidebar"
            data-open={open}
            aria-label="Primary navigation"
        >
            <div className="mizan-sidebar-logo">
                <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-background)]"
                >
                    <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--primary)] text-sm font-black text-white shadow-sm"
                    >
                        M
                    </span>

                    <span className="min-w-0">
                        <span className="block truncate text-sm font-bold tracking-tight text-white">
                            Mizan DZ
                        </span>

                        <span className="mt-0.5 block truncate text-[10px] font-medium text-[var(--sidebar-muted)]">
                            Business platform
                        </span>
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close navigation"
                    className="mizan-icon-button ml-auto text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] lg:hidden"
                >
                    <X className="h-4 w-4"/>
                </button>
            </div>

            <div className="border-b border-[var(--sidebar-border)] p-3">
                {onOrganizationClick ? (
                    <button
                        type="button"
                        onClick={onOrganizationClick}
                        className="group flex w-full items-center gap-3 rounded-xl border border-[var(--sidebar-border)] bg-white/[0.03] p-3 text-left transition hover:bg-[var(--sidebar-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        aria-label={`Switch organization. Current organization: ${organizationName}`}
                    >
                        <OrganizationIcon/>

                        <OrganizationContent
                            name={organizationName}
                            subtitle={organizationSubtitle}
                        />

                        <ChevronDown
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-[var(--sidebar-muted)] transition-transform group-hover:translate-y-0.5"
                        />
                    </button>
                ) : (
                    <div
                        className="flex w-full items-center gap-3 rounded-xl border border-[var(--sidebar-border)] bg-white/[0.03] p-3"
                        aria-label={`Current organization: ${organizationName}`}
                    >
                        <OrganizationIcon/>

                        <OrganizationContent
                            name={organizationName}
                            subtitle={organizationSubtitle}
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                <SidebarSection
                    label="Workspace"
                    items={primaryNavigation}
                    isActive={isActive}
                    onNavigate={onClose}
                />

                <SidebarSection
                    label="Inventory"
                    items={inventoryNavigation}
                    isActive={isActive}
                    onNavigate={onClose}
                />

                <SidebarSection
                    label="Team"
                    items={teamNavigation}
                    isActive={isActive}
                    onNavigate={onClose}
                />
            </div>

            <div className="space-y-2 border-t border-[var(--sidebar-border)] p-3">
                {logoutError ? (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] leading-4 text-red-300"
                    >
                        {logoutError}
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={() => {
                        void handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[var(--sidebar-muted)] transition group-hover:bg-red-500/10 group-hover:text-red-400">
                        {isLoggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin"/>
                        ) : (
                            <LogOut className="h-4 w-4"/>
                        )}
                    </span>

                    <span
                        className="text-xs font-semibold text-[var(--sidebar-muted)] transition group-hover:text-red-400">
                        {isLoggingOut
                            ? "Signing out..."
                            : "Sign out"}
                    </span>
                </button>

                <div className="rounded-xl border border-[var(--sidebar-border)] bg-white/[0.025] p-3">
                    <p className="text-[11px] font-semibold text-white">
                        Mizan DZ
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[var(--sidebar-muted)]">
                        Business management for
                        Algerian businesses.
                    </p>
                </div>
            </div>
        </aside>
    );
}

type NavigationItem = {
    label: string;
    href: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
};

type SidebarSectionProps = {
    label: string;
    items: readonly NavigationItem[];
    isActive: (href: string) => boolean;
    onNavigate: () => void;
};

function SidebarSection({
                            label,
                            items,
                            isActive,
                            onNavigate,
                        }: SidebarSectionProps) {
    return (
        <section className="mb-6">
            <p className="mizan-sidebar-section">
                {label}
            </p>

            <nav
                aria-label={`${label} navigation`}
                className="space-y-1"
            >
                {items.map(
                    ({
                         label: itemLabel,
                         href,
                         icon: Icon,
                     }) => {
                        const active =
                            isActive(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={onNavigate}
                                aria-current={
                                    active
                                        ? "page"
                                        : undefined
                                }
                                data-active={active}
                                className="mizan-sidebar-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="h-4 w-4 shrink-0"
                                />

                                <span className="min-w-0 truncate">
                                    {itemLabel}
                                </span>
                            </Link>
                        );
                    },
                )}
            </nav>
        </section>
    );
}

function OrganizationIcon() {
    return (
        <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-blue-200"
        >
            <Building2 className="h-4 w-4"/>
        </span>
    );
}

function OrganizationContent({
                                 name,
                                 subtitle,
                             }: {
    name: string;
    subtitle: string;
}) {
    return (
        <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-white">
                {name}
            </span>

            <span className="mt-0.5 block truncate text-[10px] text-[var(--sidebar-muted)]">
                {subtitle}
            </span>
        </span>
    );
}