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
"CREATE TABLE public.voter_all_data (
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
    status_reason VARCHAR,
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
    municipal_code VARCHAR,
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
    district_combo VARCHAR,
    race_desc VARCHAR,
    last_contact_date TIMESTAMP);
    
    
COMMENT ON TABLE public.voter_all_data IS 'voter data for all Georgia, USA';

COMMENT ON COLUMN public.voter_all_data.county_code IS 'County code of the voter';
COMMENT ON COLUMN public.voter_all_data.registration_number IS 'Registration number of the voter';
COMMENT ON COLUMN public.voter_all_data.voter_status IS 'Status of the voter registration';
COMMENT ON COLUMN public.voter_all_data.residence_city IS 'City of residence of the voter';
COMMENT ON COLUMN public.voter_all_data.residence_zipcode IS 'Zip code of the voter''s residence';
COMMENT ON COLUMN public.voter_all_data.birthyear IS 'Birth year of the voter';
COMMENT ON COLUMN public.voter_all_data.registration_date IS 'Date of voter registration';
COMMENT ON COLUMN public.voter_all_data.race IS 'Race of the voter';
COMMENT ON COLUMN public.voter_all_data.gender IS 'Gender of the voter';
COMMENT ON COLUMN public.voter_all_data.land_district IS 'Land district information';
COMMENT ON COLUMN public.voter_all_data.land_lot IS 'Land lot information';
COMMENT ON COLUMN public.voter_all_data.status_reason IS 'Reason for status change';
COMMENT ON COLUMN public.voter_all_data.county_precinct_id IS 'County precinct ID';
COMMENT ON COLUMN public.voter_all_data.city_precinct_id IS 'City precinct ID';
COMMENT ON COLUMN public.voter_all_data.congressional_district IS 'Congressional district of the voter';
COMMENT ON COLUMN public.voter_all_data.senate_district IS 'Senate district of the voter';
COMMENT ON COLUMN public.voter_all_data.house_district IS 'House district of the voter';
COMMENT ON COLUMN public.voter_all_data.judicial_district IS 'Judicial district of the voter';
COMMENT ON COLUMN public.voter_all_data.commission_district IS 'Commission district of the voter';
COMMENT ON COLUMN public.voter_all_data.school_district IS 'School district of the voter';
COMMENT ON COLUMN public.voter_all_data.county_districta_name IS 'Name of county district A';
COMMENT ON COLUMN public.voter_all_data.county_districta_value IS 'Value of county district A';
COMMENT ON COLUMN public.voter_all_data.county_districtb_name IS 'Name of county district B';
COMMENT ON COLUMN public.voter_all_data.county_districtb_value IS 'Value of county district B';
COMMENT ON COLUMN public.voter_all_data.municipal_name IS 'Name of the municipality';
COMMENT ON COLUMN public.voter_all_data.municipal_code IS 'Code of the municipality';
COMMENT ON COLUMN public.voter_all_data.ward_city_council_name IS 'Name of ward city council';
COMMENT ON COLUMN public.voter_all_data.ward_city_council_code IS 'Code of ward city council';
COMMENT ON COLUMN public.voter_all_data.city_school_district_name IS 'Name of city school district';
COMMENT ON COLUMN public.voter_all_data.city_school_district_value IS 'Value of city school district';
COMMENT ON COLUMN public.voter_all_data.city_dista_name IS 'Name of city district A';
COMMENT ON COLUMN public.voter_all_data.city_dista_value IS 'Value of city district A';
COMMENT ON COLUMN public.voter_all_data.city_distb_name IS 'Name of city district B';
COMMENT ON COLUMN public.voter_all_data.city_distb_value IS 'Value of city district B';
COMMENT ON COLUMN public.voter_all_data.city_distc_name IS 'Name of city district C';
COMMENT ON COLUMN public.voter_all_data.city_distc_value IS 'Value of city district C';
COMMENT ON COLUMN public.voter_all_data.city_distd_name IS 'Name of city district D';
COMMENT ON COLUMN public.voter_all_data.city_distd_value IS 'Value of city district D';
COMMENT ON COLUMN public.voter_all_data.date_last_voted IS 'Date when the voter last voted';
COMMENT ON COLUMN public.voter_all_data.party_last_voted IS 'Party the voter last voted for';
COMMENT ON COLUMN public.voter_all_data.date_added IS 'Date when the voter was added';
COMMENT ON COLUMN public.voter_all_data.date_changed IS 'Date when voter information was last changed';
COMMENT ON COLUMN public.voter_all_data.district_combo IS 'District combination information';
COMMENT ON COLUMN public.voter_all_data.race_desc IS 'Description of the voter''s race';
COMMENT ON COLUMN public.voter_all_data.last_contact_date IS 'Date of the last contact with the voter';
"`
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
	description: "Searches the vector store for table definitions (DDLs) based on user-provided input. This tool utilizes vector embeddings to determine which DDLs are most similar to the user's input, allowing the user to find matching table definitions that align with their search query. It is especially useful for identifying specific database tables based on schema information.",
	parameters: z.object({
		userInput: z.string().describe('The complete user-provided input for searching the vector store. This input is expected to be descriptive and related to the table information being sought, such as keywords, phrases, or any identifying attributes about the database structure that the user is interested in finding.'),
		topK: z.number().optional().default(2).describe('The maximum number of top results to return from the similarity search. This defines how many table DDLs will be presented based on their similarity score relative to the user input. It should be a positive integer, with higher values returning more possible matches. Default value is set to 2, which provides a balanced set of results without overwhelming the user.')
	}),
	execute: fetchTableDdls,
});
