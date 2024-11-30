import postgres, { type Sql } from 'postgres';
import { OpenAIEmbeddings } from '@langchain/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { config } from 'dotenv';
import path from 'node:path';

// Load environment variables from .env files
config({
	path: ['.env.local', path.join(__dirname, '../../../.env.local')],
});

const BATCH_SIZE = 2000;
const CHUNK_SIZE = 1400;
const CHUNK_OVERLAP = 136;
const MAX_EMBEDDING_BATCH_SIZE = 2048;

interface Row {
	pid: number;
	json_string: string;
}

interface EmbeddingResult {
	pid: number;
	embedding: number[];
}

const createEmbeddings = async (): Promise<void> => {
	const databaseUrl = process.env.PG_VOTERDATA_URL;
	if (!databaseUrl) {
		throw new Error('PG_VOTERDATA_URL environment variable is not set.');
	}

	// Ensure PG_VOTERDATA_SCHEMA is defined
	const schemaName = process.env.PG_VOTERDATA_SCHEMA;
	if (!schemaName) {
		throw new Error('PG_VOTERDATA_SCHEMA environment variable is not set.');
	}

	// Initialize Postgres.js client
	const client: Sql = postgres(databaseUrl);

	// Define the table names to ignore embeddings
	const chunkTableName = `voter_table_ddl_embeddings`;

	try {
		// Step 1: Ensure pgvector extension is available
		try {
			await client.unsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
			console.log('Ensured pgvector extension is available');
		} catch (error) {
			console.error('Error creating pgvector extension:', error);
			throw error; // Halt on error if the extension can't be created
		}

		// Step 2: Increase `maintenance_work_mem` to ensure sufficient memory for index creation
		try {
			await client.unsafe(`SET maintenance_work_mem TO '1GB';`);
			console.log('Increased maintenance_work_mem to 512MB');
		} catch (error) {
			console.error('Error setting maintenance_work_mem:', error);
			throw error;
		}

		// Step 3: Get a list of all tables with '_embedding' suffix, excluding the chunkTableName
		const tables: string[] = await getEmbeddingTables(client, schemaName, chunkTableName);

		// Step 4: Process each table to generate embeddings
		const indexCreationPromises: Promise<void>[] = [];
		for (const table of tables) {
			console.log(`Processing embeddings for table: ${table}`);
			let hasMoreRows = true;
			let lastProcessedPid = 0;

			while (hasMoreRows) {
				// Step 4.1: Fetch rows with NULL embeddings, using batching to limit the number of rows to 2000 at a time
				const rows: Row[] = await fetchRowsWithoutEmbeddings(client, schemaName, table, lastProcessedPid, BATCH_SIZE);
				if (rows.length === 0) {
					hasMoreRows = false;
					break;
				}

				// Step 4.2: Prepare embeddings for fetched rows
				const batchEmbeddings: EmbeddingResult[] = await generateEmbeddings(rows);

				// Step 4.3: Update the table with the generated embeddings using batch updates
				await updateEmbeddings(client, schemaName, table, batchEmbeddings);

				// Update the lastProcessedPid to keep track of progress
				lastProcessedPid = rows[rows.length - 1].pid;

				console.log(`Processed batch ending with PID: ${lastProcessedPid}`);
			}

			// Step 5: Create HNSW index on embedding column after updates, asynchronously
			const indexQuery = `
          CREATE INDEX IF NOT EXISTS ${table}_embedding_idx
              ON ${schemaName}.${table} USING hnsw (embedding vector_cosine_ops)
              WITH (m = 8, ef_construction = 32);
			`;
			indexCreationPromises.push(
				client.unsafe(indexQuery)
					.then(() => console.log(`Index created on 'embedding' column of table ${schemaName}.${table}`))
					.catch(error => console.error(`Error creating index on embedding column of table ${schemaName}.${table}:`, error))
			);
		}

		// Wait for all index creation tasks to complete (in parallel, but not blocking other tables)
		await Promise.all(indexCreationPromises);
	} catch (error) {
		console.error('Error during embedding creation process:', error);
		throw error;
	} finally {
		// Reset `maintenance_work_mem` back to the default value
		try {
			await client.unsafe(`SET maintenance_work_mem TO '64MB';`);
			console.log('Reset maintenance_work_mem to 64MB');
		} catch (error) {
			console.error('Error resetting maintenance_work_mem:', error);
		}

		await client.end();
	}
};

