import type { Sql } from 'postgres';

export async function createTables(sql: Sql) {
    try {
        // Create extension for vector operations
        await sql`CREATE EXTENSION IF NOT EXISTS vector`;

        // Create bills table with vector support
        await sql`
            CREATE TABLE IF NOT EXISTS bills (
                bill_id INTEGER PRIMARY KEY,
                bill_number TEXT NOT NULL,
                bill_type VARCHAR(1) NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                inferred_categories JSONB,
                subjects JSONB,
                committee_name TEXT,
                last_action TEXT,
                last_action_date TIMESTAMP,
                embedding VECTOR(384),
                pdf_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_bills_embedding ON bills USING ivfflat (embedding vector_cosine_ops)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_inferred_categories ON bills USING GIN (inferred_categories)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_subjects ON bills USING GIN (subjects)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_committee_name ON bills(committee_name)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_bills_last_action_date ON bills(last_action_date)`;

        // Create sponsors table
        await sql`
            CREATE TABLE IF NOT EXISTS sponsors (
                sponsor_id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                party VARCHAR,
                district VARCHAR,
                role VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_sponsors_party ON sponsors(party)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sponsors_district ON sponsors(district)`;

        // Create bill_sponsors mapping table
        await sql`
            CREATE TABLE IF NOT EXISTS bill_sponsors (
                bill_id INTEGER NOT NULL,
                sponsor_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (bill_id, sponsor_id),
                CONSTRAINT fk_bill_sponsors_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
                CONSTRAINT fk_bill_sponsors_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsors(sponsor_id) ON DELETE CASCADE
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_bill_sponsors_sponsor_id ON bill_sponsors(sponsor_id)`;

        // Create roll_calls table
        await sql`
            CREATE TABLE IF NOT EXISTS roll_calls (
                roll_call_id INTEGER PRIMARY KEY,
                bill_id INTEGER REFERENCES bills(bill_id),
                date TIMESTAMP NOT NULL,
                yea INT NOT NULL,
                nay INT NOT NULL,
                nv INT NOT NULL,
                absent INT NOT NULL,
                passed BOOLEAN NOT NULL,
                chamber VARCHAR NOT NULL,
                chamber_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_roll_calls_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_roll_calls_bill_id ON roll_calls(bill_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_roll_calls_date ON roll_calls(date)`;

        // Create roll_call_votes table
        await sql`
            CREATE TABLE IF NOT EXISTS roll_call_votes (
                roll_call_id INTEGER NOT NULL,
                sponsor_id INTEGER NOT NULL,
                vote VARCHAR CHECK (vote IN ('Yea', 'Nay', 'NV', 'Absent')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (roll_call_id, sponsor_id),
                CONSTRAINT fk_roll_call_votes_vote FOREIGN KEY (roll_call_id) REFERENCES roll_calls(roll_call_id) ON DELETE CASCADE,
                CONSTRAINT fk_roll_call_votes_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsors(sponsor_id) ON DELETE CASCADE
            )
        `;

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