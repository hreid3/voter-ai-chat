	import { z } from "zod";
	import { tool } from "ai";
	import { sql } from '@/lib/voter/db';
	import { encodingForModel } from "js-tiktoken"; // Import js-tiktoken

	type ReturnType = {
		results: string[],
	};
	type ErrorMessage = {
		error: string;
	};

	// Token limit constant
	const TOKEN_LIMIT = 10000;

	/**
	 * @param selects An array of executable select statements.
	 * @return Returns a JSON formatted results set
	 * @throws Error when a non-SQL SELECT statement is detected.
	 * @throws { error: "User-friendly error message when returns are too large" }
	 */
	export const executeSelects = async ({ selects = [] }: { selects: string[] }):
		Promise<ReturnType | ErrorMessage> => {
		try {
			console.log("Called executeSelects", selects);
			const connectionString = process.env.PG_VOTERDATA_URL;

			// Validate that all queries are SELECT statements using RegEx
			const isSelectOnly = selects.every((query) => /^\s*(WITH[\s\S]*?SELECT|SELECT)\s+/i.test(query.trim()));
			if (!isSelectOnly) {
				throw new Error("Only SELECT statements are allowed.");
			}

			// Initialize an array to store the results
			const results: string[] = [];

			// Validate connection string
			if (!connectionString) {
				throw new Error("PG_VOTERDATA_URL environment variable is not set.");
			}

			// Initialize tokenizer for GPT-4 model
			const encoding = encodingForModel("gpt-4"); // Choose the model's tokenizer

			let totalTokenCount = 0;

			for (const selectQuery of selects) {
				const result = await sql.unsafe(selectQuery);
				const resultString = JSON.stringify(result);

				// Tokenize the result string and count tokens
				const tokens = encoding.encode(resultString);
				const tokenCount = tokens.length;

				// Increment total token count
				totalTokenCount += tokenCount;

				// If the token limit is exceeded, throw an error
				if (totalTokenCount > TOKEN_LIMIT) {
					console.error(`Token limit exceeded: ${totalTokenCount} tokens.`);
					return {
						error: `The result set is too large to process (exceeds ${TOKEN_LIMIT} tokens). Please refine your query.`,
					};
				}

				results.push(resultString);
			}

			// Return the results if within the token limit
				return { results };
		} catch (error) {
			console.error("Error executing select statements:", error);
			return {
				error: "Something went wrong, so I could not process your request.",
			};
		}
	};

	// Register the tool for executing SELECT statements on a PostgreSQL database
	export const executeSelectsTool = tool({
		description: "Executes multiple SELECT SQL queries against a PostgreSQL database and returns the results as an array of JSON objects.",
		parameters: z.object({
			selects: z.string().array().describe("An array of valid PostgreSQL SELECT statements to be executed sequentially."),
		}),
		execute: executeSelects,
	});
