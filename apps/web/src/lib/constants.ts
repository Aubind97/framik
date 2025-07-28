export const SCREENS = {
	"7.3_WAVESHARE_COLORS_E": {
		resolution: {
			width: 800,
			height: 480,
		},
	},
} as const;

export const WIDGETS = {
	unsplash: {
		disabled: false,
		name: "Unsplash",
		logoLight: "/logos/unsplash_light.svg",
		logoDark: "/logos/unsplash_dark.svg",
		description: "Get random images from an excellent photo gallery",
	},
	immich: {
		disabled: true,
		name: "Immich",
		logoLight: "/logos/immich.svg",
		logoDark: "/logos/immich.svg",
		description: "Get random images from your personal Immich gallery",
	},
	image_upload: {
		disabled: true,
		name: "Image upload",
		logoLight: undefined,
		logoDark: undefined,
		description: "Upload an image to show it on the frame",
	},
	calendar: {
		disabled: true,
		name: "Calendar",
		logoLight: undefined,
		logoDark: undefined,
		description: "Show your agenda using calDav urls",
	},
	weather: {
		disabled: true,
		name: "Weather",
		logoLight: undefined,
		logoDark: undefined,
		description: "Display the current and forecasted weather",
	},
} as const;
