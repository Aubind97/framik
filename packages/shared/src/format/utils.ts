export function getInitials(name: string | undefined): string {
	return (name ?? 'Unknown')
		.split(/\s+/) // Split by whitespace
		.map((word) => word.replace(/[^a-zA-Z]/g, "")) // Remove special characters
		.filter((word) => word.length > 0) // Filter out empty strings
		.map((word) => word.charAt(0).toUpperCase()) // Get first letter and uppercase
		.join("");
}
