import type { CoreSystemMessage } from "ai";
import voterAiAssistantSystemMessage from '@/lib/voter/prompt-engineering/voter-ai-agent-system-message.md';

export const voterAssistantSystemMessage: CoreSystemMessage = {
    role: "system",
    content: voterAiAssistantSystemMessage
}
