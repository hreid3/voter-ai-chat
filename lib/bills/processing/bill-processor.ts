import type { Sql } from 'postgres';
import type { HfInference } from '@huggingface/inference';
import type { Bill } from '../import/types';
import FeatureExtractionPipelineSingleton from '../import/ml/feature-extraction';

interface ClassificationResponse {
    categories: string[];
}

export class BillProcessor {
    private sql: Sql;
    private embedder: HfInference | null = null;
    private batchSize = 50;

    constructor(sql: Sql) {
        this.sql = sql;
    }

    async initialize() {
        console.log('Initializing embedding model...');
        const embedder = new FeatureExtractionPipelineSingleton();
        this.embedder = await embedder.getInstance();
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const embedder = new FeatureExtractionPipelineSingleton();
        return embedder.generateEmbedding(text);
    }

    async classifyBill(title: string, description: string): Promise<string[]> {
        // Construct the prompt for classification
        const prompt = `Classify the following bill into relevant categories. Choose from: Healthcare, Education, Infrastructure, Environment, Finance, Technology, Social Services, or Other.

Title: ${title}
Description: ${description}

Categories (comma-separated):`;

        try {
            // For now, we'll use a simple rule-based classification
            // In a real implementation, you would call your LLM service here
            const keywords = {
                Healthcare: ['health', 'medical', 'hospital', 'medicare', 'medicaid'],
                Education: ['education', 'school', 'student', 'teacher', 'learning'],
                Infrastructure: ['infrastructure', 'road', 'bridge', 'transportation', 'construction'],
                Environment: ['environment', 'climate', 'pollution', 'energy', 'conservation'],
                Finance: ['finance', 'tax', 'budget', 'banking', 'investment'],
                Technology: ['technology', 'digital', 'internet', 'cyber', 'data'],
                'Social Services': ['welfare', 'social', 'community', 'housing', 'assistance']
            };

            const text = `${title} ${description}`.toLowerCase();
            const categories = new Set<string>();

            for (const [category, words] of Object.entries(keywords)) {
                if (words.some(word => text.includes(word))) {
                    categories.add(category);
                }
            }

            return categories.size > 0 ? Array.from(categories) : ['Other'];
        } catch (error) {
            console.error('Error classifying bill:', error);
            return ['Other'];
        }
    }

    async processBill(bill: Bill): Promise<void> {
        try {
            // Generate embedding
            const text = `${bill.title} ${bill.description}`;
            const embedding = await this.generateEmbedding(text);
            const embeddingStr = `[${embedding.join(',')}]`;

            // Update database
            await this.sql`
                UPDATE bills 
                SET embedding = ${embeddingStr}::vector,
                    updated_at = CURRENT_TIMESTAMP
                WHERE bill_id = ${bill.billId}
            `;
        } catch (error) {
            console.error(`Error processing bill ${bill.billId}:`, error);
            throw error;
        }
    }

    async processUnprocessedBills(): Promise<void> {
        try {
            let processed = 0;
            let hasMore = true;

            while (hasMore) {
                await this.sql.begin(async (sql) => {
                    // Get a batch of unprocessed bills
                    const rows = await sql`
                        SELECT bill_id, title, description, categories, created_at
                        FROM bills 
                        WHERE embedding IS NULL 
                        LIMIT ${this.batchSize}
                        FOR UPDATE SKIP LOCKED
                    `;

                    if (rows.length === 0) {
                        hasMore = false;
                        return;
                    }

                    // Map rows to Bill type
                    const bills: Bill[] = rows.map(row => ({
                        billId: row.bill_id,
                        title: row.title,
                        description: row.description,
                        categories: row.categories || [],
                        createdAt: row.created_at
                    }));

                    // Process bills in parallel
                    await Promise.all(bills.map(bill => this.processBill(bill)));

                    processed += bills.length;
                    console.log(`Processed ${processed} bills`);
                });
            }

            console.log('Finished processing all unprocessed bills');
        } catch (error) {
            console.error('Error processing bills:', error);
            throw error;
        }
    }

    async findSimilarBills(billId: string, limit = 5): Promise<Bill[]> {
        try {
            // Get the embedding for the target bill
            const [bill] = await this.sql`
                SELECT embedding FROM bills WHERE bill_id = ${billId}
            `;

            if (!bill) {
                throw new Error(`Bill ${billId} not found`);
            }

            // Find similar bills using cosine similarity
            return await this.sql`
                SELECT bill_id, title, description, categories
                FROM bills
                WHERE bill_id != ${billId} AND embedding IS NOT NULL
                ORDER BY embedding <=> ${bill.embedding}::vector
                LIMIT ${limit}
            `;
        } catch (error) {
            console.error('Error finding similar bills:', error);
            throw error;
        }
    }

    async findBillsByCategory(category: string, limit = 10): Promise<Bill[]> {
        try {
            return await this.sql`
                SELECT bill_id, title, description, categories
                FROM bills
                WHERE categories @> ${[category]}
                LIMIT ${limit}
            `;
        } catch (error) {
            console.error('Error finding bills by category:', error);
            throw error;
        }
    }
} 