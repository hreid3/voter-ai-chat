import { pipeline } from '@huggingface/transformers';

interface CategoryWithScore {
    category: string;
    score: number;
}

interface ZeroShotClassifierClass {
    pipeline: any | null;
    getInstance(): Promise<any>;
    classifyText(text: string): Promise<CategoryWithScore[]>;
}

const CATEGORIES = [
    "Healthcare",
    "Education",
    "Infrastructure",
    "Environment",
    "Finance",
    "Technology",
    "Social Services",
    "Defense",
    "Agriculture",
    "Labor",
    "Energy",
    "Transportation",
    "Justice",
    "Housing",
    "Foreign Affairs"
];

const ZeroShotClassifier = () =>
    class ZeroShotClassifierSingleton implements ZeroShotClassifierClass {
        pipeline: any | null = null;
        model = "Xenova/nli-deberta-v3-xsmall";

        async getInstance(): Promise<any> {
            if (this.pipeline === null) {
                this.pipeline = await pipeline('zero-shot-classification', this.model);
            }
            return this.pipeline;
        }

        async classifyText(text: string): Promise<CategoryWithScore[]> {
            const classifier = await this.getInstance();
            const result = await classifier(text, CATEGORIES);

            return result.scores
                .map((score: number, index: number) => ({
                    category: result.labels[index],
                    score
                }))
                .sort((a: CategoryWithScore, b: CategoryWithScore) => b.score - a.score)
                .slice(0, 3);
        }
    };

let ZeroShotClassifierSingleton: ReturnType<typeof ZeroShotClassifier>;

// Enable hot reloading in development mode
if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    if (!global.ZeroShotClassifierSingleton) {
        // @ts-ignore
        global.ZeroShotClassifierSingleton = ZeroShotClassifier();
    }
    // @ts-ignore
    ZeroShotClassifierSingleton = global.ZeroShotClassifierSingleton;
} else {
    ZeroShotClassifierSingleton = ZeroShotClassifier();
}

export default ZeroShotClassifierSingleton; 