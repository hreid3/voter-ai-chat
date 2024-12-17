import { sql } from '@/lib/bills/db';
import type { TableDDLRow } from './types';
import systemPromptMd from '../prompts/bills-assistant.md';

// Helper function to get table DDL
export async function getTableDDL(): Promise<string> {
    const result = await sql<TableDDLRow[]>`
        SELECT 
            table_name,
            string_agg(
                column_name || ' ' || data_type || 
                CASE 
                    WHEN character_maximum_length IS NOT NULL 
                    THEN '(' || character_maximum_length || ')'
                    ELSE ''
                END,
                E'\n'
            ) as columns
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN ('bills', 'sponsors', 'bill_sponsors', 'roll_calls', 'roll_call_votes')
        GROUP BY table_name;
    `;
    return result.map(r => `Table: ${r.table_name}\nColumns:\n${r.columns}`).join('\n\n');
}

// Helper function to load system prompt
export async function loadSystemPrompt(): Promise<string> {
    return systemPromptMd;
} 