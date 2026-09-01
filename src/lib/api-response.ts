import {NextResponse} from "next/server";

export function apiError(
    message: string,
    status: number,
) {
    return NextResponse.json(
        {
            success: false,
            error: {
                message,
            },
        },
        {status},
    );
}

export function apiSuccess<T>(
    data: T,
    status = 200,
) {
    return NextResponse.json(
        {
            success: true,
            data,
        },
        {status},
    );
}