import postgres from 'postgres';
import { createTables } from './db/create-tables';
import { LegislativeDataImporter } from './import/data-importer';
import { config } from 'dotenv';
import path from 'node:path';
import { promises as fs } from 'node:fs';

// Load environment variables from .env files
config({
    path: ['.env.local', path.join(__dirname, '../../../.env.local')],
});

async function main() {
    // Check required environment variables
    if (!process.env.PG_BILLS_URL) {
        console.error('Error: PG_BILLS_URL environment variable is required');
        process.exit(1);
    }

    // Check data directory
    const rootDir = path.join(__dirname, '../../public/uploads/bills');
    console.log(`Processing bills from root directory: ${rootDir}`);

    let sessions: string[];
    try {
        sessions = await fs.readdir(rootDir);
        console.log('Found session directories:', sessions);
        if (sessions.length === 0) {
            console.error('No session directories found');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error reading bills directory:', error);
        process.exit(1);
    }

    // Initialize database connection
    const sql = postgres(process.env.PG_BILLS_URL);

    try {
        // Create database tables
        console.log('Creating database tables...');
        await createTables(sql);

        // Initialize and run importer
        console.log('Initializing data importer...');
        const importer = new LegislativeDataImporter({
            sql,
            rootDir
        });

        await importer.initialize();
        console.log('Starting data import...');
        await importer.importAll();

        console.log('Import process completed successfully');
    } catch (error) {
        console.error('Error during import process:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
} 
