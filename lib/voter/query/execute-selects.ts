import { z } from "zod";
import { tool } from "ai";
import { sql } from '@/lib/voter/db'

type ReturnType = {
  results: string[],
}
type ErrorMessage = {
	error: string
}

/**
 * @param selects An array of executable select statements.
 * @return Returns a JSON formatted results set
 * @throws Error when a non SQL SELECT Statement is detected.
 */
export const executeSelects = async ({ selects = [] }: { selects: string[] }):
	Promise<Promise<ReturnType> | Promise<ErrorMessage>> => {
	try {
		console.log("Called executeSelects", selects);
		const connectionString = process.env.PG_VOTERDATA_URL || 'fail-badly';

		// Validate that all queries are SELECT statements using RegEx
		const isSelectOnly = selects.every((query) => /^SELECT\s+/i.test(query.trim()));
		if (!isSelectOnly) {
			throw new Error("Only SELECT statements are allowed.");
		}

		// Initialize an array to store the results
		const results: string[] = [];

		// Validate connection string
		if (!connectionString) {
			throw new Error("PG_VOTERDATA_URL environment variable is not set.");
		}
    for (const selectQuery of selects) {
      const result = await sql.unsafe(selectQuery);
      results.push(JSON.stringify(result));
    }

		return { results };
  } catch (error) {
    console.error("Error executing select statements:", error);
		return {
			error: "Something, went wrong so I could not process your request."
		};
  } finally {
    // No need to explicitly close connection for postgres.js client as it uses a connection pool internally
  }
};

// Register the tool for executing SELECT statements on a PostgreSQL database
export const executeSelectsTool = tool({
	description: "Executes multiple SELECT SQL queries against a PostgreSQL database and returns the results as an array of JSON objects. This tool is particularly useful for querying multiple data sources or tables in a single request, enabling efficient retrieval of structured data based on user-defined queries.",
	parameters: z.object({
		selects: z.string().array().describe("An array of valid PostgreSQL SELECT statements to be executed sequentially. Each statement must be syntactically correct and query the appropriate database tables. Ensure the statements do not modify the database state and are strictly SELECT operations to avoid unintended side effects."),
	}),
	execute: executeSelects,
});
