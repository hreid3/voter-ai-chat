'use server';
import { createAnthropic } from '@ai-sdk/anthropic';
import sonnetVoterAiSysMesg from '@/lib/voter/prompt-engineering/sonnet-votere-ai-sys-mesg.md';

const anthropic = createAnthropic({
	fetch: (request, options) => {
		// console.log("horace.request", options);
		return fetch(request, options);
	}
	// custom settings
});
export const  getAnthropicModel = async () => {
	const model = anthropic('claude-3-5-sonnet-latest');

	return { model, systemMessage: sonnetVoterAiSysMesg }

}