// Helper Function: Get tables with '_embedding' suffix excluding the chunk table
const getEmbeddingTables = async (client: Sql, schemaName: string, chunkTableName: string): Promise<string[]> => {
	const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${schemaName}'
        AND table_name LIKE '%_embedding'
        AND table_name != '${chunkTableName}';
	`;
	const result = await client.unsafe<{ table_name: string }[]>(query);
	return result.map(row => row.table_name);
};

// Helper Function: Fetch rows without embeddings (limit by batch size)
const fetchRowsWithoutEmbeddings = async (
	client: Sql,
	schemaName: string,
	tableName: string,
	lastProcessedPid: number,
	limit: number
): Promise<Row[]> => {
	const query = `
      SELECT pid, json_string
      FROM ${schemaName}.${tableName}
      WHERE embedding IS NULL AND pid > ${lastProcessedPid}
      ORDER BY pid ASC
          LIMIT ${limit};
	`;
	return await client.unsafe<Row[]>(query);
};

// Helper Function: Generate embeddings for rows with batching
const generateEmbeddings = async (rows: Row[]): Promise<EmbeddingResult[]> => {
	const splitter = new CharacterTextSplitter({ chunkSize: CHUNK_SIZE, chunkOverlap: CHUNK_OVERLAP });
	const embeddingsModel = new OpenAIEmbeddings({ modelName: 'text-embedding-ada-002' });

	// Prepare data structures
	const pidChunkIndices: { pid: number; startIndex: number; endIndex: number }[] = [];
	const allChunks: string[] = [];

	let chunkIndex = 0;
	for (const row of rows) {
		const { pid, json_string } = row;
		const chunks = await splitter.splitText(json_string);
		const startIndex = chunkIndex;
		allChunks.push(...chunks);
		chunkIndex += chunks.length;
		const endIndex = chunkIndex;
		pidChunkIndices.push({ pid, startIndex, endIndex });
	}

	// Step 2: Batch embeddings up to MAX_EMBEDDING_BATCH_SIZE
	const totalChunks = allChunks.length;
	const batchEmbeddings: number[][] = [];
	let currentIndex = 0;

	while (currentIndex < totalChunks) {
		const batchChunks = allChunks.slice(currentIndex, currentIndex + MAX_EMBEDDING_BATCH_SIZE);
		console.log(`Embedding batch of size ${batchChunks.length}`);
		const batchEmbeddingsResult = await embeddingsModel.embedDocuments(batchChunks);
		batchEmbeddings.push(...batchEmbeddingsResult);
		currentIndex += MAX_EMBEDDING_BATCH_SIZE;
	}

	// Step 3: Map embeddings back to PIDs and compute average embeddings
	const pidToEmbeddings: EmbeddingResult[] = [];
	for (const { pid, startIndex, endIndex } of pidChunkIndices) {
		const chunkEmbeddings = batchEmbeddings.slice(startIndex, endIndex);
		const averageEmbedding = chunkEmbeddings[0].map((_, colIndex) =>
			chunkEmbeddings.reduce((sum, curr) => sum + curr[colIndex], 0) / chunkEmbeddings.length
		);
		pidToEmbeddings.push({ pid, embedding: averageEmbedding });
	}

	return pidToEmbeddings;
};

// Helper Function: Update embeddings in the table using batch updates
const updateEmbeddings = async (
	client: Sql,
	schemaName: string,
	tableName: string,
	batchEmbeddings: EmbeddingResult[]
): Promise<void> => {
	if (batchEmbeddings.length === 0) return;

	const embeddingQueries = batchEmbeddings.map(({ pid, embedding }) => ({
		pid,
		embedding: `[${embedding.join(', ')}]`,
	}));

	const updateQuery = `
      UPDATE ${schemaName}.${tableName} AS t
      SET embedding = e.embedding_value
          FROM (VALUES
          ${embeddingQueries.map((e, i) => `($${2 * i + 1}::INTEGER, $${2 * i + 2}::VECTOR(1536))`).join(',\n')}
          ) AS e(pid_value, embedding_value)
      WHERE t.pid = e.pid_value;
	`;

	const params = embeddingQueries.flatMap(({ pid, embedding }) => [pid, embedding]);

	try {
		await client.unsafe(updateQuery, params);
		console.log(`Updated embeddings for ${batchEmbeddings.length} rows in table ${schemaName}.${tableName}`);
	} catch (error) {
		console.error('Error updating embeddings:', error);
		throw error;
	}
};

(async () => {
	await createEmbeddings();
})();
