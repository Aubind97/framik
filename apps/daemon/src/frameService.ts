import type { EPaperDriver } from "@framik/epaper_driver";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["@framik", "screen"]);

let _frame: EPaperDriver | null = null;
export let updateDate: number | null = null;

// To avoid screen burning, avoid updating the screen more than 15 seconds
export const MAXIMUM_UPDATE_RATE = 15 * 1000;

async function getFrame() {
	updateDate = Date.now();

	if (Bun.env.SKIP_FRAME_UPDATE === "true") {
		logger.debug`[SKIP FRAME CALLS] The frame can only be controlled from a raspberry. If you are not in a raspberry, all calls will be skipped`;
		return _frame;
	}

	if (_frame === null) {
		logger.info`Create frame instance`;

		const FrameDriver = await import("@framik/epaper_driver").then((module) => module.EPaperDriver);
		_frame = new FrameDriver();
	}

	return _frame;
}

export async function showImageOnFrame(frame?: EPaperDriver | null) {
	const usedFrame = frame ?? (await getFrame());

	if (!usedFrame) {
		logger.info`No frame instance available`;
		return;
	}

	await clearFrame(usedFrame);
	usedFrame.show7Block();
	await new Promise((resolve) => setTimeout(resolve, 3000));

	await turnOnSleepMode(usedFrame);
}

export async function clearFrame(frame?: EPaperDriver | null) {
	const usedFrame = frame ?? (await getFrame());

	if (!usedFrame) {
		logger.info`No frame instance available`;
		return;
	}

	const { Colors } = await import("@framik/epaper_driver");
	const WHITE = Colors.WHITE;

	logger.info`Init frame`;
	usedFrame.init();
	logger.info`Frame initialization DONE`;

	// Clear the display with white
	logger.info`Start to clear the frame`;
	usedFrame.clear(WHITE);
	logger.info`Frame clean up DONE`;
}

export async function turnOnSleepMode(frame?: EPaperDriver | null) {
	const usedFrame = frame ?? (await getFrame());

	if (!usedFrame) {
		logger.info`No frame instance available`;
		return;
	}

	usedFrame.sleep();
	usedFrame.exit();
	logger.info`Frame in sleep mode`;
}

export async function refresh() {
	logger.info`To preserve screen integrity, refresh the current image`;

	const frame = await getFrame();

	await clearFrame(frame);
	// TO DO: Reload current image;
	await showImageOnFrame(frame);
	await turnOnSleepMode(frame);

	logger.info`Refresh DONE`;
}
