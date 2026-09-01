"use client";

import {
    Building2,
    CheckCircle2,
    ChevronDown,
    Loader2,
    MapPin,
    Phone,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ApiErrorShape = {
    code?: string;
    message?: string;
};

type ApiResponse<T = unknown> = {
    success?: boolean;
    data?: T;
    error?: ApiErrorShape;
    message?: string;
};

type OrganizationResponse = {
    organization: {
        id: string;
        authOrganizationId: string;
        name: string;
        phone: string;
        address: string | null;
        wilaya: string;
        currency: string;
    };

    membership: {
        id: string;
        organizationId: string;
        userId: string;
        role: string;
    };

    authOrganization: {
        id: string;
        name: string;
        slug: string;
    };

    activeOrganizationId: string;
};

const WILAYAS = [
    "Adrar",
    "Chlef",
    "Laghouat",
    "Oum El Bouaghi",
    "Batna",
    "Béjaïa",
    "Biskra",
    "Béchar",
    "Blida",
    "Bouira",
    "Tamanrasset",
    "Tébessa",
    "Tlemcen",
    "Tiaret",
    "Tizi Ouzou",
    "Algiers",
    "Djelfa",
    "Jijel",
    "Sétif",
    "Saïda",
    "Skikda",
    "Sidi Bel Abbès",
    "Annaba",
    "Guelma",
    "Constantine",
    "Médéa",
    "Mostaganem",
    "M'Sila",
    "Mascara",
    "Ouargla",
    "Oran",
    "El Bayadh",
    "Illizi",
    "Bordj Bou Arréridj",
    "Boumerdès",
    "El Tarf",
    "Tindouf",
    "Tissemsilt",
    "El Oued",
    "Khenchela",
    "Souk Ahras",
    "Tipaza",
    "Mila",
    "Aïn Defla",
    "Naâma",
    "Aïn Témouchent",
    "Ghardaïa",
    "Relizane",
    "Timimoun",
    "Bordj Badji Mokhtar",
    "Ouled Djellal",
    "Béni Abbès",
    "In Salah",
    "In Guezzam",
    "Touggourt",
    "Djanet",
    "El Meghaier",
    "El Meniaa",
] as const;

const CURRENCIES = [
    {
        value: "DZD",
        label: "Algerian Dinar (DZD)",
    },
    {
        value: "EUR",
        label: "Euro (EUR)",
    },
    {
        value: "USD",
        label: "US Dollar (USD)",
    },
] as const;

function getApiErrorMessage(
    result: ApiResponse,
    fallback: string,
) {
    return (
        result.error?.message ??
        result.message ??
        fallback
    );
}

function slugify(value: string) {
    return value
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "")
        .slice(0, 48);
}

