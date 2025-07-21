import type { EPaperDriver } from "@framink/epaper_driver";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["@framik", "screen"]);

let frame: EPaperDriver | null = null;
export let updateDate: number | null = null;

async function getFrame() {
	if (Bun.env.SKIP_FRAME_UPDATE === "true") {
		logger.debug`[SKIP FRAME CALLS] The frame can only be controlled from a raspberry. If you are not in a raspberry, all calls will be skipped`;
		return frame;
	}

	if (frame === null) {
		logger.info`Create frame instance`;

		const FrameDriver = await import("@framink/epaper_driver").then((module) => module.EPaperDriver);
		frame = new FrameDriver();
	}

	return frame;
}

export async function showImageOnFrame() {
	updateDate = Date.now();
}

export async function clearFrame() {
	const frame = await getFrame();

	if (!frame) {
		logger.info`No frame instance available`;
		return;
	}

	const WHITE = await import("@framink/epaper_driver").then((module) => module.Colors.WHITE);
	logger.info`Init frame`;
	frame.init();
	logger.info`Frame initialization DONE`;

	// Clear the display with white
	logger.info`Start to clear the frame`;
	frame.clear(WHITE);
	logger.info`Frame clean up DONE`;
}

export async function turnOnSleepMode() {
	const frame = await getFrame();

	if (!frame) {
		logger.info`No frame instance available`;
		return;
	}

	frame.sleep();
	frame.exit();
	logger.info`Frame in sleep mode`;
}

export async function refresh() {
	logger.info`To preserve screen integrity, refresh the current image`;

	await clearFrame();
	// TO DO: Reload current image;
	await showImageOnFrame();
	await turnOnSleepMode();

	updateDate = Date.now();

	logger.info`Refresh DONE`;
}
