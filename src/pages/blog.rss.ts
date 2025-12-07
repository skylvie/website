import blog from "../content/blog.json";
import RSS from "rss";
import { readFile } from "fs/promises";

export async function GET() {
    const posts = (blog as any).posts ?? [];
    const site = process.env.SITE_URL || "http://localhost:4321";

    const feed = new RSS({
        title: "Slyvie's Blog",
        site_url: `${site}/blog`,
        feed_url: `${site}/blog.rss`,
        description: "Posts from Slyvie's Blog"
    });

    for (const post of posts) {
        const filePath = `src/content/blog_posts/${post.id}.md`;
        const body = await readFile(filePath, "utf-8");

        feed.item({
            title: post.title,
            description: post.summary,
            url: `${site}/blog/post/${post.id}`,
            guid: post.id,
            date: post.date,
            custom_elements: [{ "content:encoded": { _cdata: body } }]
        });
    }

    return new Response(feed.xml({ indent: true }), {
        status: 200,
        headers: {
            "content-type": "application/rss+xml; charset=utf-8"
        }
    });
}
