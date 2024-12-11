import { pipeline } from "@huggingface/transformers";

// Use the Singleton pattern to enable lazy initialization of the summarization pipeline.
const SummarizationPipeline = () =>
	class SummarizationPipelineSingleton {
		static task = "summarization"; // Define the summarization task
		static model = "Falconsai/text_summarization"; // Use a summarization model from Hugging Face
		static instance: any = null; // Holds the initialized pipeline

		/**
		 * Returns a Singleton instance of the summarization pipeline.
		 * @param progress_callback Optional progress callback.
		 */
		static async getInstance(progress_callback = null) {
			if (this.instance === null) {
				// Initialize the pipeline only once.
				// @ts-ignore
				this.instance = pipeline(this.task, this.model, { progress_callback,
					device: 'cpu'
				});
			}
			return this.instance;
		}
	};

let SummarizationPipelineSingleton;

// Enable hot reloading in development mode by attaching the pipeline to the global object
if (process.env.NODE_ENV !== "production") {
	// @ts-ignore
	if (!global.SummarizationPipelineSingleton) {
		// @ts-ignore
		global.SummarizationPipelineSingleton = SummarizationPipeline();
	}
	// @ts-ignore
	SummarizationPipelineSingleton = global.SummarizationPipelineSingleton;
} else {
	SummarizationPipelineSingleton = SummarizationPipeline();
}

export default SummarizationPipelineSingleton;
