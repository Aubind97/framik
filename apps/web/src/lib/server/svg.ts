export const WIDTH = 800;
export const HEIGHT = 480;
export const MONO_FONT = "DejaVu Sans Mono, DejaVu Sans, monospace";

// Measured panel colours (EPAPER_PALETTE in @framik/shared): exact matches dither to solid ink
export const INK = { black: "#000000", white: "#ffffff", red: "#bf0000", blue: "#6440ff", green: "#438a1c" } as const;

// DejaVu Sans Mono advance width per unit of font size
const MONO_ADVANCE = 0.602;

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// DejaVu has no colour emoji: they would render as empty boxes
const stripEmoji = (text: string) =>
	text
		.replace(/\p{Extended_Pictographic}|\u{FE0F}|\u{200D}/gu, "")
		.replace(/\s+/g, " ")
		.trim();

const monoChars = (fontSize: number, maxWidth: number) => Math.floor(maxWidth / (fontSize * MONO_ADVANCE));
export const monoWidth = (chars: number, fontSize: number) => chars * fontSize * MONO_ADVANCE;

/** Cleans untrusted text, truncates it to fit `maxWidth` in the mono font, and escapes it for SVG. */
export function fitText(text: string, fontSize: number, maxWidth: number) {
	const clean = stripEmoji(text);
	const max = monoChars(fontSize, maxWidth);
	return escapeXml(clean.length > max ? `${clean.slice(0, max - 1)}…` : clean);
}

export function formatAge(date: string | Date, now = new Date()) {
	const minutes = Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / 60_000));
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d`;
	if (days < 365) return `${Math.floor(days / 30)}mo`;
	return `${Math.floor(days / 365)}y`;
}

/** Fetches a GitHub avatar as a data URI to embed in the SVG; null when unavailable. */
export async function fetchAvatar(url: string): Promise<string | null> {
	const parsed = URL.parse(url);
	// Only GitHub's avatar host: the URL comes from API data
	if (parsed?.protocol !== "https:" || parsed.hostname !== "avatars.githubusercontent.com") return null;

	try {
		const response = await fetch(parsed, { redirect: "error", signal: AbortSignal.timeout(10_000) });
		const type = response.headers.get("content-type") ?? "";
		if (!response.ok || !/^image\/(png|jpeg)$/.test(type)) return null;
		return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
	} catch {
		return null;
	}
}

export function avatarImage(id: string, href: string | null, x: number, y: number, size: number) {
	if (!href) return "";
	return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size / 5}"/></clipPath><image href="${href}" x="${x}" y="${y}" width="${size}" height="${size}" clip-path="url(#${id})"/>`;
}

export const svgDocument = (body: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="${MONO_FONT}" fill="${INK.black}"><rect width="${WIDTH}" height="${HEIGHT}" fill="${INK.white}"/>${body}</svg>`;
