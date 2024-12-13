import postgres from 'postgres';
import { createTables } from './db/create-tables';
import { LegislativeDataImporter } from './import/data-importer';
import type { ImporterConfig } from './import/types';
import * as path from 'node:path';

async function main() {
    // Load environment variables
    const sql = postgres({
        user: process.env.POSTGRES_USER || 'voterdata_test',
        host: process.env.POSTGRES_HOST || 'voteraichat-db-4-do-user-10585640-0.d.db.ondigitalocean.com',
        database: process.env.POSTGRES_DB || 'voterdata_test',
        password: process.env.POSTGRES_PASSWORD,
        port: Number.parseInt(process.env.POSTGRES_PORT || '25060'),
    });

    const config: ImporterConfig = {
        sql,
        rootDir: path.join(__dirname, '../../../public/uploads/bills')
    };

    try {
        // Create database tables
        console.log('Creating database tables...');
        await createTables(sql);

        // Initialize importer
        console.log('Initializing data importer...');
        const importer = new LegislativeDataImporter(config);
        await importer.initialize();

        // Start import process
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