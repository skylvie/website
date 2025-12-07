import type { APIRoute } from "astro";

export const prerender = false;

const LANYARD_BASE = "https://api.lanyard.rest/v1/users/";

function corsHeaders(origin?: string): Record<string, string> {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "3600"
    };
}

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || undefined;
    const userId = url.searchParams.get("userId") ?? process.env.DISCORD_USER_ID;

    if (!userId) {
        return new Response(
            JSON.stringify({ error: "Missing userId, Set DISCORD_USER_ID or pass ?userId=" }),
            {
                status: 400,
                headers: {
                    "content-type": "application/json",
                    ...corsHeaders(origin)
                }
            }
        );
    }

    const res = await fetch(`${LANYARD_BASE}${userId}`);

    if (!res.ok) {
        return new Response(
            JSON.stringify({ error: "Failed to reach Lanyard", status: res.status }),
            {
                status: 502,
                headers: {
                    "content-type": "application/json",
                    ...corsHeaders(origin)
                }
            }
        );
    }

    const data = (await res.json()) as Record<string, any>;
    const presence = data?.data;
    const activity = presence?.activities?.find((a: Record<string, any>) => a.type === 4);

    const payload = {
        id: userId,
        status: presence?.discord_status ?? null,
        customStatus: activity?.state ?? null,
        avatar: presence?.discord_user?.avatar ?? null,
        username: presence?.discord_user?.username ?? null,
        globalName: presence?.discord_user?.global_name ?? null,
        listening: presence?.spotify ?? null,
        activities: presence?.activities ?? []
    };

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            ...corsHeaders(origin)
        }
    });
};

