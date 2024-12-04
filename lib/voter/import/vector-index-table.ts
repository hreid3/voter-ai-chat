import postgres from 'postgres';
import { OpenAIEmbeddings } from '@langchain/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import type { VoterTableDdl } from "@/lib/voter/import/types";

export const vectorIndexTable = async (tableDdlItem: VoterTableDdl): Promise<boolean> => {
	// Ensure PG_VOTERDATA_URL is defined
	const databaseUrl = process.env.PG_VOTERDATA_URL;
	if (!databaseUrl) {
		throw new Error("PG_VOTERDATA_URL environment variable is not set.");
	}

	// Ensure PG_VOTERDATA_SCHEMA is defined
	const schemaName = process.env.PG_VOTERDATA_SCHEMA;
	if (!schemaName) {
		throw new Error("PG_VOTERDATA_SCHEMA environment variable is not set.");
	}

	// Initialize Postgres.js client
	const client = postgres(databaseUrl);

	// Define the table names with schema reference
	const voterTableName = `voter_table_ddl`;
	const chunkTableName = `voter_table_ddl_embeddings`;

	try {
		// Step 1: Create the pgvector extension if not exists
		await client.unsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);

		await client.unsafe(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.${voterTableName} (
                                                                       primary_key SERIAL PRIMARY KEY,
                                                                       table_name VARCHAR(255) NOT NULL,
            table_ddl TEXT NOT NULL,
            table_embedding VECTOR(1536),
            updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
            );`);

		// Step 4: Recreate the `voter_table_ddl_embeddings` table
		await client.unsafe(`
        CREATE TABLE IF NOT EXISTS ${schemaName}.${chunkTableName} (
                                                                       id SERIAL PRIMARY KEY,
                                                                       parent_id INTEGER NOT NULL REFERENCES ${schemaName}.${voterTableName}(primary_key),
            chunk_embedding VECTOR(1536),
            chunk_index INTEGER NOT NULL
            );`);

		// Step 5: Create vector indexes for efficient searches
		// Use HNSW indexing for more efficient nearest-neighbor searches
		await client.unsafe(`CREATE INDEX IF NOT EXISTS idx_voter_table_embedding ON ${schemaName}.${voterTableName} USING hnsw (table_embedding vector_cosine_ops) WITH (m = 8, ef_construction = 32);`);
		await client.unsafe(`CREATE INDEX IF NOT EXISTS idx_voter_table_ddl_embeddings ON ${schemaName}.${chunkTableName} USING hnsw (chunk_embedding vector_cosine_ops) WITH (m = 8, ef_construction = 32);`);

		// Step 6: Initialize LangChain OpenAI Embeddings
		const embeddings = new OpenAIEmbeddings({
			modelName: 'text-embedding-ada-002', // Use ADA explicitly
		});

		// Step 7: Process each table DDL in the list
			const { tableInfo, ddl } = tableDdlItem;
			const { table_name } = tableInfo;

			// Step 7.1: Insert the parent table information and return the primary key
			const insertResult = await client.unsafe(
				`INSERT INTO ${schemaName}.${voterTableName} (table_name, table_ddl, updated) VALUES ($1, $2, $3) RETURNING primary_key`,
				[table_name, ddl, new Date().toISOString()]
			);
			const parentId = insertResult[0]?.primary_key;

			if (!parentId) {
				throw new Error(`Failed to insert into ${voterTableName} for table ${table_name}`);
			}

			// Step 7.2: Split the DDL into manageable chunks
			const splitter = new CharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
			const ddlChunks = await splitter.splitText(ddl);

			// Step 7.3: Generate embeddings for each chunk
			const chunkEmbeddings: number[][] = await Promise.all(
				ddlChunks.map((chunk) => embeddings.embedQuery(chunk))
			);

			// Step 7.4: Insert the chunk embeddings into the `voter_table_ddl_embeddings` table in a single batch
			const chunkValues = chunkEmbeddings.map((chunkEmbedding, i) => `(${parentId}, ${i}, '[${chunkEmbedding.join(', ')}]')`).join(', ');
			await client.unsafe(
				`INSERT INTO ${schemaName}.${chunkTableName} (parent_id, chunk_index, chunk_embedding) VALUES ${chunkValues}`
			);

		// Return success
		return true;
	} catch (error) {
		console.error('Error in vectorIndexTables:', error);
		// Close the database connection in case of error
		throw error;
	} finally {
		await client.end();
	}
};
