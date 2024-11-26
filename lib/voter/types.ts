export type TableInfo = { // TODO:  Use Zod
    file_name: string,
    table_name: string,
    summary: string,
    columns: Record<string, {
        type: string,
        description: string,
    }>
}
