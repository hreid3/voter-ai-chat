import type { Sql } from 'postgres';
import { TABLE_DDL } from './schema';

export async function createTables(sql: Sql) {
    try {
        // Create extension for vector operations
        await sql`CREATE EXTENSION IF NOT EXISTS vector`;

        // Create tables using shared DDL
        await sql.unsafe(TABLE_DDL);

        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_embedding ON bills USING ivfflat (embedding vector_cosine_ops)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_inferred_categories ON bills USING GIN (inferred_categories)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_subjects ON bills USING GIN (subjects)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_committee_name ON bills(committee_name)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_last_action_date ON bills(last_action_date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sponsors_party ON sponsors(party)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sponsors_district ON sponsors(district)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bill_sponsors_sponsor_id ON bill_sponsors(sponsor_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_roll_calls_bill_id ON roll_calls(bill_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_roll_calls_date ON roll_calls(date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_roll_call_votes_sponsor_id ON roll_call_votes(sponsor_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_roll_call_votes_vote ON roll_call_votes(vote)`;

        // Create process_tracker table
        await sql`
            CREATE TABLE IF NOT EXISTS process_tracker (
                id SERIAL PRIMARY KEY,
                absolute_path TEXT NOT NULL UNIQUE,
                file_type VARCHAR CHECK (file_type IN ('bill', 'vote', 'people')),
                state VARCHAR NOT NULL,
                session VARCHAR NOT NULL,
                last_processed_record INT DEFAULT 0,
                status VARCHAR CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_process_tracker_status ON process_tracker(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_process_tracker_file_type ON process_tracker(file_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_process_tracker_state_session ON process_tracker(state, session)`;

        console.log('Successfully created all tables and indexes');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

// Example usage:
/*
const sql = postgres({
    user: 'postgres',
    host: 'localhost',
    database: 'legislative_db',
    password: 'your_password',
    port: 5432,
});

createTables(sql).catch(console.error);
*/ 