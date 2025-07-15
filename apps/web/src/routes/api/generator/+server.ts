import puppeteer from "puppeteer";
import { SCREENS } from "$lib/constants";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const orientation = url.searchParams.get("orientation") ?? "landscape";
	const widgetURL = url.searchParams.get("widgetURL") ?? "https://github.com/Aubind97";

	const screenInfo = SCREENS["7.3_WAVESHARE_COLORS_E"];

	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	await page.setViewport({
		width: screenInfo.resolution.width,
		height: screenInfo.resolution.height,
		isLandscape: orientation === "landscape",
	});

	await page.goto(widgetURL, { waitUntil: "networkidle0" });

	const base64Img = await page.screenshot({ encoding: "base64", type: "png" });
	await browser.close();

	return new Response(base64Img);
};
