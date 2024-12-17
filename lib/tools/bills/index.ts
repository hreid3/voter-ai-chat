import { tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { z } from 'zod';
import { billsQuerySchema, responseSchema } from './types';
import { getTableDDL, loadSystemPrompt } from './utils';
import { executeSql } from './execute-sql';

// Configure OpenAI
const openai = createOpenAI({
    name: 'bills-query',
    apiKey: process.env.BILLS_OPENAI_API_KEY ?? '',
    baseURL: process.env.BILLS_OPENAI_BASE_URL,
});

export const billsQueryTool = tool({
    description: "Queries legislative bills data including information about districts, precincts, parties, and representatives. This tool can provide data about voting records, bill sponsorship, and legislative outcomes.",
    parameters: billsQuerySchema,
    execute: async ({ query }: z.infer<typeof billsQuerySchema>) => {
        try {
            // Get table DDL for context and load system prompt
            const [tableDDL, systemPrompt] = await Promise.all([
                getTableDDL(),
                loadSystemPrompt()
            ]);
            
            // Generate SQL query using OpenAI
            const { text } = await generateText({
                // @ts-ignore
                model: openai('hf:Qwen/Qwen2.5-Coder-32B-Instruct'),
                prompt: `${systemPrompt.replace('{table_ddl}', tableDDL)}\n\nUser Query: ${query}`,
                maxRetries: 10,
                temperature: 0,
                maxTokens: 10000
            });
            
            // Parse the response as JSON
            const response = JSON.parse(text);
            
            // Execute the SQL query
            const result = await executeSql({
                queries: [response.sql]
            });
            
            // Check for errors
            if ('error' in result) {
                return {
                    error: result.error,
                    query: response.sql,
                    explanation: response.explanation
                };
            }
            
            // Return the results in JSON format
            return {
                query: response.sql,
                explanation: response.explanation,
                transformations: response.transformations || {},
                results: JSON.parse(result.results[0])
            };
        } catch (error) {
            console.error('Error in billsQueryTool:', error);
            return {
                error: 'Failed to process bills query. Please try rephrasing your question or providing more specific criteria.',
                details: error instanceof Error ? error.message : String(error)
            };
        }
    },
});

// Re-export everything that should be available from this module
export type { TableDDLRow } from './types';
export { billsQuerySchema, responseSchema } from './types';
export { executeSql } from './execute-sql';
export { getTableDDL, loadSystemPrompt } from './utils';
