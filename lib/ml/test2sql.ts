import { pipeline } from "@huggingface/transformers";
import { env } from '@huggingface/transformers';

// Specify a custom location for models (defaults to '/models/').
env.localModelPath = 'E:\\Development\\voter-ai-chat\\public\\models';
env.allowRemoteModels = false;

// Use the Singleton pattern to enable lazy construction of the pipeline.
// NOTE: We wrap the class in a function to prevent code duplication (see below).
const P = () => class Text2SqlPipelineSingleton {
	static task = 'text2text-generation';
	static model = 'cssupport/t5-small-awesome-text-to-sql';
	static instance = null;

	static async getInstance(progress_callback = null) {
		if (this.instance === null) {
			// @ts-ignore
			this.instance = pipeline(this.task, this.model, {
				max_length: 512, // Set the maximum number of tokens for the output
				progress_callback,
			});
		}
		return this.instance;
	}
};

let Text2SqlPipelineSingleton;
if (process.env.NODE_ENV !== 'production') {
	// When running in development mode, attach the pipeline to the
	// global object so that it's preserved between hot reloads.
	// For more information, see https://vercel.com/guides/nextjs-prisma-postgres
	// @ts-ignore
	if (!global.Text2SqlPipelineSingleton) {
		// @ts-ignore
		global.Text2SqlPipelineSingleton = P();
	}
	// @ts-ignore
	Text2SqlPipelineSingleton = global.Text2SqlPipelineSingleton;
} else {
	Text2SqlPipelineSingleton = P();
}
export default Text2SqlPipelineSingleton;
