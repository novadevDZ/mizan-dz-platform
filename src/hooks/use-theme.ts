"use client";

import {
    useEffect,
    useState,
} from "react";

export type Theme =
    | "light"
    | "dark"
    | "system";

const STORAGE_KEY =
    "mizan-theme";

function getSystemTheme(): "light" | "dark" {
    if (
        typeof window === "undefined"
    ) {
        return "light";
    }

    return window.matchMedia(
        "(prefers-color-scheme: dark)",
    ).matches
        ? "dark"
        : "light";
}

function applyTheme(theme: Theme) {
    const root =
        document.documentElement;

    const resolvedTheme =
        theme === "system"
            ? getSystemTheme()
            : theme;

    root.classList.toggle(
        "dark",
        resolvedTheme === "dark",
    );

    root.style.colorScheme =
        resolvedTheme;
}

export function useTheme() {
    const [theme, setThemeState] =
        useState<Theme>("system");

    useEffect(() => {
        const stored =
            localStorage.getItem(
                STORAGE_KEY,
            ) as Theme | null;

        const initialTheme =
            stored === "light" ||
            stored === "dark" ||
            stored === "system"
                ? stored
                : "system";

        setThemeState(initialTheme);
        applyTheme(initialTheme);

        function handleSystemThemeChange() {
            const current =
                localStorage.getItem(
                    STORAGE_KEY,
                );

            if (current === "system") {
                applyTheme("system");
            }
        }

        const mediaQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)",
            );

        mediaQuery.addEventListener(
            "change",
            handleSystemThemeChange,
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                handleSystemThemeChange,
            );
        };
    }, []);

    function setTheme(theme: Theme) {
        localStorage.setItem(
            STORAGE_KEY,
            theme,
        );

        setThemeState(theme);
        applyTheme(theme);
    }

    return {
        theme,
        setTheme,
    };
}