'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import { ChatHeader } from '@/components/chat-header';
import { PreviewMessage } from '@/components/message';
import { useScrollToBottom } from '@/components/use-scroll-to-bottom';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import { toast } from 'sonner';
import TrackingLink from "@/components/ui/TrackingLink";
import { ThinkingMessage } from "@/components/ThinkingMessage";

export function Chat({
											 id,
											 initialMessages,
											 selectedModelId,
										 }: {
	id: string;
	initialMessages: Array<Message>;
	selectedModelId: string;
}) {
	const {mutate} = useSWRConfig();
	const [streaming, setStreaming] = useState(false);
	const {
		messages,
		setMessages,
		handleSubmit,
		input,
		setInput,
		append,
		isLoading,
		stop,
		data: streamingData,
		error,
	} = useChat({
		body: {id, modelId: selectedModelId},
		initialMessages,
		onResponse: () => {
			setStreaming(true);
		},
		onFinish: () => {
			mutate('/api/history');
			setStreaming(false)
		},
	});
	const {width: windowWidth = 1920, height: windowHeight = 1080} =
		useWindowSize();

	const [block, setBlock] = useState<UIBlock>({
		documentId: 'init',
		content: '',
		title: '',
		status: 'idle',
		isVisible: false,
		boundingBox: {
			top: windowHeight / 4,
			left: windowWidth / 4,
			width: 250,
			height: 50,
		},
	});

	const {data: votes} = useSWR<Array<Vote>>(
		`/api/vote?chatId=${id}`,
		fetcher,
	);

	const [messagesContainerRef, messagesEndRef] =
		useScrollToBottom<HTMLDivElement>();

	const [attachments, setAttachments] = useState<Array<Attachment>>([]);

	useEffect(() => {
		if (error) {
			console.error(error);
			toast.error(`Processing error: ${error.message}`);
		}
	}, [error])
	return (
		<>
			<div className="flex flex-col min-w-0 h-dvh dark:bg-gradient-to-b dark:from-gray-950 dark:to-gray-900">
				<ChatHeader selectedModelId={selectedModelId}/>
				<div
					ref={messagesContainerRef}
					className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
				>
					{messages.length === 0 && <Overview/>}

					{messages.filter(v => !!v.content).map((message, index) => (
						<PreviewMessage
							key={message.id}
							chatId={id}
							message={message}
							block={block}
							setBlock={setBlock}
							isLoading={isLoading && messages.length - 1 === index}
							streaming={streaming}
							vote={
								votes
									? votes.find((vote) => vote.messageId === message.id)
									: undefined
							}
						/>
					))}

					{isLoading &&
						// messages.length > 0 &&
						// messages[messages.length - 1].role === 'user' &&
						(
							<ThinkingMessage haltAnimation={streaming}/>
						)}

					<div
						ref={messagesEndRef}
						className="shrink-0 min-w-[24px] min-h-[24px]"
					/>
				</div>
				<form className="flex mx-auto px-4 pb-3 md:pb-2 gap-2 w-full md:max-w-3xl">
					<MultimodalInput
						chatId={id}
						input={input}
						setInput={setInput}
						handleSubmit={handleSubmit}
						isLoading={isLoading}
						stop={stop}
						attachments={attachments}
						setAttachments={setAttachments}
						messages={messages}
						setMessages={setMessages}
						append={append}
					/>
				</form>
				<div  className="pb-1.5 text-center text-sm">Developed by{' '}
					<TrackingLink
						category="chat"
						action="developer-click"
							className="text-blue-500 underline hover:text-blue-700"   href="mailto:horace.reid@bluenetreflections.com">Horace Reid III</TrackingLink> @ 2024</div>
			</div>

			<AnimatePresence>
				{block?.isVisible && (
					<Block
						chatId={id}
						input={input}
						setInput={setInput}
						handleSubmit={handleSubmit}
						isLoading={isLoading}
						stop={stop}
						attachments={attachments}
						setAttachments={setAttachments}
						append={append}
						block={block}
						setBlock={setBlock}
						messages={messages}
						setMessages={setMessages}
						votes={votes}
						streaming={streaming}
					/>
				)}
			</AnimatePresence>

			<BlockStreamHandler streamingData={streamingData} setBlock={setBlock}/>
		</>
	);
}
