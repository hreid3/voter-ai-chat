import { pipeline } from '@huggingface/transformers';

interface FeatureExtractionClass {
    pipeline: any | null;
    getInstance(): Promise<any>;
    generateEmbedding(text: string): Promise<number[]>;
}

const FeatureExtractionPipeline = () =>
    class FeatureExtractionPipelineSingleton implements FeatureExtractionClass {
        pipeline: any | null = null;
        model = "Xenova/all-minilm-l6-v2";

        async getInstance(): Promise<any> {
            if (this.pipeline === null) {
                this.pipeline = await pipeline('feature-extraction', this.model);
            }
            return this.pipeline;
        }

        async generateEmbedding(text: string): Promise<number[]> {
            const extractor = await this.getInstance();
            const output = await extractor(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        }
    };

let FeatureExtractionPipelineSingleton: ReturnType<typeof FeatureExtractionPipeline>;

// Enable hot reloading in development mode
if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    if (!global.FeatureExtractionPipelineSingleton) {
        // @ts-ignore
        global.FeatureExtractionPipelineSingleton = FeatureExtractionPipeline();
    }
    // @ts-ignore
    FeatureExtractionPipelineSingleton = global.FeatureExtractionPipelineSingleton;
} else {
    FeatureExtractionPipelineSingleton = FeatureExtractionPipeline();
}

export default FeatureExtractionPipelineSingleton; 