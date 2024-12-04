import { convertToCoreMessages, type Message, StreamData, streamText,  type CoreSystemMessage } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { models } from '@/lib/ai/models';
import { deleteChatById, getChatById, saveChat, saveMessages, } from '@/lib/db/queries';
import { generateUUID, getMostRecentUserMessage, sanitizeResponseMessages, } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { getVoterAiChatUiToolset } from "@/lib/voter/query/voter-ui-toolset";
import { openai } from "@ai-sdk/openai";

import voterAiAssistantSystemMessage from '@/lib/voter/prompt-engineering/voter-ai-agent-system-message.md';
import { fetchStaticMapTool } from "@/lib/tools/fetchStaticMapTool";

const voterAssistantSystemMessage: CoreSystemMessage = {
	role: "system",
	content: voterAiAssistantSystemMessage
}

export async function POST(request: Request) {
	try {
		const {
			id,
			messages: originMessages,
			modelId,
		}: { id: string; messages: Array<Message>; modelId: string } =
			await request.json();

		const session = await auth();

		if (!session || !session.user || !session.user.id) {
			return new Response('Unauthorized', {status: 401});
		}

		const model = models.find((model) => model.id === modelId);

		if (!model) {
			return new Response('Model not found', {status: 404});
		}
		const messages = originMessages.filter(v => !(v.toolInvocations?.length && v.toolInvocations?.find((u: any) => !u?.result)))

		const coreMessages = convertToCoreMessages(messages);
		const userMessage = getMostRecentUserMessage(coreMessages);

		if (!userMessage) {
			return new Response('No user message found', {status: 400});
		}

		const chat = await getChatById({id});

		if (!chat) {
			const title = await generateTitleFromUserMessage({message: userMessage});
			await saveChat({id, userId: session.user.id, title});
		}

		await saveMessages({
			messages: [
				{...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id},
			],
		});

		const streamingData = new StreamData();

		const result = streamText({
			model: openai('gpt-4o-2024-08-06'),
			system: voterAssistantSystemMessage.content,
			messages: coreMessages,
			maxSteps: 20,
			onStepFinish: ({response: {messages}}) => {
				// console.log(messages);
			},
			// experimental_activeTools: allTools,
			tools: {
				...getVoterAiChatUiToolset(),
				fetchStaticMapTool,
			},
			onFinish: async ({response: {messages: responseMessages}}) => {
				if (session.user?.id) {
					try {
						const responseMessagesWithoutIncompleteToolCalls =
							sanitizeResponseMessages(responseMessages);

						await saveMessages({
							messages: responseMessagesWithoutIncompleteToolCalls.map(
								(message) => {
									const messageId = generateUUID();

									if (message.role === 'assistant') {
										streamingData.appendMessageAnnotation({
											messageIdFromServer: messageId,
										});
									}

									return {
										id: messageId,
										chatId: id,
										role: message.role,
										content: message.content,
										createdAt: new Date(),
									};
								},
							),
						});
					} catch (error) {
						console.error('Failed to save chat', error);
					}
				}

				streamingData.close();
			},
			experimental_telemetry: {
				isEnabled: true,
				functionId: 'stream-text',
			},
		});

		return result.toDataStreamResponse({
			data: streamingData,
		});
	} catch (error) {
		console.error("Error processing request", error);
		return new Response('An error occurred while processing your request', {
			status: 500,
		});
	}
}

export async function DELETE(request: Request) {
	const {searchParams} = new URL(request.url);
	const id = searchParams.get('id');

	if (!id) {
		return new Response('Not Found', {status: 404});
	}

	const session = await auth();

	if (!session || !session.user) {
		return new Response('Unauthorized', {status: 401});
	}

	try {
		const chat = await getChatById({id});

		if (chat.userId !== session.user.id) {
			return new Response('Unauthorized', {status: 401});
		}

		await deleteChatById({id});

		return new Response('Chat deleted', {status: 200});
	} catch (error) {
		return new Response('An error occurred while processing your request', {
			status: 500,
		});
	}
}
