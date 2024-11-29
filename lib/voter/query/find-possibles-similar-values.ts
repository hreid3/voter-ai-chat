import postgres from 'postgres';
import { tool } from 'ai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { z } from 'zod';
import { OpenAIEmbeddings } from '@langchain/openai';

// Placeholder type definition for return type
type ReturnType = {
	possibleValues: string[];
};

// Function to find possible similar values
export const findPossiblesSimilarValues = async ({ userInput, tableDdl, topK = 3, thres = 0.5 }: { userInput: string, tableDdl: string, topK?: number, thres?: number }): Promise<ReturnType> => {
	// Step 1: Extract the table name from tableDdl using RegEx
	const tableNameMatch = tableDdl.match(/CREATE\s+TABLE\s+(\S+)/i);
	if (!tableNameMatch || !tableNameMatch[1]) {
		throw new Error('Failed to extract the table name from the table DDL.');
	}
	const tableName = tableNameMatch[1];
	const embeddingTableName = `${tableName}_embedding`;

	// Step 2: Create an embedding for the userInput using OpenAI
	const embeddings = new OpenAIEmbeddings({
		modelName: 'text-embedding-ada-002', // Use ADA explicitly
	});

	// Use CharacterTextSplitter to split the text into manageable chunks
	const splitter = new CharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 0 });
	const inputChunks = await splitter.splitText(userInput);

	// Generate embeddings for each chunk and compute the weighted average
	const chunkEmbeddings: number[][] = await Promise.all(
		inputChunks.map((chunk) => embeddings.embedQuery(chunk))
	);

	const computeWeightedAverage = (embeddings: number[][]): number[] => {
		if (embeddings.length === 0) return [];
		const length = embeddings[0].length;
		const average = new Array(length).fill(0);

		embeddings.forEach(embedding => {
			embedding.forEach((value, index) => {
				average[index] += value / embeddings.length;
			});
		});

		return average;
	};

	const arrayEmbeddings = `[${computeWeightedAverage(chunkEmbeddings).join(', ')}]`;

	// Step 3: Ensure PG_VOTERDATA_URL is defined
	const databaseUrl = process.env.PG_VOTERDATA_URL;
	if (!databaseUrl) {
		throw new Error('PG_VOTERDATA_URL environment variable is not set.');
	}

	// Initialize Postgres.js client
	const client = postgres(databaseUrl);
	const schemaName = process.env.PG_VOTERDATA_SCHEMA;
	if (!schemaName) {
		throw new Error('PG_VOTERDATA_SCHEMA environment variable is not set.');
	}

	try {
		// Step 4: Execute a similarity search using pgvector
		const query = `
      SELECT json_string, 1 - (embedding <-> ${arrayEmbeddings}) AS similarity_score
      FROM ${schemaName}.${embeddingTableName}
      WHERE 1 - (embedding <-> ${arrayEmbeddings}) > ${thres}
      ORDER BY similarity_score DESC
      LIMIT ${topK};
    `;

		const result = await client.unsafe(query);

		// Step 5: Extract the results and return them
		const possibleValues = result.map((row: any) => row.json_string);
		return { possibleValues };
	} catch (error) {
		console.error('Error during similarity search:', error);
		throw error;
	} finally {
		// Close the database connection
		await client.end({ timeout: 5 });
	}
};

// Tool configuration using Zod for input validation
export const findPossibleSimilarValuesTool = tool({
	description: 'Finds possible similar values for a user input by searching through embeddings stored in the table derived from a provided CREATE TABLE DDL. The tool is intended to identify records in the database that are similar to a given user input by leveraging vector-based similarity searches. This tool is particularly useful for identifying related records based on textual similarities within a table schema context.',
	parameters: z.object({
		userInput: z.string().describe('The user-provided input that needs to be matched against similar records stored in the embedding table. This input is expected to be a descriptive text or query.'),
		tableDdl: z.string().describe('The DDL of the table used to derive the embedding table name. The input is required to be a CREATE TABLE statement which allows the tool to determine the original table name and consequently identify the associated embeddings table.'),
		topK: z.number().optional().default(3).describe('The number of top similar matches to return based on similarity score. This should be a positive integer indicating how many matches are desired.'),
		thres: z.number().optional().default(0.5).describe('The similarity threshold for filtering out results with low similarity scores. The value must be between 0 and 1, where 1 represents a perfect match. Results below this threshold will be excluded from the output.'),
	}),
	execute: findPossiblesSimilarValues,
});
