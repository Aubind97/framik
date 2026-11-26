import { applyDitheringNode } from "@framik/shared/node";

export async function pushImageToDaemon(daemonUrl: string, base64Image: string): Promise<string> {
	const response = await fetch(`${daemonUrl}/frame/push`, {
		method: "POST",
		body: JSON.stringify({ base64Img: await applyDitheringNode(base64Image) }),
		headers: { "Content-Type": "application/json" },
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`Daemon responded ${response.status}: ${text}`);
	return text;
}
