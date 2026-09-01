import { z } from "zod";

const PAYMENT_METHODS = [
    "cash",
    "cheque",
    "bank transfer",
    "ccp transfer",
    "baridimob",
    "edahabia",
    "card",
    "other",
] as const;

export const createPaymentSchema =
    z.object({
        saleId: z
            .string()
            .uuid(
                "Invalid sale ID.",
            ),

        amount: z
            .coerce
            .number()
            .finite(
                "Payment amount must be a valid number.",
            )
            .positive(
                "Payment amount must be greater than 0.",
            ),

        paymentMethod:
            z.enum(
                PAYMENT_METHODS,
                {
                    message:
                        "Invalid payment method.",
                },
            ),

        note: z
            .string()
            .trim()
            .max(
                1000,
                "Note must not exceed 1000 characters.",
            )
            .nullable()
            .optional(),
    });

export const updatePaymentSchema =
    z.object({
        amount: z
            .coerce
            .number()
            .finite(
                "Payment amount must be a valid number.",
            )
            .positive(
                "Payment amount must be greater than 0.",
            )
            .optional(),

        paymentMethod:
            z
                .enum(
                    PAYMENT_METHODS,
                    {
                        message:
                            "Invalid payment method.",
                    },
                )
                .optional(),

        note: z
            .string()
            .trim()
            .max(
                1000,
                "Note must not exceed 1000 characters.",
            )
            .nullable()
            .optional(),
    });