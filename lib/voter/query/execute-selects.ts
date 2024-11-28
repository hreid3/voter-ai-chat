import { z } from "zod";
import { tool } from "ai";
import postgres from 'postgres';

type ReturnType = {
  results: string[],
}
/**
 * @param selects An array of executable select statements.
 * @return Returns a JSON formatted results set
 * @throws Error when a non SQL SELECT Statement is detected.
 */
export const executeSelects = async ({ selects = [] }: { selects: string[] }): Promise<ReturnType> => {
  console.log("Called executeSelects", selects);
  const connectionString = process.env.PG_VOTERDATA_URL || 'fail-badly';
  const sql = postgres(connectionString);

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
  try {
    for (const selectQuery of selects) {
      const result = await sql.unsafe(selectQuery);
      results.push(JSON.stringify(result));
    }
  } catch (error) {
    console.error("Error executing select statements:", error);
    throw error;
  } finally {
    // No need to explicitly close connection for postgres.js client as it uses a connection pool internally
  }

  return { results };
};

// Register the tool for executing SELECT statements
export const executeSelectsTool = tool({
  description: "Executes multiple select queries and returns an array of results in JSON format.",
  parameters: z.object({
    selects: z.string().array().describe("The select statements to run against the database"),
  }),
  execute: executeSelects,
});
