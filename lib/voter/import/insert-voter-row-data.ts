import postgres from 'postgres';
import moment from 'moment';
import type { TableInfo } from "@/lib/voter/import/types";
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';

interface ParsedRecord {
	pageContent: string;
	metadata: {
		source: string;
		line: number;
	};
}

// Batch size configuration changed to 500
const BATCH_SIZE = 500;

export const insertParsedCsvRecords = async (parsedRecords: ParsedRecord[], tableInfo: TableInfo): Promise<void> => {
	// Ensure PG_VOTERDATA_URL is defined
	const databaseUrl = process.env.PG_VOTERDATA_URL;
	if (!databaseUrl) {
		throw new Error("PG_VOTERDATA_URL environment variable is not set.");
	}
	const splitter = new CharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 0 });

	// Initialize Postgres.js client
	const client = postgres(databaseUrl);
	const schemaName = process.env.PG_VOTERDATA_SCHEMA;
	if (!schemaName) {
		throw new Error("PG_VOTERDATA_SCHEMA environment variable is not set.");
	}

	const { table_name: tableName, columns } = tableInfo;
	const fullTableName = `${schemaName}.${tableName}`;
	const embeddingTableName = `${fullTableName}_embedding`;

	// Initialize counters for logging
	let totalInsertedRecords = 0;
	let totalInsertedEmbeddings = 0;

	try {
		console.log(`Starting batch insertion into table ${fullTableName}`);

		// Get all parsed records related to this table
		const rows = parsedRecords.reduce<string[][]>((acc, parsedRecord) => {
			const [headerLine, dataLine] = parsedRecord.pageContent.split(':');
			const headers = headerLine.split('|');
			const originalValues = dataLine.split('|');

			if (headers.length !== originalValues.length) {
				console.log(`Skipping record due to mismatched headers and values length. Headers: ${headers.length}, Values: ${originalValues.length}`, parsedRecord);
				return acc; // Skip this record and continue to the next one
			}

			// Format TIMESTAMP values using moment to ensure correct formatting
			const formattedValues = originalValues.map((value, index) => {
				const columnName = headers[index];
				const columnInfo = columns[columnName];
				if (columnInfo?.type.toLowerCase() === 'timestamp') {
					return moment(value).toISOString(); // Format as ISO-8601 string
				}
				return value;
			});

			acc.push(formattedValues);
			return acc;
		}, []);

		// Perform batch insert using parameterized queries
		if (rows.length > 0) {
			const columnsString = Object.keys(columns).join(', ');

			for (let i = 0; i < rows.length; i += BATCH_SIZE) {
				const batch = rows.slice(i, i + BATCH_SIZE);

				// Insert records into the main table
				const valuePlaceholders = batch
					.map((row, rowIndex) => `(${row.map((_, colIndex) => `$${rowIndex * row.length + colIndex + 1}`).join(', ')})`)
					.join(', ');

				const flattenedValues = batch.flat();
				const query = `INSERT INTO ${fullTableName} (${columnsString}) VALUES ${valuePlaceholders}`;

				try {
					// Perform the batch insert with parameterized query
					await client.unsafe(query, flattenedValues);
					totalInsertedRecords += batch.length;

					// Output a dot for every 10,000 rows inserted
					if (totalInsertedRecords % 10000 === 0) {
						process.stdout.write('. ');
					}
				} catch (error) {
					console.error(`Error inserting into table ${fullTableName}:`, error);
					throw error; // Halt on error
				}

				// Initialize Embeddings to create embeddings for the row
				const embeddings = new OpenAIEmbeddings({
					modelName: 'text-embedding-ada-002', // Use ADA explicitly
				});

				// Process batch to insert into the embeddings table without embedding generation
				const batchForEmbeddingTable = await Promise.all(batch.map(async (row) => {
					const valuesToEmbed = Object.keys(columns).reduce((acc, col, index) => {
						const value = row[index];
						if (value) {
							acc[col] = value;
						}
						return acc;
					}, {} as Record<string, string>);

					const embeddingText = JSON.stringify(valuesToEmbed);

					// Return the values for insertion
					return {
						jsonString: embeddingText,
					};
				}));

				// Insert the records into the embedding table
				const embeddingPlaceholders = batchForEmbeddingTable
					.map((_, rowIndex) => `($${rowIndex * 1 + 1})`)
					.join(', ');

				const embeddingValues = batchForEmbeddingTable.flatMap((entry) => [
					entry.jsonString,
				]);

				const embeddingQuery = `INSERT INTO ${embeddingTableName} (json_string) VALUES ${embeddingPlaceholders}`;

				try {
					// Perform the batch insert into the embedding table
					await client.unsafe(embeddingQuery, embeddingValues);
					totalInsertedEmbeddings += batchForEmbeddingTable.length;
				} catch (error) {
					console.error(`Error inserting into table ${embeddingTableName}:`, error);
					throw error; // Halt on error
				}
			}
		}

		// Log the total count of inserted records after all batches are completed
		console.log(`\nTotal inserted records into ${fullTableName}: ${totalInsertedRecords}`);
		console.log(`Total inserted records into ${embeddingTableName}: ${totalInsertedEmbeddings}`);

	} catch (error) {
		console.error('Error during batch insert process:', error);
		throw error;
	} finally {
		// No need to call client.end() as Postgres.js manages connection pooling internally
	}
};
