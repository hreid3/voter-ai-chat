import { ChatOpenAI } from "@langchain/openai";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { config } from 'dotenv';
import { createVoterDataTables, dropAllTables } from "@/lib/voter/import/create-tables";
import type { ParsedRecord, TableInfo } from "@/lib/voter/import/types";
import { vectorIndexTables } from "@/lib/voter/import/vector-index-tables";
import { insertParsedCsvRecords } from "@/lib/voter/import/insert-voter-row-data";

config({
    path: ['.env.local', path.join(__dirname, '../../../.env.local')],
});

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("Missing OpenAI API key. Set it in the .env file.");
}
const connectionString = process.env.PG_VOTERDATA_URL;

if (!process.env.PG_VOTERDATA_URL || !process.env.PG_VOTERDATA_SCHEMA) {
    throw new Error("Missing VOTERDATA_URL or PG_VOTERDATA_SCHEMA. Set it in the .env file.");
}
// Function to process a single CSV file and generate a summary
async function generateTableSummary(documents: any[],
    excludeTableNames: string[] = []
): Promise<TableInfo> {
    // Load the CSV file
    const tableStr = documents.slice(0, 20)

    const prompt = `
Given a CSV file, provide a summary in the following JSON format ONLY.  Do not provide an explanation.
- Include a summary of the row data as a field called summary to describe the contents of the row data.
- IMPORTANT: The summary needs to be human meaningful that includes the human readable table name with a minimum of 20 TOKENS and a maximum of 30 tokens!
- The table name should consist of the filename that has semantic meaning to voter registration. Omit any text that appear to be coded from the table name.  E.g. for file name tbl_prod_GABU202012_new_records.csv, omit the "tbl_prod_GABU202012", and use "new_records" as part of the name to keep it's semantic meaning.
- The table name should be in lowercase, use underscores to separate words, and must not include any special characters.
- Do NOT output a generic table name (e.g., table, my_table, voter_data).
- For each column, include the PostgresSQL type and description relative to the data in the small sample.
- Do NOT make the table name one of the following:  [${excludeTableNames}].
- Use Postgres timestamp type for both Date and DateTime values.
- Only use VARCHAR and TIMESTAMP Postgres COLUMN Types.  NO CHAR TYPES!
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
    "column3": {
      "type": "type of column3",
      "description": "description of column3"
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
                'JSON must be parseable.  DO NOT use Markdown'
        },
        {
            role: 'user',
            content: prompt
        }
    ]
    // Use OpenAI to process the request
    const llm = new ChatOpenAI({
        temperature: 0,
        openAIApiKey: apiKey,
        model: 'gpt-3.5-turbo',
    });
    const parser = new StringOutputParser();
    console.log("Interacting with LLM...")
    const response = await llm.pipe(parser).stream(messages);
    let json = '';
    for await (const rowData of response) {
        json += rowData;
    }
    console.log("DONE:  Interacting with LLM...")
    return JSON.parse(json);
}

// Function to traverse a directory and process all CSV files
async function processCSVFiles(directoryPath: string) {
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.csv'));

	try {
    for (const [index, file] of files?.entries()) {

			if (index === 0) {
				await dropAllTables()
			}

			const filePath = path.join(directoryPath, file);
			console.log(`Processing file: ${filePath}`);

			const csvLoader = new CSVLoader(filePath, { separator: '|' });
			const documents = await csvLoader.load();
			const tableInfo = await generateTableSummary(documents);
			tableInfo.documents = documents as unknown as ParsedRecord

			const { tableDdls } = await createVoterDataTables([tableInfo])
			console.log("Inserting rows into ", tableInfo.table_name)
			await insertParsedCsvRecords(tableInfo.documents as unknown as ParsedRecord[], tableInfo)
			console.log("Done inserting rows into ", tableInfo.table_name)

			const success = await vectorIndexTables(tableDdls);
			console.log(`Done Processing file: ${filePath}`);
		}
		console.log("Done loading & processing CSV....");
		process.exit(0);
	} catch (error) {
			console.error("Error processing CSV Files", error);
			throw error;
	}
    // Now we need to insert the rows into the databalse.
  return true;
    // return tableInfos;
}

// Example usage
(async () => {
    try {
        const directoryPath = path.join(__dirname, '../../../public/uploads');
        const tableInfos = await processCSVFiles(directoryPath);
        // console.log("Table Info Results:", fullSQL, tableDdls);
    } catch (error) {
        console.error("Error:", error);
    }
})();
