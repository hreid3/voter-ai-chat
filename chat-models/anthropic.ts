import { createAnthropic } from '@ai-sdk/anthropic';
import sonnetVoterAiSysMesg from '@/lib/voter/prompt-engineering/sonnet-votere-ai-sys-mesg.md';

const anthropic = createAnthropic({
  fetch: (request, options) => {
    return fetch(request, options);
  }
  // custom settings
});
export const getAnthropicModel = () => {
  const model = anthropic('claude-3-5-sonnet-latest',
    {cacheControl: true}
  );

  return {model, systemMessage: sonnetVoterAiSysMesg}
}
