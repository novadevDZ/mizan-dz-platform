"use client";

import React, {
    useCallback,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/src/components/dashboard/sidebar";
import Topbar from "@/src/components/dashboard/topbar";
import MobileNav from "@/src/components/dashboard/mobile-nav";
import ProfileModal from "@/src/components/dashboard/profile-modal";
import {
    ConfirmProvider,
} from "@/src/components/dashboard/confirm-provider";

import type {
    DashboardData,
} from "@/src/lib/dashboard/dashboard.types";

type DashboardShellProps = {
    children: React.ReactNode;
    data: DashboardData;
    notificationCount?: number;
};

export default function DashboardShell({
                                           children,
                                           data,
                                           notificationCount = 0,
                                       }: DashboardShellProps) {
    const router = useRouter();

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [profileOpen, setProfileOpen] =
        useState(false);

    const [isNavigating, setIsNavigating] =
        useState(false);

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    const openSidebar = useCallback(() => {
        setSidebarOpen(true);
    }, []);

    const openProfile = useCallback(() => {
        setProfileOpen(true);
    }, []);

    const closeProfile = useCallback(() => {
        setProfileOpen(false);
    }, []);

    const handleNotifications =
        useCallback(() => {
            router.push("/notifications");
        }, [router]);

    const handleSearch = useCallback(
        (query: string) => {
            const normalized =
                query.trim();

            if (!normalized) {
                return;
            }

            router.push(
                `/search?q=${encodeURIComponent(
                    normalized,
                )}`,
            );
        },
        [router],
    );

    const handleCreateAction =
        useCallback(
            (
                action:
                    | "customer"
                    | "sale"
                    | "invoice"
                    | "payment"
                    | "product",
            ) => {
                const routes = {
                    customer:
                        "/customers/new",
                    sale:
                        "/sales/new",
                    invoice:
                        "/invoices/new",
                    payment:
                        "/payments/new",
                    product:
                        "/products/new",
                } as const;

                const href =
                    routes[action];

                setIsNavigating(true);

                router.push(href);

                window.setTimeout(
                    () => {
                        setIsNavigating(
                            false,
                        );
                    },
                    800,
                );
            },
            [router],
        );

    const organizationSubtitle =
        [
            data.organization.wilaya,
            data.organization.currency,
        ]
            .filter(Boolean)
            .join(" · ");

    return (
        <ConfirmProvider>
            <div className="mizan-app">
                {/* =====================================================
                    SIDEBAR
                   ===================================================== */}

                <Sidebar
                    open={sidebarOpen}
                    onClose={
                        closeSidebar
                    }
                    organization={{
                        id: data
                            .organization
                            .id,

                        name: data
                            .organization
                            .name,

                        subtitle:
                            organizationSubtitle ||
                            "Current workspace",
                    }}
                    onOrganizationClick={() => {
                        router.push(
                            "/settings/organization",
                        );
                    }}
                />

                {/* =====================================================
                    MOBILE OVERLAY
                   ===================================================== */}

                {sidebarOpen ? (
                    <button
                        type="button"
                        aria-label="Close navigation"
                        className="mizan-mobile-overlay lg:hidden"
                        onClick={
                            closeSidebar
                        }
                    />
                ) : null}

                {/* =====================================================
                    MAIN
                   ===================================================== */}

                <div className="mizan-main">
                    <Topbar
                        onMenuClick={
                            openSidebar
                        }
                        user={{
                            name: data
                                .user.name,
                            email: data
                                .user.email,
                            image: data
                                .user.image,
                        }}
                        notificationCount={
                            notificationCount
                        }
                        onProfileClick={
                            openProfile
                        }
                        onNotificationsClick={
                            handleNotifications
                        }
                        onSearch={
                            handleSearch
                        }
                        onCreateAction={
                            handleCreateAction
                        }
                    />

                    {isNavigating ? (
                        <div
                            aria-hidden="true"
                            className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden bg-transparent"
                        >
                            <div className="h-full w-1/3 animate-[mizan-progress_900ms_ease-in-out_infinite] rounded-full bg-[var(--primary)]" />
                        </div>
                    ) : null}

                    <main className="mizan-content">
                        {children}
                    </main>
                </div>

                {/* =====================================================
                    MOBILE NAVIGATION
                   ===================================================== */}

                <MobileNav />

                {/* =====================================================
                    PROFILE MODAL
                   ===================================================== */}

                <ProfileModal
                    open={profileOpen}
                    onClose={
                        closeProfile
                    }
                    data={data}
                />
            </div>
        </ConfirmProvider>
    );
}