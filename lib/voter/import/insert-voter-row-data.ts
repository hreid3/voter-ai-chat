import postgres from 'postgres';
import moment from 'moment';
import type { TableInfo } from "@/lib/voter/import/types";
import { OpenAIEmbeddings } from '@langchain/openai';

interface ParsedRecord {
	pageContent: string;
	metadata: {
		source: string;
		line: number;
	};
}

export const insertParsedCsvRecords = async (parsedRecords: ParsedRecord[], tableInfo: TableInfo): Promise<void> => {
	const databaseUrl = process.env.PG_VOTERDATA_URL;
	if (!databaseUrl) {
		throw new Error("PG_VOTERDATA_URL environment variable is not set.");
	}

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
		const columnsString = Object.keys(columns).join(', ');

		const rows = parsedRecords.map((parsedRecord) => {
			const record = JSON.parse(parsedRecord.pageContent);
			return Object.keys(columns).map((key) => {
				let value = record[key] ?? '';
				const columnInfo = columns[key];
				if (columnInfo?.type.toLowerCase() === 'timestamp' && value) {
					try {
						value = moment(value).toISOString();
					} catch (error) {
						// Ignore formatting error
					}
				}
				return value;
			});
		});

		const BATCH_SIZE = 500;
		for (let i = 0; i < rows.length; i += BATCH_SIZE) {
			const batch = rows.slice(i, i + BATCH_SIZE);

			const valuePlaceholders = batch
				.map((row, rowIndex) => `(${row.map((_, colIndex) => `$${rowIndex * row.length + colIndex + 1}`).join(', ')})`)
				.join(', ');

			const flattenedValues = batch.flat();
			const query = `INSERT INTO ${fullTableName} (${columnsString}) VALUES ${valuePlaceholders}`;

			await client.unsafe(query, flattenedValues);
			totalInsertedRecords += batch.length;

			const embeddings = new OpenAIEmbeddings({
				modelName: 'text-embedding-ada-002',
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

			await client.unsafe(embeddingQuery, embeddingValues);
			totalInsertedEmbeddings += batchForEmbeddingTable.length;

		}
	} catch (error) {
		console.error('Error during batch insert process:', error);
		throw error;
	} finally {
		await client.end({ timeout: 5 });
	}
};
