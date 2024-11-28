import postgres from 'postgres';
import moment from 'moment';
import type { TableInfo } from "@/lib/voter/import/types";

interface ParsedRecord {
    pageContent: string;
    metadata: {
        source: string;
        line: number;
    };
}

export const insertParsedCsvRecords = async (parsedRecords: ParsedRecord[], tableInfo: TableInfo): Promise<void> => {
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

    const { table_name: tableName, columns } = tableInfo;
    const fullTableName = `${schemaName}.${tableName}`;

    try {
        console.log(`Starting batch insertion into table ${fullTableName}`);

        // Get all parsed records related to this table
        const rows = parsedRecords.reduce<string[][]>((acc, parsedRecord) => {
            const [headerLine, dataLine] = parsedRecord.pageContent.split(':');
            const headers = headerLine.split('|');
            const originalValues = dataLine.split('|');

            if (headers.length !== originalValues.length) {
                console.log(`Skipping record due to mismatched headers and values length. Headers: ${headers.length}, Values: ${originalValues.length}`, parsedRecord);
                return acc; // Skip this record and continue to the next one
            }

            // Format TIMESTAMP values using moment to ensure correct formatting
            const formattedValues = originalValues.map((value, index) => {
                const columnName = headers[index];
                const columnInfo = columns[columnName];
                if (columnInfo?.type.toLowerCase() === 'timestamp') {
                    return moment(value).toISOString(); // Format as ISO-8601 string
                }
                return value;
            });

            acc.push(formattedValues);
            return acc;
        }, []);

        // Perform batch insert using parameterized queries
        if (rows.length > 0) {
            const columnsString = Object.keys(columns).join(', ');
            for (let i = 0; i < rows.length; i += 100) {
                const batch = rows.slice(i, i + 100);
                const valuePlaceholders = batch
                    .map((row, rowIndex) => `(${row.map((_, colIndex) => `$${rowIndex * row.length + colIndex + 1}`).join(', ')})`)
                    .join(', ');

                const flattenedValues = batch.flat();
                const query = `INSERT INTO ${fullTableName} (${columnsString}) VALUES ${valuePlaceholders}`;

                try {
                    // Perform the batch insert with parameterized query
                    await client.unsafe(query, flattenedValues);
                    console.log(`Inserted ${batch.length} row(s) into table ${fullTableName}`);
                } catch (error) {
                    console.error(`Error inserting into table ${fullTableName}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error during batch insert process:', error);
        throw error;
    } finally {
        // Close the database connection
        // No need to call client.end() as Postgres.js manages connection pooling internally
    }
};
