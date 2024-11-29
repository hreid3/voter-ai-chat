import postgres from 'postgres';
import { embed, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

type ReturnType = {
    ddls: string[]
};
/**
 * Searches the vector store for top_k matches based on the user input.
 * The following DDL is searched:
 * - CREATE TABLE IF NOT EXISTS ${schemaName}.${voterTableName} (primary_key SERIAL PRIMARY KEY, table_name VARCHAR(255) NOT NULL, table_ddl TEXT NOT NULL, table_embedding VECTOR(1536), updated TIMESTAMPTZ DEFAULT NOW() NOT NULL)
 * - CREATE TABLE IF NOT EXISTS ${schemaName}.${chunkTableName} (id SERIAL PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES ${schemaName}.${voterTableName}(primary_key), chunk_embedding VECTOR(1536), chunk_index INTEGER NOT NULL)
 *
 * @param userInput User-provided input to search against table DDLs.
 * @param topK Number of top matches to return (default: 2).
 * @return An array of strings where each value represents a DDL of potential matches.
 */
export const fetchTableDdls = async ({ userInput, topK = 2 }: { userInput: string, topK?: number }): Promise<ReturnType> => {
    console.log("Called: fetchTableDdls, received user input", userInput);

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

    try {
        // Step 1: Generate an embedding for the userInput using OpenAI's Ada model
        const { embedding: userInputEmbedding } = await embed({
            model: openai.embedding('text-embedding-ada-002'),
            value: userInput,
        });

        // Convert embedding array to string representation
        const arrayEmbeddings = `[${userInputEmbedding.join(',')}]`;

        // Ensure the embedding is an array of numbers
        if (!Array.isArray(userInputEmbedding) || userInputEmbedding.some(Number.isNaN)) {
            throw new Error("Invariant violation: Embedding must be an array of numbers.");
        }

        // Step 2: Search for top_k matches using pgvector similarity search with similarity score greater than 0.7
        const query = `
            SELECT vtd.table_ddl, 1 - (vte.chunk_embedding <-> '${arrayEmbeddings}') AS similarity_score
            FROM ${schemaName}.voter_table_ddl_embeddings AS vte
                     INNER JOIN ${schemaName}.voter_table_ddl AS vtd
                                ON vte.parent_id = vtd.primary_key
            WHERE 1 - (vte.chunk_embedding <-> '${arrayEmbeddings}') > 0.15
            ORDER BY similarity_score DESC
                LIMIT ${topK};
        `;

        const result = await sql.unsafe(query);

        // Extract DDLs from the result
        const ddls = result.map(row => row.tableDdl);
        return { ddls };
    } catch (error) {
        console.error("Error fetching table DDLs:", error);
        throw error;
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
