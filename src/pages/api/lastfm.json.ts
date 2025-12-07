import type { APIRoute } from "astro";

export const prerender = false;

const API = "https://ws.audioscrobbler.com/2.0/";

interface LastfmImage {
    size: string;
    "#text": string;
}

interface LastfmTrack {
    name: string;
    artist: { "#text": string };
    album: { "#text": string };
    url: string;
    image: LastfmImage[];
    "@attr"?: { nowplaying: string };
}

interface LastfmResponse {
    recenttracks: { track: LastfmTrack[] };
}

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
    const apiKey = process.env.LASTFM_API_KEY;
    const user = url.searchParams.get("user") ?? process.env.LASTFM_USERNAME;

    if (!apiKey || !user) {
        return new Response(
            JSON.stringify({ error: "Missing LASTFM_API_KEY or user" }),
            {
                status: 400,
                headers: {
                    "content-type": "application/json",
                    ...corsHeaders(origin)
                }
            }
        );
    }

    const endpoint = `${API}?method=user.getrecenttracks&user=${encodeURIComponent(user)}&api_key=${apiKey}&format=json&limit=1`;
    const res = await fetch(endpoint);

    if (!res.ok) {
        return new Response(
            JSON.stringify({ error: "Failed to reach Last.fm", status: res.status }),
            {
                status: 502,
                headers: {
                    "content-type": "application/json",
                    ...corsHeaders(origin)
                }
            }
        );
    }

    const json = (await res.json()) as LastfmResponse;
    const track = json?.recenttracks?.track?.[0];

    if (!track) {
        return new Response(JSON.stringify({ nowPlaying: false }), {
            status: 200,
            headers: {
                "content-type": "application/json",
                "cache-control": "no-store",
                ...corsHeaders()
            }
        });
    }

    const isPlaying = track["@attr"]?.nowplaying === "true";
    const image = Array.isArray(track.image)
        ? track.image.find((img) => img.size === "extralarge" || img.size === "large")?.[
        "#text"
        ]
        : undefined;
    const payload = {
        nowPlaying: isPlaying,
        name: track.name,
        artist: track.artist?.["#text"],
        album: track.album?.["#text"],
        url: track.url,
        artwork: image || null,
        user
    };

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            ...corsHeaders()
        }
    });
};
