export type TableInfo = { // TODO:  Use Zod
    file_name: string,
    table_name: string,
    summary: string,
    columns: Record<string, {
        type: string,
        description: string,
    }>,
    documents?: ParsedRecord;
}
export type VoterTableDdl = {
    tableInfo: TableInfo,
    ddl: string,
}


export interface ParsedRecord {
    pageContent: string;
    metadata: {
        source: string;
        line: number;
    };
}

