import type { EPaperDriver } from "@framik/epaper_driver";
import { getLogger } from "@logtape/logtape";
import sharp from "sharp";

export const CURRENT_IMAGE = "./current_img.jpeg";

const logger = getLogger(["@framik", "screen"]);

let _frame: EPaperDriver | null = null;

async function getFrame() {
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

export async function showImageOnFrame(rgbBuffer: Buffer<ArrayBufferLike>, info: { width: number; height: number }, frame?: EPaperDriver | null) {
	const usedFrame = frame ?? (await getFrame());

	if (!usedFrame) {
		logger.info`No frame instance available`;
		return;
	}

	// Ensure frame is properly initialized before buffer operations
	if (!usedFrame.isInitialized) {
		logger.info`Frame not initialized, initializing now`;
		usedFrame.init();
	}

	// Create a proper copy of the buffer to avoid memory issues
	const rgbBufferCopy = new Uint8Array(rgbBuffer.length);
	rgbBufferCopy.set(new Uint8Array(rgbBuffer));

	const displayBuffer = usedFrame.createBufferFromRGB(rgbBufferCopy, info.width, info.height);

	await clearFrame(usedFrame);
	await new Promise((resolve) => setTimeout(resolve, 3000));

	logger.info`Start to show the image`;
	usedFrame.display(displayBuffer);
	logger.info`Image displayed`;
	await new Promise((resolve) => setTimeout(resolve, 1000));

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

	// Try to load currentImg
	try {
		const { data: rgbBuffer, info } = await sharp(CURRENT_IMAGE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
		if (rgbBuffer) {
			await showImageOnFrame(rgbBuffer, info, frame);
		}
	} catch (err) {
		logger.info`Fail to reload image or there is no image to reload: ${err}`;
	}

	await turnOnSleepMode(frame);

	logger.info`Refresh DONE`;
}
