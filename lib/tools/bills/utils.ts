
import systemPromptMd from '../prompts/bills-assistant.md';
import { TABLE_DDL } from '@/lib/bills/db/schema';

// Helper function to get table DDL
export async function getTableDDL(): Promise<string> {
    return TABLE_DDL;
}

// Helper function to load system prompt
export async function loadSystemPrompt(): Promise<string> {
    return systemPromptMd;
} 