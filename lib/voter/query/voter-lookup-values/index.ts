import { z } from 'zod';
import { tool } from 'ai';
import county_code from "@/lib/voter/query/voter-lookup-values/county_code";
import congressional_district from "@/lib/voter/query/voter-lookup-values/congressional_district";
import senate_district from "@/lib/voter/query/voter-lookup-values/senate_district";
import house_district from "@/lib/voter/query/voter-lookup-values/house_district";
import judicial_district from "@/lib/voter/query/voter-lookup-values/judicial_district";
import school_district from "@/lib/voter/query/voter-lookup-values/school_district";
// import race_desc from "@/lib/voter/query/voter-lookup-values/race_desc";
import race from "@/lib/voter/query/voter-lookup-values/race";

/**
 * Type definition for ColumnValues - defines different structures for potential return values.
 */
type ColumnValues = string | string[] | Record<string, string> | Record<number, { name: string; party: string }>;
/**
 * Centralized definition for column values mapping
 */
const columnValuesMapping: { [key: string]: ColumnValues } = {
	voter_status: {
		Active: "A",
		Inactive: "I",
	},
	county_code,
	status_reason: ["NCOA", "No Contact", "Returned Mail"],
	congressional_district,
	senate_district,
	house_district,
	judicial_district,
	school_district,
	last_party_voted: {
		D: "Democrat",
		N: "None",
		NP: "No Party Preference",
		R: "Republican",
	},
	// race_desc,
	race,
	gender: {
		F: "Female",
		M: "Male",
		O: "Other",
	},
};

/**
 * Schema for the function input - an array of keys to fetch values from the voter data lookup.
 */
const FetchVoterDataLookupValuesInputSchema = z.array(z.string()).describe('An array of keys to fetch corresponding values from the column values mapping');

/**
 * Register the tool for fetching voter data lookup values based on keys.
 */
export const voterDataColumnLookupTool = tool({
	description: "Fetches voter data lookup values for given keys from columns defined in voter tables in the database. This tool is useful for retrieving structured data to help formulate valid SQL queries based on the user input",
	parameters: z.object({
		keys: FetchVoterDataLookupValuesInputSchema,
	}),
	execute: async (params) => {
		return params.keys.map((key) => {
			if (key in columnValuesMapping) {
				return columnValuesMapping[key as keyof typeof columnValuesMapping];
			}
			return null;
		});
	},
});

/**
 * Register the tool for listing all keys in the columnValuesMapping.
 */
export const listVoterDataMappingKeysTool = tool({
	description: "Lists all available keys from the voter data column values mapping. This tool is useful for providing the Agent with an overview of all available fields that have mapping values.",
	parameters: z.object({}),
	execute: async () => {
		return Object.keys(columnValuesMapping);
	},
});

export default voterDataColumnLookupTool;
