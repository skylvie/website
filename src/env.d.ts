/// <reference types="astro/client" />
declare module "rss" {
    interface RSSOptions {
        title: string;
        site_url: string;
        feed_url: string;
        description: string;
    }

    interface RSSItem {
        title: string;
        description: string;
        url: string;
        guid: string;
        date: string;
        custom_elements?: Array<Record<string, any>>;
    }

    class RSS {
        constructor(options: RSSOptions);
        item(item: RSSItem): void;
        xml(options?: any): string;
    }
    export default RSS;
}

declare module "markdown-it" {
    interface MarkdownItOptions {
        html?: boolean;
        linkify?: boolean;
        breaks?: boolean;
        highlight?: (code: string, lang: string) => string;
    }

    class MarkdownIt {
        constructor(options?: MarkdownItOptions);
        render(markdown: string): string;
        utils: {
            escapeHtml(str: string): string;
        };
    }

    export default MarkdownIt;
}
