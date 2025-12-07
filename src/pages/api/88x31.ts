import type { APIRoute } from "astro";
import { readdir } from "fs/promises";
import { join } from "path";

export const prerender = false;

const BUTTONS_DIR = join(process.cwd(), "public", "88x31");

export const GET: APIRoute = async () => {
	try {
		const files = await readdir(BUTTONS_DIR);
		const buttons = files
			.filter((file) => /\.(png|gif|jpg|jpeg|webp)$/i.test(file))
			.map((file) => `/88x31/${file}`);

		return new Response(JSON.stringify({ buttons }), {
			status: 200,
			headers: {
				"content-type": "application/json",
				"cache-control": "public, max-age=3600",
			},
		});
	} catch {
		return new Response(
			JSON.stringify({ buttons: [], error: "Failed to read buttons directory" }),
			{
				status: 500,
				headers: {
					"content-type": "application/json",
				}
			}
		);
	}
};
