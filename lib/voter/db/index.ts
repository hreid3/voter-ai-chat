import postgres from "postgres";

const connectionString = process.env.PG_VOTERDATA_URL || 'fail-badly';
export const sql = postgres(connectionString, {
	idle_timeout: 30,
	max_lifetime: 2 * 60 * 60,
	connect_timeout: 60,
});
