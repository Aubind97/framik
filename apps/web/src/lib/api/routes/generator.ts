import { Elysia, t } from "elysia";
import { getWidgetScreenshot } from "$lib/utils/images";

export const generatorRouter = new Elysia({ prefix: "/generator" }).get(
	"",
	async ({ query }) => {
		const orientation = query.orientation;
		const widgetURL = query.widgetURL;

		const base64Img = await getWidgetScreenshot({ orientation, widgetURL });

		return base64Img;
	},
	{
		query: t.Object({
			orientation: t.String(),
			widgetURL: t.String(),
		}),
	},
);
