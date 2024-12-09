import { tool } from "ai";
import { z } from "zod";
import encodeQueryParams from "@/lib/utils";

// Define the response type for fetchStaticChart
type FetchStaticChartResponse =
	| { chartUrl: string } // Success response
	| { error: string }; // Error response

// The function to fetch the static map
export async function fetchStaticChart(
	quickChartUrl: string
): Promise<FetchStaticChartResponse> {
	try {
		// Encode the query parameters and generate the final URL
		const chartUrl = encodeQueryParams(quickChartUrl);
		return { chartUrl };
	} catch (err) {
		return { error: `Unexpected error: ${(err as Error).message}` };
	}
}

// Define the Zod schema for the tool parameters
const staticChartSchema = z.object({
	quickChartUrl: z
		.string()
		.url("The quickChartUrl must be a valid QuickChart.io URL.")
		.describe("The quickChartUrl must be a valid QuickCharts.io image URL."),
});

// Define the tool using AI.SDK
export const fetchStaticChartTool = tool({
	description:
		"Generates a static image from QuickChart.io using a pre-constructed quickChartURL.",
	parameters: staticChartSchema,
	execute: async ({ quickChartUrl }: { quickChartUrl: string }) => {
		const result = await fetchStaticChart(quickChartUrl);

		// Return result as-is, adhering to the FetchStaticChartResponse type
		return result;
	},
});
