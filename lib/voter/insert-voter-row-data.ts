import postgres from 'postgres';
import moment from 'moment';
import { TableInfo } from "@/lib/voter/types";

interface ParsedRecord {
    pageContent: string;
    metadata: {
        source: string;
        line: number;
    };
}

export const insertParsedCsvRecord = async (parsedRecord: ParsedRecord, tableInfo: TableInfo): Promise<void> => {
    // Ensure PG_VOTERDATA_URL is defined
    const databaseUrl = process.env.PG_VOTERDATA_URL;
    if (!databaseUrl) {
        throw new Error("PG_VOTERDATA_URL environment variable is not set.");
    }

    // Initialize Postgres.js client
    const client = postgres(databaseUrl);
    const schemaName = process.env.PG_VOTERDATA_SCHEMA;
    if (!schemaName) {
        throw new Error("PG_VOTERDATA_SCHEMA environment variable is not set.");
    }

    const { table_name: tableName, columns: columnsInfo } = tableInfo;
    try {
        // Parse the `pageContent` field to extract column names and values
        const [headerLine, dataLine] = parsedRecord.pageContent.split(':');
        const headers = headerLine.split('|');
        let values = dataLine.split('|');
        if (headers.length  !== values.length) {
            console.log("Found Record that does not have matching header and values length. Abadoning", parsedRecord)
            return;
        }

        // Format TIMESTAMP values using moment to ensure correct formatting
        values = values.map((value, index) => {
            const columnName = headers[index];
            const columnInfo = columnsInfo[columnName];
            if (columnInfo?.type.toLowerCase() === 'timestamp') {
                return moment(value).toISOString(); // Format as ISO-8601 string
            }
            return value;
        });

        // Create an object to map column names to values
        const dataToInsert = headers.reduce<Record<string, string>>((acc, header, index) => {
            acc[header] = values[index];
            return acc;
        }, {});

        // Insert the parsed data into the specified table
        const fullTableName = `${schemaName}.${tableName}`;
        const columns = headers.join(', ');
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        const query = `INSERT INTO ${fullTableName} (${columns}) VALUES (${placeholders})`;
        const result = await client.unsafe(query, values);
    } catch (error) {
        console.error('Error inserting parsed CSV record:', error);
        throw error;
    } finally {
        // Close the database connection
        // No need to call client.end() as Postgres.js manages connection pooling internally
    }
};
