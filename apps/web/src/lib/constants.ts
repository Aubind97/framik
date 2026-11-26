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
		requires: undefined,
	},
	immich: {
		disabled: false,
		name: "Immich",
		logoLight: "/logos/immich.svg",
		logoDark: "/logos/immich.svg",
		description: "Pick a photo from your personal Immich library",
		requires: "immich",
	},
	image_upload: {
		disabled: false,
		name: "Image upload",
		logoLight: undefined,
		logoDark: undefined,
		description: "Upload an image to show it on the frame",
		requires: undefined,
	},
	github: {
		disabled: false,
		name: "GitHub",
		logoLight: "/logos/github_light.svg",
		logoDark: "/logos/github_dark.svg",
		description: "Show contributions, repository activity or releases on a frame",
		requires: undefined,
	},
	presidential_2027: {
		disabled: false,
		name: "Présidentielle 2027",
		logoLight: "/logos/presidential_light.svg",
		logoDark: "/logos/presidential_dark.svg",
		description: "Poll average for the 2027 French presidential election, from Wikipedia",
		requires: undefined,
	},
	calendar: {
		disabled: true,
		name: "Calendar",
		logoLight: undefined,
		logoDark: undefined,
		description: "Show your agenda using calDav urls",
		requires: undefined,
	},
	weather: {
		disabled: true,
		name: "Weather",
		logoLight: undefined,
		logoDark: undefined,
		description: "Display the current and forecasted weather",
		requires: undefined,
	},
} as const;

export const INTEGRATIONS = {
	immich: {
		name: "Immich",
		settingsUrl: "/app/account/settings",
	},
	github: {
		name: "GitHub",
		settingsUrl: "/app/account/settings",
	},
} as const;
