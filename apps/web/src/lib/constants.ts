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
		logo: "/logos/unsplash.svg",
		description: "Get random images from an excellent photo gallery",
	},
	immich: {
		disabled: true,
		name: "Immich",
		logo: "/logos/immich.svg",
		description: "Get random images from your personal Immich gallery",
	},
	image_upload: {
		disabled: true,
		name: "Image upload",
		logo: undefined,
		description: "Upload an image to show it on the frame",
	},
	calendar: {
		disabled: true,
		name: "Calendar",
		logo: undefined,
		description: "Show your agenda using calDav urls",
	},
	weather: {
		disabled: true,
		name: "Weather",
		logo: undefined,
		description: "Display the current and forecasted weather",
	},
} as const;
