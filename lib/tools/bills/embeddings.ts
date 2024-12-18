import FeatureExtractionPipelineSingleton from '@/lib/bills/import/ml/feature-extraction';

const featureExtractor = new FeatureExtractionPipelineSingleton();

/**
 * Generate an embedding vector for a query string using all-minilm-l6-v2 (384 dimensions)
 * @param query The query text to generate an embedding for
 * @returns A vector of numbers representing the embedding
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
    try {
        return await featureExtractor.generateEmbedding(query);
    } catch (error) {
        console.error('Error generating query embedding:', error);
        throw error;
    }
} 