export default function CreateOrganizationForm() {
    const router = useRouter();

    const [name, setName] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [address, setAddress] =
        useState("");

    const [wilaya, setWilaya] =
        useState("");

    const [currency, setCurrency] =
        useState("DZD");

    const [slug, setSlug] =
        useState("");

    const [slugManuallyEdited, setSlugManuallyEdited] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const generatedSlug = useMemo(
        () => slugify(name),
        [name],
    );

    function handleNameChange(
        value: string,
    ) {
        setName(value);

        if (!slugManuallyEdited) {
            setSlug(slugify(value));
        }

        if (error) {
            setError(null);
        }
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (loading) {
            return;
        }

        const normalizedName =
            name.trim();

        const normalizedPhone =
            phone
                .replace(/\s+/g, "")
                .trim();

        const normalizedAddress =
            address.trim();

        const normalizedWilaya =
            wilaya.trim();

        const normalizedSlug =
            (slug.trim() ||
                generatedSlug)
                .toLowerCase();

        if (
            normalizedName.length < 2 ||
            normalizedName.length > 120
        ) {
            setError(
                "Business name must contain between 2 and 120 characters.",
            );
            return;
        }

        if (
            !/^(0[567]\d{8}|\+213[567]\d{8})$/.test(
                normalizedPhone,
            )
        ) {
            setError(
                "Enter a valid Algerian phone number, for example 0551234567.",
            );
            return;
        }

        if (!normalizedWilaya) {
            setError(
                "Please select your wilaya.",
            );
            return;
        }

        if (
            !normalizedSlug ||
            normalizedSlug.length < 3 ||
            normalizedSlug.length > 48 ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
                normalizedSlug,
            )
        ) {
            setError(
                "Slug must contain 3-48 lowercase letters, numbers and single hyphens.",
            );
            return;
        }

        setLoading(true);
        setError(null);

        void submitOrganization({
            name: normalizedName,
            phone: normalizedPhone,
            address:
                normalizedAddress ||
                null,
            wilaya: normalizedWilaya,
            currency,
            slug: normalizedSlug,
        });
    }

    async function submitOrganization(
        payload: {
            name: string;
            phone: string;
            address: string | null;
            wilaya: string;
            currency: string;
            slug: string;
        },
    ) {
        try {
            const response =
                await fetch(
                    "/api/organizations",
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            Accept:
                                "application/json",
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            payload,
                        ),
                    },
                );

            const raw =
                await response.text();

            let result:
                ApiResponse<OrganizationResponse> =
                {};

            if (raw.trim()) {
                try {
                    result =
                        JSON.parse(
                            raw,
                        ) as ApiResponse<OrganizationResponse>;
                } catch {
                    console.error(
                        "[CreateOrganization] Invalid JSON response:",
                        raw,
                    );

                    setError(
                        "The server returned an invalid response.",
                    );

                    return;
                }
            }

            if (!response.ok) {
                const message =
                    getApiErrorMessage(
                        result,
                        `Unable to create your business (${response.status}).`,
                    );

                console.error(
                    "[CreateOrganization] API error:",
                    {
                        status:
                        response.status,
                        result,
                        raw,
                    },
                );

                setError(message);
                return;
            }

            if (
                result.success === false
            ) {
                setError(
                    getApiErrorMessage(
                        result,
                        "Unable to create your business.",
                    ),
                );
                return;
            }

            /*
             * At this point the API has:
             *
             * 1. Created Better Auth organization
             * 2. Created Mizan organization
             * 3. Created owner membership
             * 4. Set the active organization
             * 5. Returned the active organization
             *
             * The response cookies are handled by
             * the browser automatically.
             */
            router.replace(
                "/dashboard",
            );

            router.refresh();
        } catch (caughtError) {
            console.error(
                "[CreateOrganization] Request failed:",
                caughtError,
            );

            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Unable to connect to the server.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-2xl">
            {/* Brand / introduction */}
            <div className="mb-6 text-center sm:mb-8">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                    <Building2 className="h-6 w-6" />
                </div>

                <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                    Mizan DZ
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)] sm:text-3xl">
                    Create your business workspace
                </h1>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                    Set up your business once. Mizan will use
                    this workspace to manage customers, sales,
                    invoices, products and payments.
                </p>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="mizan-card overflow-hidden"
                noValidate
            >
                {/* Top */}
                <div className="border-b border-[var(--border-soft)] px-5 py-4 sm:px-7">
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--mizan-blue-soft)] text-[var(--primary)]">
                            <Sparkles className="h-4 w-4" />
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-[var(--text-primary)]">
                                Business information
                            </h2>

                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                Tell us about your business.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error ? (
                    <div className="border-b border-[var(--danger)]/20 bg-[var(--danger-soft)] px-5 py-4 sm:px-7">
                        <p
                            role="alert"
                            aria-live="assertive"
                            className="text-sm font-medium text-[var(--danger)]"
                        >
                            {error}
                        </p>
                    </div>
                ) : null}

                <div className="space-y-5 p-5 sm:p-7">
                    {/* Business name */}
                    <div>
                        <label
                            htmlFor="organization-name"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Business name
                            <span className="ml-1 text-[var(--danger)]">
                                *
                            </span>
                        </label>

                        <input
                            id="organization-name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                handleNameChange(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="e.g. Mizan Store"
                            autoComplete="organization"
                            autoFocus
                            disabled={loading}
                            maxLength={120}
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label
                            htmlFor="organization-phone"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Business phone
                            <span className="ml-1 text-[var(--danger)]">
                                *
                            </span>
                        </label>

                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

                            <input
                                id="organization-phone"
                                name="phone"
                                type="tel"
                                value={phone}
                                onChange={(
                                    event,
                                ) =>
                                    setPhone(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="0551 23 45 67"
                                autoComplete="tel"
                                disabled={loading}
                                maxLength={20}
                                className="pl-10"
                                required
                            />
                        </div>

                        <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                            Example: 0551234567
                        </p>
                    </div>

                    {/* Wilaya */}
                    <div>
                        <label
                            htmlFor="organization-wilaya"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Wilaya
                            <span className="ml-1 text-[var(--danger)]">
                                *
                            </span>
                        </label>

                        <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

                            <select
                                id="organization-wilaya"
                                name="wilaya"
                                value={
                                    wilaya
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setWilaya(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                disabled={
                                    loading
                                }
                                className="h-11 pl-10 pr-10"
                                required
                            >
                                <option value="">
                                    Select wilaya
                                </option>

                                {WILAYAS.map(
                                    (
                                        item,
                                    ) => (
                                        <option
                                            key={
                                                item
                                            }
                                            value={
                                                item
                                            }
                                        >
                                            {
                                                item
                                            }
                                        </option>
                                    ),
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label
                            htmlFor="organization-address"
                            className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                        >
                            Address
                        </label>

                        <input
                            id="organization-address"
                            name="address"
                            type="text"
                            value={address}
                            onChange={(
                                event,
                            ) =>
                                setAddress(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Business address"
                            autoComplete="street-address"
                            disabled={loading}
                            maxLength={255}
                        />
                    </div>

                    {/* Currency + slug */}
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="organization-currency"
                                className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                            >
                                Currency
                            </label>

                            <div className="relative">
                                <select
                                    id="organization-currency"
                                    name="currency"
                                    value={
                                        currency
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setCurrency(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="h-11 pr-10"
                                >
                                    {CURRENCIES.map(
                                        (
                                            item,
                                        ) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="organization-slug"
                                className="mb-2 block text-xs font-semibold text-[var(--text-primary)]"
                            >
                                Workspace slug
                            </label>

                            <input
                                id="organization-slug"
                                name="slug"
                                type="text"
                                value={
                                    slug
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setSlug(
                                        event
                                            .target
                                            .value
                                            .toLowerCase(),
                                    );

                                    setSlugManuallyEdited(
                                        true,
                                    );
                                }}
                                placeholder="mizan-store"
                                disabled={
                                    loading
                                }
                                maxLength={48}
                                autoComplete="off"
                                spellCheck={
                                    false
                                }
                            />

                            <p className="mt-1.5 truncate text-[11px] text-[var(--text-muted)]">
                                Your business workspace identifier.
                            </p>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            Workspace preview
                        </p>

                        <div className="mt-3 flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)] text-white">
                                <Building2 className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                    {name.trim() ||
                                        "Your business"}
                                </p>

                                <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                                    {slug.trim() ||
                                        generatedSlug ||
                                        "your-business"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mizan-primary-action w-full"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}

                        <span className="ml-2">
                            {loading
                                ? "Creating workspace..."
                                : "Create business workspace"}
                        </span>
                    </button>

                    <p className="text-center text-[11px] leading-5 text-[var(--text-muted)]">
                        By creating the workspace, you become
                        its owner and can manage its business
                        data and members.
                    </p>
                </div>
            </form>
        </div>
    );
}