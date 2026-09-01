"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    FileText,
    Phone,
    User,
} from "lucide-react";

type ProfessionalProfile = {
    id: string;
    userId: string;
    firstName: string | null;
    lastName: string | null;
    jobTitle: string | null;
    department: string | null;
    bio: string | null;
    phone: string | null;
    avatarUrl: string | null;
    skills: string | null;
};

type FormState = {
    firstName: string;
    lastName: string;
    jobTitle: string;
    department: string;
    bio: string;
    phone: string;
    avatarUrl: string;
    skills: string;
};

const initialForm: FormState = {
    firstName: "",
    lastName: "",
    jobTitle: "",
    department: "",
    bio: "",
    phone: "",
    avatarUrl: "",
    skills: "",
};

export default function ProfessionalProfilePage() {
    const router = useRouter();

    const [form, setForm] =
        useState<FormState>(initialForm);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(
        null,
    );

    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            try {
                const response = await fetch(
                    "/api/onboarding/professional-profile",
                    {
                        method: "GET",
                        cache: "no-store",
                    },
                );

                const data =
                    await response
                        .json()
                        .catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        data?.message ??
                        "Failed to load profile",
                    );
                }

                if (
                    !cancelled &&
                    data?.profile
                ) {
                    const profile =
                        data.profile as ProfessionalProfile;

                    setForm({
                        firstName:
                            profile.firstName ?? "",
                        lastName:
                            profile.lastName ?? "",
                        jobTitle:
                            profile.jobTitle ?? "",
                        department:
                            profile.department ?? "",
                        bio: profile.bio ?? "",
                        phone:
                            profile.phone ?? "",
                        avatarUrl:
                            profile.avatarUrl ?? "",
                        skills:
                            profile.skills ?? "",
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error);

                    setError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load profile",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    function updateField(
        field: keyof FormState,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (saving) return;

        setSaving(true);
        setError(null);

        try {
            const existingResponse =
                await fetch(
                    "/api/onboarding/professional-profile",
                    {
                        method: "GET",
                        cache: "no-store",
                    },
                );

            const existingData =
                await existingResponse
                    .json()
                    .catch(() => null);

            if (!existingResponse.ok) {
                throw new Error(
                    existingData?.message ??
                    "Failed to check profile",
                );
            }

            const method =
                existingData?.profile
                    ? "PATCH"
                    : "POST";

            const response =
                await fetch(
                    "/api/onboarding/professional-profile",
                    {
                        method,
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(form),
                    },
                );

            const data =
                await response
                    .json()
                    .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ??
                    "Failed to save profile",
                );
            }

            router.push(
                "/onboarding/join-organization",
            );
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong",
            );

            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-6">
                <div className="text-sm text-muted-foreground">
                    Loading your profile...
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background px-6 py-12">
            <div className="mx-auto w-full max-w-3xl">
                <button
                    type="button"
                    onClick={() =>
                        router.push("/onboarding")
                    }
                    className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    Back
                </button>

                <div className="mb-10">
                    <div className="mb-3 text-sm font-medium text-muted-foreground">
                        Employee onboarding · 1 of 2
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight">
                        Build your professional profile
                    </h1>

                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        Create the profile that represents you
                        professionally inside Mizan DZ.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-8"
                >
                    <section className="rounded-3xl border bg-card p-6 sm:p-8">
                        <div className="mb-6 flex items-start gap-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                                <User className="size-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    Personal information
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Basic information visible
                                    on your professional profile.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="First name"
                                icon={
                                    <User className="size-4" />
                                }
                                value={
                                    form.firstName
                                }
                                onChange={(value) =>
                                    updateField(
                                        "firstName",
                                        value,
                                    )
                                }
                                placeholder="Ahmed"
                            />

                            <Field
                                label="Last name"
                                icon={
                                    <User className="size-4" />
                                }
                                value={
                                    form.lastName
                                }
                                onChange={(value) =>
                                    updateField(
                                        "lastName",
                                        value,
                                    )
                                }
                                placeholder="Benali"
                            />

                            <Field
                                label="Phone"
                                icon={
                                    <Phone className="size-4" />
                                }
                                value={form.phone}
                                onChange={(value) =>
                                    updateField(
                                        "phone",
                                        value,
                                    )
                                }
                                placeholder="0550 00 00 00"
                            />

                            <Field
                                label="Avatar URL"
                                value={
                                    form.avatarUrl
                                }
                                onChange={(value) =>
                                    updateField(
                                        "avatarUrl",
                                        value,
                                    )
                                }
                                placeholder="https://..."
                            />
                        </div>
                    </section>

                    <section className="rounded-3xl border bg-card p-6 sm:p-8">
                        <div className="mb-6 flex items-start gap-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                                <BriefcaseBusiness className="size-5" />
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    Professional information
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tell organizations what you
                                    do and where you specialize.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Job title"
                                icon={
                                    <BriefcaseBusiness className="size-4" />
                                }
                                value={
                                    form.jobTitle
                                }
                                onChange={(value) =>
                                    updateField(
                                        "jobTitle",
                                        value,
                                    )
                                }
                                placeholder="Sales Manager"
                                required
                            />

                            <Field
                                label="Department"
                                icon={
                                    <Building2 className="size-4" />
                                }
                                value={
                                    form.department
                                }
                                onChange={(value) =>
                                    updateField(
                                        "department",
                                        value,
                                    )
                                }
                                placeholder="Sales"
                            />

                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-medium">
                                    Skills
                                </label>

                                <input
                                    type="text"
                                    value={form.skills}
                                    onChange={(event) =>
                                        updateField(
                                            "skills",
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder="CRM, Sales, Negotiation"
                                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                                />

                                <p className="mt-2 text-xs text-muted-foreground">
                                    Separate skills with commas.
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-2 block text-sm font-medium">
                                    Professional bio
                                </label>

                                <div className="relative">
                                    <FileText className="absolute left-4 top-4 size-4 text-muted-foreground" />

                                    <textarea
                                        value={
                                            form.bio
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            updateField(
                                                "bio",
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        rows={5}
                                        placeholder="Tell organizations about your experience and professional background..."
                                        className="w-full resize-none rounded-xl border bg-background py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                                    />
                                </div>

                                <div className="mt-2 text-right text-xs text-muted-foreground">
                                    {form.bio.length}/1000
                                </div>
                            </div>
                        </div>
                    </section>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    "/onboarding",
                                )
                            }
                            className="rounded-xl border px-5 py-3 text-sm font-medium transition hover:bg-muted"
                        >
                            Back
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                !form.jobTitle.trim()
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : "Continue"}

                            {!saving && (
                                <ArrowRight className="size-4" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

type FieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
};

function Field({
                   label,
                   value,
                   onChange,
                   placeholder,
                   required,
                   icon,
               }: FieldProps) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium">
                {label}
                {required && (
                    <span className="ml-1 text-destructive">
                        *
                    </span>
                )}
            </label>

            <div className="relative">
                {icon && (
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {icon}
                    </div>
                )}

                <input
                    type="text"
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    placeholder={placeholder}
                    required={required}
                    className={`w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground ${
                        icon ? "pl-11" : ""
                    }`}
                />
            </div>
        </div>
    );
}