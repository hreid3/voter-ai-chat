import { executeSelectsTool } from "@/lib/voter/query/execute-selects";
import { fetchTableDdlTool } from "@/lib/voter/query/fetch-table-ddl";

export const getVoterAiChatUiToolset = ()=>  {
    // We can do some trickery here.
    return {
			fetchTableDdls: fetchTableDdlTool,
			// findPossibleSimilarValues: findPossibleSimilarValuesTool,
			executeSelects: executeSelectsTool,
    }
}
