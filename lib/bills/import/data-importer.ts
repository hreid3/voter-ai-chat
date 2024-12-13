import type { Sql } from 'postgres';
import { BillsDataImporter } from './import-bills-data';
import { SponsorsDataImporter } from './import-sponsors-data';
import { RollCallDataImporter } from './import-votes-data';
import type { ImporterConfig } from './types';
import { BillProcessor } from '../processing/bill-processor';

export class LegislativeDataImporter {
    private billsImporter: BillsDataImporter;
    private sponsorsImporter: SponsorsDataImporter;
    private rollCallImporter: RollCallDataImporter;
    private billProcessor: BillProcessor;
    private rootDir: string;
    private sql: Sql;

    constructor(config: ImporterConfig) {
        this.rootDir = config.rootDir;
        this.sql = config.sql;
        this.billsImporter = new BillsDataImporter(this.sql);
        this.sponsorsImporter = new SponsorsDataImporter(this.sql);
        this.rollCallImporter = new RollCallDataImporter(this.sql);
        this.billProcessor = new BillProcessor(this.sql);
    }

    async initialize() {
        // Initialize components that need async initialization
        await this.billProcessor.initialize();
    }

    async importAll() {
        try {
            // Import in order of dependencies
            console.log('Importing sponsors...');
            await this.sponsorsImporter.processDirectory(this.rootDir);

            console.log('Importing bills...');
            await this.billsImporter.processDirectory(this.rootDir);

            console.log('Processing bills (generating embeddings and classifications)...');
            await this.billProcessor.processUnprocessedBills();

            console.log('Importing votes...');
            await this.rollCallImporter.processDirectory(this.rootDir);

            console.log('Import completed successfully');
        } catch (error) {
            console.error('Error during import:', error);
            throw error;
        }
    }

    async importSponsors() {
        await this.sponsorsImporter.processDirectory(this.rootDir);
    }

    async importBills() {
        await this.billsImporter.processDirectory(this.rootDir);
    }

    async importVotes() {
        await this.rollCallImporter.processDirectory(this.rootDir);
    }

    async processBills() {
        await this.billProcessor.processUnprocessedBills();
    }

    async findSimilarBills(billId: string, limit = 5) {
        return this.billProcessor.findSimilarBills(billId, limit);
    }

    async findBillsByCategory(category: string, limit = 10) {
        return this.billProcessor.findBillsByCategory(category, limit);
    }
}

// Example usage:
/*
const config: ImporterConfig = {
    sql: postgres({
        user: 'postgres',
        host: 'localhost',
        database: 'legislative_db',
        password: 'your_password',
        port: 5432,
    }),
    rootDir: '/path/to/data'
};

const importer = new LegislativeDataImporter(config);
await importer.initialize();
await importer.importAll();
*/ 