import { tool } from 'ai';
import { z } from 'zod';

type DdlResult = {
	ddl: string,
	possibleValuesForColumns: string[]
};

type ReturnType = {
	ddls: DdlResult[]
};

type ErrorMessage = {
	error: string
};

/**
 * Searches the vector store for top_k matches based on the user input.
 * The following DDL is searched:
 * - CREATE TABLE IF NOT EXISTS ${schemaName}.${chunkTableName} (
 *     id SERIAL PRIMARY KEY,
 *     parent_id INTEGER NOT NULL REFERENCES ${schemaName}.${voterTableName}(primary_key),
 *     chunk_embedding VECTOR(1536),
 *     chunk_index INTEGER NOT NULL
 * )
 *
 * @param userInput User-provided input to search against table DDLs.
 * @param topK Number of top matches to return (default: 2).
 * @return An array of strings where each value represents a DDL of potential matches.
 */
export const fetchTableDdls = async ({userInput, topK = 2}: {
	userInput: string,
	topK?: number
}): Promise<ReturnType | ErrorMessage> => {
	console.log("Called: fetchTableDdls, received user input", userInput);

	try {
		// Invariant checks
		if (!userInput) {
			throw new Error("Invariant violation: userInput must not be empty.");
		}
		if (topK <= 0) {
			throw new Error("Invariant violation: topK must be greater than 0.");
		}

		const ddls = [];
		ddls.push({
			possibleValuesForColumns: [],
			// Now that I am refactoring for final system state, removed the Similarity Search as there is really one single table.
			// The other tables only denormalized deltas
			/* The following was gnerated by Chat GPT 3.5 Turbo when inserting rows. */
			ddl: `
CREATE TABLE public.voter_all_data (
    county_code VARCHAR,
    registration_number VARCHAR,
    voter_status VARCHAR,
    residence_city VARCHAR,
    residence_zipcode VARCHAR,
    birthyear VARCHAR,
    registration_date TIMESTAMP,
    race VARCHAR,
    gender VARCHAR,
    land_district VARCHAR,
    land_lot VARCHAR,
    status_reason VARCHAR, -- Reason for status change in voter registration
    county_precinct_id VARCHAR,
    city_precinct_id VARCHAR,
    congressional_district VARCHAR,
    senate_district VARCHAR,
    house_district VARCHAR,
    judicial_district VARCHAR,
    commission_district VARCHAR,
    school_district VARCHAR,
    county_districta_name VARCHAR,
    county_districta_value VARCHAR,
    county_districtb_name VARCHAR,
    county_districtb_value VARCHAR,
    municipal_name VARCHAR,
    municipal_code VARCHAR, -- Unique code representing the municipality
    ward_city_council_name VARCHAR,
    ward_city_council_code VARCHAR,
    city_school_district_name VARCHAR,
    city_school_district_value VARCHAR,
    city_dista_name VARCHAR,
    city_dista_value VARCHAR,
    city_distb_name VARCHAR,
    city_distb_value VARCHAR,
    city_distc_name VARCHAR,
    city_distc_value VARCHAR,
    city_distd_name VARCHAR,
    city_distd_value VARCHAR,
    date_last_voted TIMESTAMP,
    party_last_voted VARCHAR,
    date_added TIMESTAMP,
    date_changed TIMESTAMP,
    district_combo VARCHAR, -- Encoded combination of district information
    race_desc VARCHAR,
    last_contact_date TIMESTAMP
);
    `
		})
		return {ddls};
	} catch (error) {
		console.error("Error fetching table DDLs:", error);
		return {
			error: "Something went wrong, so I could not process your request."
		};
	}
};

// Example of registering the tool for executing SELECT statements
export const fetchTableDdlTool = tool({
	description: "REQUIRED: provides a DDL for the table to query.",
	parameters: z.object({
	userInput: z.string().describe('The complete user-provided input.'),
		// topK: z.number().optional().default(2).describe('The maximum number of top results to return from the similarity search. This defines how many table DDLs will be presented based on their similarity score relative to the user input. It should be a positive integer, with higher values returning more possible matches. Default value is set to 2, which provides a balanced set of results without overwhelming the user.')
	}),
	execute: fetchTableDdls,
});
