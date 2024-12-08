'use server';
import { openai } from "@ai-sdk/openai";
import voterAiAssistantSystemMessage from '@/lib/voter/prompt-engineering/voter-ai-agent-system-message.md';

export const  getOpenai = async () => ({ model: openai('gpt-4o-2024-08-06'), systemMessage: voterAiAssistantSystemMessage })

