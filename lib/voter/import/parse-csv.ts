import { ChatOpenAI } from "@langchain/openai";
import * as fs from 'node:fs';
import * as path from 'node:path';
import CsvReadableStream from 'csv-reader';
import { config } from 'dotenv';
import { createVoterDataTables, dropAllTables } from "@/lib/voter/import/create-tables";
import type { ParsedRecord, TableInfo } from "@/lib/voter/import/types";
import { vectorIndexTable } from "@/lib/voter/import/vector-index-table";
import { insertParsedCsvRecords } from "@/lib/voter/import/insert-voter-row-data";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Load environment variables
config({
	path: ['.env.local', path.join(__dirname, '../../../.env.local')],
});

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
	throw new Error("Missing OpenAI API key. Set it in the .env file.");
}
const connectionString = process.env.PG_VOTERDATA_URL;
if (!connectionString || !process.env.PG_VOTERDATA_SCHEMA) {
	throw new Error("Missing VOTERDATA_URL or PG_VOTERDATA_SCHEMA. Set it in the .env file.");
}

const BATCH_SIZE = 500;

// Function to process a single CSV file and generate a summary
async function generateTableSummary(documents: ParsedRecord[],
																		excludeTableNames: string[] = []
): Promise<TableInfo> {
	const tableStr = documents.slice(0, 20);
	const prompt = `
Given a CSV file, provide a summary in the following JSON format ONLY. Do not provide an explanation.
- Include a summary of the row data as a field called summary to describe the contents of the row data.
- IMPORTANT: The summary needs to be human meaningful that includes the human readable table name with a minimum of 20 TOKENS and a maximum of 30 tokens!
- The table name should consist of the filename that has semantic meaning to voter registration. Omit any text that appear to be coded from the table name. E.g. for file name tbl_prod_GABU202012_new_records.csv, omit the "tbl_prod_GABU202012", and use "new_records" as part of the name to keep its semantic meaning.
- The table name should be in lowercase, use underscores to separate words, and must not include any special characters.
- Do NOT output a generic table name (e.g., table, my_table, voter_data).
- For each column, include the PostgresSQL type and description relative to the data in the small sample.
- Do NOT make the table name one of the following: [${excludeTableNames}].
- Use Postgres timestamp type for both Date and DateTime values.
- Only use VARCHAR and TIMESTAMP Postgres COLUMN Types. NO CHAR TYPES!
- Prepend voter_ to the table name for easy identification.

Output Format:
{
  "file_name": "file name",
  "table_name": "voter_the_table_name",
  "summary": "The Summary",
  "columns": {
    "column1": {
      "type": "type of column1",
      "description": "description of column1"
    },
    "column2": {
      "type": "type of column2",
      "description": "description of column2"
    },
    // additional columns as needed
  }
}

TABULAR_DATA:
${JSON.stringify(tableStr)}
`;
	const messages = [
		{
			role: 'system',
			content: 'You are a helpful assistant that will provide ONLY VALID JSON responses.' +
				'JSON must be parseable. DO NOT use Markdown'
		},
		{
			role: 'user',
			content: prompt
		}
	];

	// Use OpenAI to process the request
	const llm = new ChatOpenAI({
		temperature: 0,
		openAIApiKey: apiKey,
		model: 'gpt-3.5-turbo',
	});

	const parser = new StringOutputParser();
	console.log("Interacting with LLM...");
	const response = await llm.pipe(parser).stream(messages);
	let json = '';
	for await (const rowData of response) {
		json += rowData;
	}
	console.log("DONE: Interacting with LLM...");
	return JSON.parse(json);
}

// Function to insert parsed CSV records into the database
async function processBatch(batch: ParsedRecord[], tableInfo: TableInfo, totalInsertedRecordsParam: number): Promise<number> {
	let totalInsertedRecords = totalInsertedRecordsParam
	await insertParsedCsvRecords(batch, tableInfo);
	totalInsertedRecords += batch.length;
	if (totalInsertedRecords % 10000 === 0) {
		process.stdout.write('. ');
	}
	return totalInsertedRecords;
}

// Function to traverse a directory and process all CSV files
async function processCSVFiles(directoryPath: string): Promise<boolean> {
	const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.csv'));

	try {
		for (const [index, file] of files.entries()) {
			if (index === 0) {
				await dropAllTables();
			}

			const filePath = path.join(directoryPath, file);
			console.log(`Processing file: ${filePath}`);

			const inputStream = fs.createReadStream(filePath, 'utf8');
			const csvStream = inputStream.pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: false, asObject: true, trim: true, delimiter: '|' }));

			const documents: ParsedRecord[] = [];
			let currentBatch: ParsedRecord[] = [];
			let lineNumber = 0;
			let totalInsertedRecords = 0;
			let tableInfo: TableInfo | null = null;

			for await (const row of csvStream) {
				lineNumber++;

				// Skip if the row is the header (assuming header row has a specific attribute)
				if ('header' in row) {
					continue;
				}

				const parsedRecord: ParsedRecord = {
					pageContent: JSON.stringify(row),
					metadata: {
						source: filePath,
						line: lineNumber,
					}
				};

				currentBatch.push(parsedRecord);
				documents.push(parsedRecord);

				// Generate table summary with the first batch
				if (lineNumber === BATCH_SIZE && !tableInfo) {
					tableInfo = await generateTableSummary(currentBatch);
					console.log(`Inserting Rows Into: ${tableInfo.table_name}`);
					tableInfo.documents = documents as any;

					const { tableDdls } = await createVoterDataTables([tableInfo]);
					totalInsertedRecords = await processBatch(currentBatch, tableInfo, totalInsertedRecords);

					const success = tableDdls?.[0] && await vectorIndexTable(tableDdls?.[0]);
					console.log(`Created table: ${tableInfo.table_name}`);
					currentBatch = []; // Clear the batch after inserting
				}

				// When batch size limit is reached, process it
				if (currentBatch.length >= BATCH_SIZE && tableInfo) {
					totalInsertedRecords = await processBatch(currentBatch, tableInfo, totalInsertedRecords);
					currentBatch = [];
				}
			}

			// Process any remaining batch after reading the whole CSV
			if (currentBatch.length > 0 && tableInfo) {
				totalInsertedRecords = await processBatch(currentBatch, tableInfo, totalInsertedRecords);
			}

			console.log(`\nTotal inserted records for file ${filePath}: ${totalInsertedRecords}`);
			console.log(`Done Processing file: ${filePath}`);
		}

		console.log("Done loading & processing CSV....");
		process.exit(0);
	} catch (error) {
		console.error("Error processing CSV Files", error);
		throw error;
	}

	return true;
}

// Example usage
(async () => {
	try {
		const directoryPath = path.join(__dirname, '../../../public/uploads');
		await processCSVFiles(directoryPath);
	} catch (error) {
		console.error("Error:", error);
	}
})();
