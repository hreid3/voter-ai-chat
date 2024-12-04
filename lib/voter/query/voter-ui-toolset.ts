import { z } from "zod";
import { executeSelectsTool } from "@/lib/voter/query/execute-selects";
import { fetchTableDdlTool } from "@/lib/voter/query/fetch-table-ddl";
import fetchVoterDataColumnLookupTool, { listVoterDataMappingKeysTool } from "@/lib/voter/query/voter-lookup-values";

export const getVoterAiChatUiToolset = () => {
	// We can do some trickery here.
	return {
		listVoterDataMappingKeysTool,
		fetchTableDdls: fetchTableDdlTool,
		voterDataColumnLookupTool: fetchVoterDataColumnLookupTool,
		executeSelects: executeSelectsTool,
		errorMessageTool: {
			description: "A utility tool to process and handle error messages returned by any other tool. It helps capture, log, and communicate error messages effectively in a structured manner.",
			parameters: z.object({
				errorMessage: z.string().describe("The detailed error message that was generated during the execution of another tool. This error message is expected to provide a clear description of what went wrong, including any relevant context or diagnostic information."),
			}).describe("An object containing the necessary parameters for handling the error message, specifically the error message string that needs to be logged or processed."),
			execute: async ({ errorMessage }: { errorMessage: string }) => (errorMessage),
		},
	}
}
