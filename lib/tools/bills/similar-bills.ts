import { tool } from 'ai';
import { z } from 'zod';
import { sql } from '@/lib/bills/db';
import { generateQueryEmbedding } from './embeddings';

export const similarBillsSchema = z.object({
    query: z.string().describe('The natural language query to find similar bills'),
    limit: z.number().optional().default(10).describe('Maximum number of similar bills to return'),
    threshold: z.number().optional().default(0.8).describe('Similarity threshold (0-1)')
});

export const similarBillsTool = tool({
    description: "Find bills that are semantically similar to a given query using vector similarity search.",
    parameters: similarBillsSchema,
    execute: async ({ query, limit = 10, threshold = 0.8 }) => {
        try {
            // Generate embedding for the query using all-minilm-l6-v2 (384 dimensions)
            const embedding = await generateQueryEmbedding(query);

            // Search for similar bills using vector similarity
            const result = await sql.unsafe<any[]>(`
                WITH similarity_search AS (
                    SELECT 
                        bill_number,
                        title,
                        description,
                        subjects,
                        inferred_categories,
                        committee_name,
                        last_action,
                        last_action_date,
                        embedding <=> $1::vector(384) AS distance
                    FROM bills
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> $1::vector(384)
                    LIMIT $2
                )
                SELECT *
                FROM similarity_search
                WHERE distance < $3
                ORDER BY distance;
            `, [`[${embedding.join(',')}]`, limit, threshold]);

            return {
                query,
                results: result.map(bill => ({
                    billNumber: bill.bill_number,
                    title: bill.title,
                    description: bill.description,
                    subjects: bill.subjects,
                    inferredCategories: bill.inferred_categories,
                    committee: bill.committee_name,
                    lastAction: bill.last_action,
                    lastActionDate: bill.last_action_date,
                    similarity: 1 - bill.distance
                }))
            };
        } catch (error) {
            console.error('Error finding similar bills:', error);
            return {
                error: 'Failed to find similar bills',
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }
}); 