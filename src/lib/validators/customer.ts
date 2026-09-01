import { z } from "zod";

const phoneRegex =
    /^(0(5|6|7)\d{8}|\+213(5|6|7)\d{8})$/;

export const createCustomerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Customer name must be at least 2 characters.")
        .max(120),

    phone: z
        .string()
        .trim()
        .regex(
            phoneRegex,
            "Invalid Algerian phone number.",
        ),

    email: z
        .string()
        .trim()
        .email()
        .max(255)
        .optional()
        .or(z.literal("")),

    address: z
        .string()
        .trim()
        .max(500)
        .optional()
        .or(z.literal("")),

    notes: z
        .string()
        .trim()
        .max(2000)
        .optional()
        .or(z.literal("")),
});

export const updateCustomerSchema =
    createCustomerSchema.partial();

export type CreateCustomerInput =
    z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput =
    z.infer<typeof updateCustomerSchema>;