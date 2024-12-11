import { AutoTokenizer, AutoModelForSeq2SeqLM } from "@huggingface/transformers";
import { env } from "@huggingface/transformers";

// Specify a custom location for models.
env.localModelPath = "E:/Development/voter-ai-chat/public/models";
env.allowRemoteModels = false;

export const generateSQL = async (inputPrompt) => {
	try {
		// Load tokenizer and model
		const tokenizer = await AutoTokenizer.from_pretrained("cssupport/t5-small-awesome-text-to-sql");
		const model = await AutoModelForSeq2SeqLM.from_pretrained("cssupport/t5-small-awesome-text-to-sql");

		// Tokenize the input prompt
		const tokenizedInputs = await tokenizer(inputPrompt, {
			return_tensors: "pt", // Use PyTorch-style tensors
			padding: true,
			truncation: true,
		});

		// Extract `input_ids` and `attention_mask`
		const { input_ids, attention_mask } = tokenizedInputs;

		// Generate SQL query
		const output = await model.generate({
			input_ids,
			attention_mask,
			generation_config: {
				max_length: 512, // Maximum number of tokens for output
				num_beams: 5,    // Beam search for better quality
				temperature: 0.0, // Sampling temperature for diversity
			},
		});

		// Decode the output to human-readable text
		const generatedSQL = tokenizer.decode(output[0], { skip_special_tokens: true });

		return generatedSQL;
	} catch (error) {
		console.error("Error generating SQL:", error);
		throw new Error("Failed to generate SQL query.");
	}
}

// Example Usage
(async () => {
	const inputPrompt =
		"tables:\n" +
		"CREATE TABLE student_course_attendance (student_id VARCHAR); CREATE TABLE students (student_id VARCHAR)" +
		"\n" +
		"query for:" +
		"List the id of students who never attends courses?";

	const generatedSQL = await generateSQL(inputPrompt);
	console.log(`The generated SQL query is: ${generatedSQL}`);
})();
