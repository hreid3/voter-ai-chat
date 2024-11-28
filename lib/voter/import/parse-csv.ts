import {ChatOpenAI} from "@langchain/openai";
import {CSVLoader} from "@langchain/community/document_loaders/fs/csv";
import {StringOutputParser} from "@langchain/core/output_parsers";
import * as fs from 'node:fs';
import * as path from 'node:path';
import {config} from 'dotenv';
import {createVoterDataTables} from "@/lib/voter/import/create-tables";
import type {ParsedRecord, TableInfo} from "@/lib/voter/import/types";
import {vectorIndexTables} from "@/lib/voter/import/vector-index-tables";
import {insertParsedCsvRecords} from "@/lib/voter/import/insert-voter-row-data";

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
    const tableStr = documents
        .slice(0, 20)
        .map((doc: any) => JSON.stringify(doc))
        .join("\n");

    const prompt = `
Given a CSV file, provide a summary in the following JSON format ONLY.  Do not provide an explanation.
- Include a summary of the row data as a field called summary to describe the contents of the row data.
- The table name must be unique to the table and describe it while being concise.
- The table name should be in lowercase, use underscores to separate words, and must not include any special characters.
- Do NOT output a generic table name (e.g., table, my_table).
- Utilize the source filename as a contextual hint to help generate unique table names.
- For each column, include the PostgresSQL type and description relative to the data in the small sample.
- Do NOT make the table name one of the following:  [${excludeTableNames}].
- Use Postgres timestamp type for both Date and DateTime values.
- Only use VARCHAR and TIMESTAMP Postgres COLUMN Types.  NO CHAR TYPES!

Output Format:
{
  "file_name": "file name",
  "table_name": "the table name",
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
${tableStr}
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

    const tableInfos: TableInfo[] = [];

    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        console.log(`Processing file: ${filePath}`);

        try {
            const csvLoader = new CSVLoader(filePath);
            const documents = await csvLoader.load();
            const tableInfo = await generateTableSummary(documents, tableInfos.map(v => v.table_name));
            tableInfo.documents = documents as unknown as ParsedRecord
            tableInfos.push(tableInfo);
        } catch (error) {
            console.error(`Error processing ${filePath}: ${(error as Error).message}`);
            throw error
        }
    }

    try {
        const {fullSQL, tableDdls} = await createVoterDataTables(tableInfos)
        for(const tableDef of tableInfos) {
            console.log("Inserting rows into ", tableDef.table_name)
            await insertParsedCsvRecords(tableDef.documents as unknown as ParsedRecord[], tableDef)
            console.log("Done inserting rows into ", tableDef.table_name)
        }

        const success = await vectorIndexTables(tableDdls);
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
