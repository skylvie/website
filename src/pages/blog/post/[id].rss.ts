import type { APIRoute } from "astro";
import RSS from "rss";
import { readFile } from "fs/promises";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: true, linkify: true, breaks: true });

export async function getStaticPaths() {
    const blog = await import("../../../content/blog.json");
    const posts = (blog.default as any).posts ?? [];

    return posts.map((post: any) => ({ params: { id: post.id } }));
}

export const prerender = true;

export const GET: APIRoute = async ({ params }) => {
    const id = params?.id as string;
    const blog = await import("../../../content/blog.json");
    const posts = (blog.default as any).posts ?? [];
    const meta = posts.find((p: any) => p.id === id);

    if (!meta) {
        return new Response("Not found", { status: 404 });
    }

    const site = process.env.SITE_URL || "http://localhost:4321";
    const filePath = `src/content/blog_posts/${id}.md`;
    const markdown = await readFile(filePath, "utf-8");
    const html = md.render(markdown);
    const feed = new RSS({
        title: `${meta.title} | SylvNET`,
        site_url: `${site}/blog/post/${id}`,
        feed_url: `${site}/blog/post/${id}.rss`,
        description: meta.summary
    });

    feed.item({
        title: meta.title,
        description: meta.summary,
        url: `${site}/blog/post/${id}`,
        guid: id,
        date: meta.date,
        custom_elements: [{ "content:encoded": { _cdata: html } }]
    });

    return new Response(feed.xml({ indent: true }), {
        status: 200,
        headers: { "content-type": "application/rss+xml; charset=utf-8" }
    });
};
