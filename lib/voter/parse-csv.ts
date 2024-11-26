import {ChatOpenAI} from "@langchain/openai";
import {CSVLoader} from "@langchain/community/document_loaders/fs/csv";
import {StringOutputParser} from "@langchain/core/output_parsers";
import * as fs from 'fs';
import * as path from 'path';
import {config} from 'dotenv';
import {createVoterDataTables} from "@/lib/voter/create-tables";
import {TableInfo} from "@/lib/voter/types";

config({
    path: ['.env.local', __dirname + '../../../.env.local'],
});

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("Missing OpenAI API key. Set it in the .env file.");
}

// Function to process a single CSV file and generate a summary
async function generateTableSummary(
    csvPath: string,
    excludeTableNames: string[] = []
): Promise<TableInfo> {
    const excludeListStr = excludeTableNames.join(", ");

    // Load the CSV file
    const csvLoader = new CSVLoader(csvPath);
    const documents = await csvLoader.load();
    const tableStr = documents
        .slice(0, 20) // Take the first 20 rows
        .map(doc => JSON.stringify(doc)) // Convert each row to a JSON string
        .join("\n"); // Join them with a newline character

    // Prepare the prompt
    const prompt = `
Given a CSV file, provide a summary in the following JSON format ONLY.  Do not provide an explanation.
- Include a summary of the row data as a field called summary to describe the contents of the row data.
- The table name must be unique to the table and describe it while being concise.
- The table name should be in lowercase, use underscores to separate words, and must not include any special characters.
- Do NOT output a generic table name (e.g., table, my_table).
- Utilize the source filename as a contextual hint to help generate unique table names.
- For each column, include the PostgresSQL type and description relative to the data in the small sample.
- Do NOT make the table name one of the following:  [${excludeTableNames}].

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
        model: 'gpt-4o',
    });
    const parser = new StringOutputParser();
    const response = await llm.pipe(parser).stream(messages);
    let json = '';
    for await (const rowData of response) {
        json += rowData;
    }
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
            const tableInfo = await generateTableSummary(filePath, tableInfos.map(v => v.table_name));
            tableInfos.push(tableInfo);
        } catch (error) {
            console.error(`Error processing ${filePath}: ${(error as Error).message}`);
        }
    }

    return tableInfos;
}

// Example usage
(async () => {
    try {
        const directoryPath = path.join(__dirname, '../../public/uploads');
        const tableInfos = await processCSVFiles(directoryPath);
        const  { fullSQL, createTableStatements } =await createVoterDataTables(tableInfos)
        console.log("Table Info Results:", fullSQL, createTableStatements);
    } catch (error) {
        console.error("Error:", error);
    }
})();
