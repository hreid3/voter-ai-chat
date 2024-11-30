import postgres from 'postgres';
import { embed, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { findPossiblesSimilarValues } from "@/lib/voter/query/find-possibles-similar-values";

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
export const fetchTableDdls = async ({ userInput, topK = 2 }: {
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

		const connectionString = process.env.PG_VOTERDATA_URL;
		if (!connectionString) {
			throw new Error("Invariant violation: PG_VOTERDATA_URL must be set.");
		}

		const schemaName = process.env.PG_VOTERDATA_SCHEMA || 'fail_badly';

		// Initialize the postgres client after the invariant checks
		const sql = postgres(connectionString, { transform: postgres.camel, prepare: false });

		// Step 1: Generate an embedding for the userInput using OpenAI's Ada model
		const { embedding: userInputEmbedding } = await embed({
			model: openai.embedding('text-embedding-ada-002'),
			value: userInput,
		});

		// Ensure the embedding is an array of numbers
		if (!Array.isArray(userInputEmbedding) || userInputEmbedding.some(Number.isNaN)) {
			throw new Error("Invariant violation: Embedding must be an array of numbers.");
		}

		// Convert embedding array to string representation for SQL
		const arrayEmbeddings = `[${userInputEmbedding.join(',')}]`;

		// Step 2: Use a subquery for similarity-based search on chunk embeddings with a threshold filter
		const similarityThreshold = 0.70; // Define a threshold between 0.0 and 1.0 for filtering

		const query = `
        SELECT vtd.table_ddl
        FROM ${schemaName}.voter_table_ddl AS vtd
        WHERE vtd.primary_key IN (
            SELECT vtde.parent_id
            FROM ${schemaName}.voter_table_ddl_embeddings AS vtde
            WHERE 1 - (vtde.chunk_embedding <=> $1) > ${similarityThreshold}
            ORDER BY vtde.chunk_embedding <=> $1
            LIMIT ${topK}
            );
		`;

		// Execute the query with parameterized embedding input
		const result = await sql.unsafe(query, [arrayEmbeddings]);

		// Extract DDLs from the result and find possible similar values for each DDL
		const ddls = [];
		for (const row of result) {
			const possibleValuesResult = await findPossiblesSimilarValues({
				userInput,
				tableDdl: row.tableDdl,
			});

			// If an error occurs, abort and return an error message
			if ('error' in possibleValuesResult) {
				return { error: "Something went wrong while finding possible values for the columns." };
			}

			ddls.push({
				ddl: row.tableDdl,
				possibleValuesForColumns: possibleValuesResult.possibleValues
			});
		}

		return { ddls };
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
