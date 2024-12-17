import postgres from 'postgres';

// Initialize database connection for bills
if (!process.env.PG_BILLS_URL) {
    throw new Error('PG_BILLS_URL environment variable is not set');
}

export const sql = postgres(process.env.PG_BILLS_URL); 