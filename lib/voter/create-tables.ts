import postgres from 'postgres';
import {TableInfo} from "@/lib/voter/types";

const sanitizeName = (name: string): string => {
    return name?.replace(/\W+/g, '_');
};

const escapeSingleQuotes = (str: string): string => {
    return str?.replace(/'/g, "''");
};

// Function to generate SQL script for dropping all objects in the current schema
const generateDropAllObjectsSQL = (schema: string): string => {
    return `
-- Drop all objects in the schema: ${schema}
DO
$$
DECLARE
    obj RECORD;
BEGIN
    -- Drop all tables
    FOR obj IN (SELECT tablename AS object_name FROM pg_tables WHERE schemaname = '${schema}') LOOP
        EXECUTE 'DROP TABLE IF EXISTS "${schema}"."' || obj.object_name || '" CASCADE;';
    END LOOP;

    -- Drop all views
    FOR obj IN (SELECT viewname AS object_name FROM pg_views WHERE schemaname = '${schema}') LOOP
        EXECUTE 'DROP VIEW IF EXISTS "${schema}"."' || obj.object_name || '" CASCADE;';
    END LOOP;

    -- Drop all sequences
    FOR obj IN (SELECT sequence_name AS object_name FROM information_schema.sequences WHERE sequence_schema = '${schema}') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS "${schema}"."' || obj.object_name || '" CASCADE;';
    END LOOP;

    -- Drop all functions
    FOR obj IN (SELECT routine_name AS object_name FROM information_schema.routines WHERE specific_schema = '${schema}') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS "${schema}"."' || obj.object_name || '()" CASCADE;';
    END LOOP;
END;
$$;
`;
};

// Function to execute the generated SQL script against the database using the postgres module
const executeSQL = async (sqlScript: string) => {
    const connectionString = process.env.PG_VOTERDATA_URL;

    if (!connectionString) {
        console.error('PG_VOTERDATA_URL environment variable is not set.');
        throw new Error("PG_VOTERDATA_URL environment variable is not set.");
    }
    let sql;
    try {
        console.log(`Connecting to Voter Database Schema`);
        sql = postgres(connectionString);
        console.log("Processing script");
        // await sql.unsafe(sqlScript); // NOT YET
        console.log('SQL script executed successfully');
    } catch (error) {
        console.error('Error executing SQL script:', error);
        throw error;
    } finally {
        await sql?.end({ timeout: 5 });
    }
};

// Function to generate CREATE TABLE SQL statements for multiple tables
export const createVoterDataTables = async (
    tableDefs: TableInfo[],
): Promise<{ fullSQL: string; createTableStatements: string[]; }> => {
    let sqlScript = '';
    const createTableStatements: string[] = [];
    const schema = process.env.SCHEMA_NAME || 'public';

    for (const tableDef of tableDefs) {
        const tableName = `${sanitizeName(schema)}.${sanitizeName(tableDef.table_name)}`;
        const summary = tableDef.summary;
        const columns = tableDef.columns;

        sqlScript += `DROP TABLE IF EXISTS ${tableName};\n`;

        const columnDefinitions: string[] = [];

        const columnNames = Object.keys(columns);
        columnNames.forEach((columnName, index) => {
            const sanitizedColumnName = sanitizeName(columnName);
            const columnDef = columns[columnName];
            const dataType = columnDef.type;
            let columnDefinition = `    ${sanitizedColumnName} ${dataType}`;
            if (index < columnNames.length - 1) {
                columnDefinition += ',';
            }
            columnDefinitions.push(columnDefinition);
        });

        const columnsString = columnDefinitions.join('\n');

        const createTableSQL = `CREATE TABLE ${tableName} (\n${columnsString}\n);\n\n`;
        sqlScript += createTableSQL;

        createTableStatements.push(createTableSQL);

        const escapedSummary = escapeSingleQuotes(summary);
        const commentTableSQL = `COMMENT ON TABLE ${tableName} IS '${escapedSummary}';\n\n`;
        sqlScript += commentTableSQL;

        for (const [columnName, columnDef] of Object.entries(columns)) {
            const sanitizedColumnName = sanitizeName(columnName);
            const description = columnDef.description;
            const escapedDescription = escapeSingleQuotes(description);
            const commentColumnSQL = `COMMENT ON COLUMN ${tableName}.${sanitizedColumnName} IS '${escapedDescription}';\n`;
            sqlScript += commentColumnSQL;
        }

        sqlScript += '\n';
    }

    const dropAllObjectsSQL = generateDropAllObjectsSQL(schema);
    sqlScript = dropAllObjectsSQL + '\n' + sqlScript;
    await executeSQL(sqlScript);
    console.log('CREATE TABLE Statements:');
    createTableStatements.forEach((stmt) => {
        console.log(stmt);
    });

    return { fullSQL: sqlScript, createTableStatements };
};
