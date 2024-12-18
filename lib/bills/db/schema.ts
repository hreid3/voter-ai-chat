// Table definitions shared between import and query processes
export const TABLE_DDL = `
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
);

CREATE TABLE IF NOT EXISTS sponsors (
    sponsor_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    party VARCHAR,
    district VARCHAR,
    role VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_sponsors (
    bill_id INTEGER NOT NULL,
    sponsor_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bill_id, sponsor_id),
    CONSTRAINT fk_bill_sponsors_bill FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
    CONSTRAINT fk_bill_sponsors_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsors(sponsor_id) ON DELETE CASCADE
);

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
);

CREATE TABLE IF NOT EXISTS roll_call_votes (
    roll_call_id INTEGER NOT NULL,
    sponsor_id INTEGER NOT NULL,
    vote VARCHAR CHECK (vote IN ('Yea', 'Nay', 'NV', 'Absent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (roll_call_id, sponsor_id),
    CONSTRAINT fk_roll_call_votes_vote FOREIGN KEY (roll_call_id) REFERENCES roll_calls(roll_call_id) ON DELETE CASCADE,
    CONSTRAINT fk_roll_call_votes_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsors(sponsor_id) ON DELETE CASCADE
);`; 