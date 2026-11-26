export const TEMPERATURE_UNITS = {
	celsius: { label: "Celsius (°C)", symbol: "°C" },
	fahrenheit: { label: "Fahrenheit (°F)", symbol: "°F" },
} as const;

export const WEATHER_FORECASTS = {
	days: { label: "Next days", description: "The current weather, then the next 7 days." },
	hours: { label: "Next hours", description: "The current weather, then the temperature and chance of rain over the next 24 hours." },
	none: { label: "Nothing", description: "The current weather alone, in big." },
} as const;

export type WeatherLocation = { name: string; region: string; country: string; latitude: number; longitude: number };
export type WeatherConfig = WeatherLocation & { unit: keyof typeof TEMPERATURE_UNITS; forecast: keyof typeof WEATHER_FORECASTS };
