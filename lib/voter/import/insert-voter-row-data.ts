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

		const rows = parsedRecords.reduce<string[][]>((acc, parsedRecord) => {
			const lines = parsedRecord.pageContent.split('\n');
			const rowData: string[] = [];
			lines.forEach(line => {
				const [key, value]: string[] = line.split(':').map(item => item.trim());
				if (key) {
					const columnInfo = columns[key];
					let formattedValue = value || '';
					if (columnInfo?.type.toLowerCase() === 'timestamp' && value) {
						try {
							formattedValue = moment(value).toISOString(); // Format as ISO-8601 string
						} catch ( error ) {
							// Keep quiet...
						}
					}
					rowData.push(formattedValue);
				} else {
					console.log(`Skipping line due to missing key. Line: ${line}`);
				}
			});
			acc.push(rowData);
			return acc;
		}, []);

		// Perform batch insert using parameterized queries
		if (rows.length > 0) {
			const columnsString = Object.keys(columns).join(', ');
			for (let i = 0; i < rows.length; i += BATCH_SIZE) {
				const batch = rows.slice(i, i + BATCH_SIZE);

				const valuePlaceholders = batch
					.map((row, rowIndex) => {
						const placeholders = row.map((_, colIndex) => {
							return `$${rowIndex * row.length + colIndex + 1}`;
						});
						return `(${placeholders.join(', ')})`;
					})
					.join(', ');

				const flattenedValues = batch.flat();
				const query = `INSERT INTO ${fullTableName} (${columnsString}) VALUES ${valuePlaceholders}`;

				try {
					await client.unsafe(query, flattenedValues);
					totalInsertedRecords += batch.length;
					if (totalInsertedRecords % 10000 === 0) {
						process.stdout.write('. ');
					}
				} catch (error) {
					console.error(`Error inserting into table ${fullTableName}:`, error);
					throw error; // Halt on error
				}

				const embeddings = new OpenAIEmbeddings({
					modelName: 'text-embedding-ada-002', // Use ADA explicitly
				});

				const batchForEmbeddingTable = await Promise.all(batch.map(async (row) => {
					const valuesToEmbed = Object.keys(columns).reduce((acc, col, index) => {
						const value = row[index];
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
