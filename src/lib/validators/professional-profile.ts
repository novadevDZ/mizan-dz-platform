import { z } from "zod";

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((value) =>
            value === "" ? undefined : value,
        );

export const professionalProfileSchema = z.object({
    firstName: optionalText(100),

    lastName: optionalText(100),

    jobTitle: optionalText(100),

    department: optionalText(100),

    bio: optionalText(1000),

    phone: optionalText(30),

    avatarUrl: z
        .string()
        .trim()
        .url()
        .max(500)
        .optional()
        .or(z.literal("")),

    skills: optionalText(1000),
});

export type ProfessionalProfileInput = z.infer<
    typeof professionalProfileSchema
>;