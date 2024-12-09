import { tool } from "ai";
import { z } from "zod";

type QuickChartConfig = Record<string, unknown>;

type FetchStaticChartResponse =
	| { chartUrl: string }
	| { error: string };

async function fetchStaticChart(
	quickChartConfiguration: QuickChartConfig
): Promise<FetchStaticChartResponse> {
	try {
		const quickChartIoBase = "https://quickchart.io/chart";
		const url = new URL(quickChartIoBase);
		// Configuration is already JSON
		url.searchParams.set("c", JSON.stringify(quickChartConfiguration));
		const chartUrl = url.toString();
		return { chartUrl };
	} catch (err) {
		return { error: `Unexpected error: ${(err as Error).message}` };
	}
}

// Define the Zod schema for the tool parameters
const staticChartSchema = z.object({
	quickChartConfiguration: z
		.string()
		.describe("MUST be a valid JSON string matching QuickChart.io configuration format"),
});

// Use z.infer to match the schema exactly
type StaticChartArgs = z.infer<typeof staticChartSchema>;

export const fetchStaticChartTool = tool({
	description: "Generates a static image from QuickChart JSON configuration string",
	parameters: staticChartSchema,
	execute: async (args: StaticChartArgs) => {
		const { quickChartConfiguration } = args;

		try {
			// Parse the JSON string to validate it
			const config = JSON.parse(quickChartConfiguration);

			// Validate the parsed configuration
			if (typeof config !== "object" || config === null) {
				return { error: "Invalid QuickChart configuration: must be a JSON object" };
			}

			// Pass the parsed object
			const result = await fetchStaticChart(config as QuickChartConfig);
			return result;
		} catch (err) {
			return { error: `Invalid JSON: ${(err as Error).message}` };
		}
	},
});
