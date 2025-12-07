import type { APIRoute } from "astro";

export const prerender = false;

function buildHeaders(): Record<string, string> {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
        "User-Agent": "SylvNET"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function parseSlug(raw: string | null): string | null {
    if (!raw) return null;

    try {
        if (raw.includes("github.com")) {
            const url = new URL(raw);
            const [owner, repo] = url.pathname.replace(/^\//, "").split("/");
            return owner && repo ? `${owner}/${repo}` : null;
        }
    } catch { }

    const cleaned = raw.replace(/^\//, "");
    const parts = cleaned.split("/");

    return parts.length === 2 ? cleaned : null;
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
    const slug = parseSlug(url.searchParams.get("repo"));

    if (!slug) {
        return new Response(
            JSON.stringify({ error: "Pass ?repo=owner/name or a GitHub URL" }),
            {
                status: 400,
                headers: {
                    "content-type": "application/json",
                    ...corsHeaders(origin)
                }
            }
        );
    }

    const repoRes = await fetch(`https://api.github.com/repos/${slug}`, {
        headers: buildHeaders()
    });

    if (!repoRes.ok) {
        return new Response(
            JSON.stringify({ error: "GitHub repo not found", status: repoRes.status }),
            {
                status: repoRes.status,
                headers: {
                    "content-type": "application/json",
                    ...corsHeaders(origin)
                }
            }
        );
    }

    const repo = (await repoRes.json()) as Record<string, any>;
    let topLanguage = repo.language;

    try {
        const langRes = await fetch(`https://api.github.com/repos/${slug}/languages`, {
            headers: buildHeaders()
        });
        if (langRes.ok) {
            const langJson = (await langRes.json()) as Record<string, number>;
            const entries = Object.entries(langJson).sort((a, b) => b[1] - a[1]);
    
            if (entries[0]?.[0]) {
                topLanguage = entries[0][0];
            }
        }
    } catch { }

    const payload = {
        repo: slug,
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: topLanguage,
        homepage: repo.homepage,
        url: repo.html_url
    };

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            "content-type": "application/json",
            "cache-control": "s-maxage=120, stale-while-revalidate=300",
            ...corsHeaders(origin)
        }
    });
};
