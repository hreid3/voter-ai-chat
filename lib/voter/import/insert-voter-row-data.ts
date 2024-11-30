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

const BATCH_SIZE = 500;

export const insertParsedCsvRecords = async (parsedRecords: ParsedRecord[], tableInfo: TableInfo): Promise<void> => {
	const databaseUrl = process.env.PG_VOTERDATA_URL;
	if (!databaseUrl) {
		throw new Error("PG_VOTERDATA_URL environment variable is not set.");
	}
	const splitter = new CharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 0 });

	const client = postgres(databaseUrl);
	const schemaName = process.env.PG_VOTERDATA_SCHEMA;
	if (!schemaName) {
		throw new Error("PG_VOTERDATA_SCHEMA environment variable is not set.");
	}

	const { table_name: tableName, columns } = tableInfo;
	const fullTableName = `${schemaName}.${tableName}`;
	const embeddingTableName = `${fullTableName}_embedding`;

	let totalInsertedRecords = 0;
	let totalInsertedEmbeddings = 0;

	try {
		console.log(`Starting batch insertion into table ${fullTableName}`);

		const columnsString = Object.keys(columns).join(', ');

		let batch = [];

		for (const parsedRecord of parsedRecords) {
			const lines = parsedRecord.pageContent.split('\n');
			const rowData: string[] = [];

			lines.forEach(line => {
				const [key, value] = line.split(':').map(item => item.trim());
				if (key) {
					const columnInfo = columns[key];
					let formattedValue = value || '';
					if (columnInfo?.type.toLowerCase() === 'timestamp' && value) {
						try {
							formattedValue = moment(value).toISOString(); // Format as ISO-8601 string
						} catch (error) {
							// Keep quiet...
						}
					}
					rowData.push(formattedValue);
				} else {
					console.log(`Skipping line due to missing key. Line: ${line}`);
				}
			});

			batch.push({ rowData, parsedRecord });

			// When batch reaches the defined size, perform the batch insert
			if (batch.length === BATCH_SIZE) {
				await insertBatch(batch, columnsString, fullTableName, embeddingTableName, client, columns);
				totalInsertedRecords += batch.length;
				totalInsertedEmbeddings += batch.length;
				batch = []; // Clear the batch after insertion

				// Print progress after every 10,000 records inserted
				if (totalInsertedRecords % 10000 === 0) {
					process.stdout.write('. ');
				}
			}
		}

		// Insert any remaining records
		if (batch.length > 0) {
			await insertBatch(batch, columnsString, fullTableName, embeddingTableName, client, columns);
			totalInsertedRecords += batch.length;
			totalInsertedEmbeddings += batch.length;

			// Print progress if remaining records cross a multiple of 10,000
			if (totalInsertedRecords % 10000 === 0) {
				process.stdout.write('. ');
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

async function insertBatch(
	batch: { rowData: string[], parsedRecord: ParsedRecord }[],
	columnsString: string,
	fullTableName: string,
	embeddingTableName: string,
	client: any,
	columns: Record<string, { type: string }>
) {
	// Prepare data for the main table insertion
	const rows = batch.map(({ rowData }) => rowData);
	const valuePlaceholders = rows
		.map((row, rowIndex) => {
			const placeholders = row.map((_, colIndex) => {
				return `$${rowIndex * row.length + colIndex + 1}`;
			});
			return `(${placeholders.join(', ')})`;
		})
		.join(', ');

	const flattenedValues = rows.flat();
	const query = `INSERT INTO ${fullTableName} (${columnsString}) VALUES ${valuePlaceholders}`;

	try {
		await client.unsafe(query, flattenedValues);
	} catch (error) {
		console.error(`Error inserting into table ${fullTableName}:`, error);
		throw error; // Halt on error
	}

	// Prepare data for the embedding table insertion
	const embeddings = new OpenAIEmbeddings({
		modelName: 'text-embedding-ada-002', // Use ADA explicitly
	});

	const batchForEmbeddingTable = await Promise.all(batch.map(async ({ rowData }) => {
		const valuesToEmbed = Object.keys(columns).reduce((acc, col, index) => {
			const value = rowData[index];
			if (value !== '' && value != null) {
				acc[col] = value;
			}
			return acc;
		}, {} as Record<string, string>);

		const embeddingText = JSON.stringify(valuesToEmbed);

		return {
			jsonString: embeddingText,
		};
	}));

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
	} catch (error) {
		console.error(`Error inserting into table ${embeddingTableName}:`, error);
		throw error; // Halt on error
	}
}
