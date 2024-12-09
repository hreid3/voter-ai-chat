import { tool } from 'ai';
import { z } from 'zod';
import encodeQueryParams from "@/lib/utils";

// Define the response type for fetchStaticMap
type FetchStaticMapResponse =
	| { mapUrl: string } // Success response
	| { error: string }; // Error response

// The function to fetch the static map
export async function fetchStaticMap(endpoint: string): Promise<FetchStaticMapResponse> {
	const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

	// Check if the API key is available
	if (!GOOGLE_API_KEY) {
		return { error: "API key is missing. Please configure GOOGLE_MAPS_API_KEY in your environment." };
	}

	try {
		// Append the API key to the endpoint URL
		const urlWithKey = `${endpoint}&key=${GOOGLE_API_KEY}`;
		const response = await fetch(urlWithKey);

		// Check for errors in the HTTP response
		if (!response.ok) {
			return { error: `Failed to fetch map: ${response.statusText}` };
		}

		// Assuming the response is a direct URL (redirect), return the map URL
	// Check if key exists before appending
		const mapUrl = encodeQueryParams(
			response.url.includes('key=') ? response.url : `${response.url}&key=${GOOGLE_API_KEY}`
		);
		return { mapUrl };
	} catch (err) {
		return { error: `Unexpected error: ${(err as Error).message}` };
	}
}

// Define the Zod schema for the tool parameters
const staticMapSchema = z.object({
	endpoint: z.string()
		.url("The endpoint must be a valid Google Static Maps URL.")
		.describe("A complete Google Maps Static API endpoint URL (excluding the API key)."),
});

// Define the tool using AI.SDK
export const fetchStaticMapTool = tool({
	description: "Generates a static map image from Google Maps API using a pre-constructed endpoint URL. This tool accepts a valid endpoint (excluding the API key) and fetches the map image, returning the image URL.",
	parameters: staticMapSchema,
	execute: async ({ endpoint }: { endpoint: string }) => {
		const result = await fetchStaticMap(endpoint);

		// Return result as-is, adhering to the FetchStaticMapResponse type
		return result;
	},
});
