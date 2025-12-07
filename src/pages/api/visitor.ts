import type { APIRoute } from "astro";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export const prerender = false;

const IPS_FILE = join(process.cwd(), "ips.txt");

async function ensureIpsFile() {
	try {
		await readFile(IPS_FILE, "utf-8");
	} catch {
		await writeFile(IPS_FILE, "", "utf-8");
	}
}

function getClientIP(request: Request): string {
	const cfcip = request.headers.get("CF-Connecting-IP");
	if (cfcip) return cfcip;

	const xff = request.headers.get("X-xff-For");
	if (xff) return xff.split(",")[0].trim();

	const xrip = request.headers.get("X-Real-IP");
	if (xrip) return xrip;

	return "127.0.0.1";
}

export const GET: APIRoute = async ({ request }) => {
	await ensureIpsFile();

	const clientIP = getClientIP(request);
	const ipsContent = await readFile(IPS_FILE, "utf-8");
	const ips = ipsContent.split("\n").filter(Boolean);

	let isNewVisitor = false;
	if (!ips.includes(clientIP)) {
		ips.push(clientIP);
		await writeFile(IPS_FILE, ips.join("\n") + "\n", "utf-8");
		isNewVisitor = true;
	}

	const visitorCount = ips.length;

	return new Response(
		JSON.stringify({
			count: visitorCount,
			isNew: isNewVisitor,
		}),
		{
			status: 200,
			headers: {
				"content-type": "application/json",
				"cache-control": "no-store",
			}
		}
	);
};
