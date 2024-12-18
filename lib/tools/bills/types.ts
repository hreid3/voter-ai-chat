import { z } from 'zod';

// Schema for the bills query tool parameters
export const billsQuerySchema = z.object({
    query: z.string().describe('The natural language query about bills, districts, parties, or representatives.'),
});

// Schema for the AI response
export const responseSchema = z.object({
    sql: z.string().describe('The generated SQL query'),
    parameters: z.array(z.any()).optional().describe('Query parameters'),
    explanation: z.string().describe('Explanation of the query and transformations'),
    transformations: z.record(z.string()).optional().describe('Value transformations performed'),
});

export interface TableDDLRow {
    table_name: string;
    columns: string;
} 