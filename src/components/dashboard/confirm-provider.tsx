"use client";

import {
    createContext,
    useCallback,
    useContext,
    useState,
} from "react";

import ConfirmDialog from "@/src/components/ui/confirm-dialog";

type ConfirmOptions = {
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info" | "success";
    destructive?: boolean;
};

type ConfirmState = {
    open: boolean;
    options: ConfirmOptions;
    resolve?: (confirmed: boolean) => void;
};

type ConfirmContextValue = {
    confirm: (
        options?: ConfirmOptions,
    ) => Promise<boolean>;
};

const ConfirmContext =
    createContext<ConfirmContextValue | null>(
        null,
    );

export function ConfirmProvider({
                                    children,
                                }: {
    children: React.ReactNode;
}) {
    const [state, setState] =
        useState<ConfirmState>({
            open: false,
            options: {},
        });

    const confirm = useCallback(
        (
            options: ConfirmOptions = {},
        ) => {
            return new Promise<boolean>(
                (resolve) => {
                    setState({
                        open: true,
                        options,
                        resolve,
                    });
                },
            );
        },
        [],
    );

    const close = useCallback(
        (confirmed: boolean) => {
            state.resolve?.(confirmed);

            setState({
                open: false,
                options: {},
            });
        },
        [state],
    );

    return (
        <ConfirmContext.Provider
            value={{
                confirm,
            }}
        >
            {children}

            <ConfirmDialog
                open={state.open}
                onClose={() =>
                    close(false)
                }
                onConfirm={() => {
                    close(true);
                }}
                title={
                    state.options.title ??
                    "Are you sure?"
                }
                description={
                    state.options.description ??
                    "This action cannot be undone."
                }
                confirmLabel={
                    state.options.confirmLabel ??
                    "Confirm"
                }
                cancelLabel={
                    state.options.cancelLabel ??
                    "Cancel"
                }
                variant={
                    state.options.variant ??
                    "danger"
                }
                destructive={
                    state.options.destructive ??
                    false
                }
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context =
        useContext(ConfirmContext);

    if (!context) {
        throw new Error(
            "useConfirm must be used inside ConfirmProvider.",
        );
    }

    return context.confirm;
}