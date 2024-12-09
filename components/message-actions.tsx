import type { Message } from 'ai';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';
import { getMessageIdFromAnnotations } from '@/lib/utils';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useEffect, useLayoutEffect, useState } from "react";

export function MessageActions({
  chatId,
  message,
  vote,
  isLoading,
	streaming,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
	streaming: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
	const [initialized, setInitialized] = useState(false);
	useLayoutEffect(() => {
		if (!streaming && !isLoading) {
			setInitialized(true)
		}
	}, [isLoading, streaming])

  if (message.role === 'user') return null;
  if (message.toolInvocations && message.toolInvocations.length > 0)
    return null;

  return initialized && (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2 DO-NOT-JUMP-DOWN">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                await copyToClipboard(message.content as string);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {/*<Tooltip>*/}
        {/*  <TooltipTrigger asChild>*/}
        {/*    <Button*/}
        {/*      className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"*/}
        {/*      disabled={vote?.isUpvoted}*/}
        {/*      variant="outline"*/}
        {/*      onClick={async () => {*/}
        {/*        const messageId = getMessageIdFromAnnotations(message);*/}

        {/*        const upvote = fetch('/api/vote', {*/}
        {/*          method: 'PATCH',*/}
        {/*          body: JSON.stringify({*/}
        {/*            chatId,*/}
        {/*            messageId,*/}
        {/*            type: 'up',*/}
        {/*          }),*/}
        {/*        });*/}

        {/*        toast.promise(upvote, {*/}
        {/*          loading: 'Upvoting Response...',*/}
        {/*          success: () => {*/}
        {/*            mutate<Array<Vote>>(*/}
        {/*              `/api/vote?chatId=${chatId}`,*/}
        {/*              (currentVotes) => {*/}
        {/*                if (!currentVotes) return [];*/}

        {/*                const votesWithoutCurrent = currentVotes.filter(*/}
        {/*                  (vote) => vote.messageId !== message.id,*/}
        {/*                );*/}

        {/*                return [*/}
        {/*                  ...votesWithoutCurrent,*/}
        {/*                  {*/}
        {/*                    chatId,*/}
        {/*                    messageId: message.id,*/}
        {/*                    isUpvoted: true,*/}
        {/*                  },*/}
        {/*                ];*/}
        {/*              },*/}
        {/*              { revalidate: false },*/}
        {/*            );*/}

        {/*            return 'Upvoted Response!';*/}
        {/*          },*/}
        {/*          error: 'Failed to upvote response.',*/}
        {/*        });*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      <ThumbUpIcon />*/}
        {/*    </Button>*/}
        {/*  </TooltipTrigger>*/}
        {/*  <TooltipContent>Upvote Response</TooltipContent>*/}
        {/*</Tooltip>*/}

        {/*<Tooltip>*/}
        {/*  <TooltipTrigger asChild>*/}
        {/*    <Button*/}
        {/*      className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"*/}
        {/*      variant="outline"*/}
        {/*      disabled={vote && !vote.isUpvoted}*/}
        {/*      onClick={async () => {*/}
        {/*        const messageId = getMessageIdFromAnnotations(message);*/}

        {/*        const downvote = fetch('/api/vote', {*/}
        {/*          method: 'PATCH',*/}
        {/*          body: JSON.stringify({*/}
        {/*            chatId,*/}
        {/*            messageId,*/}
        {/*            type: 'down',*/}
        {/*          }),*/}
        {/*        });*/}

        {/*        toast.promise(downvote, {*/}
        {/*          loading: 'Downvoting Response...',*/}
        {/*          success: () => {*/}
        {/*            mutate<Array<Vote>>(*/}
        {/*              `/api/vote?chatId=${chatId}`,*/}
        {/*              (currentVotes) => {*/}
        {/*                if (!currentVotes) return [];*/}

        {/*                const votesWithoutCurrent = currentVotes.filter(*/}
        {/*                  (vote) => vote.messageId !== message.id,*/}
        {/*                );*/}

        {/*                return [*/}
        {/*                  ...votesWithoutCurrent,*/}
        {/*                  {*/}
        {/*                    chatId,*/}
        {/*                    messageId: message.id,*/}
        {/*                    isUpvoted: false,*/}
        {/*                  },*/}
        {/*                ];*/}
        {/*              },*/}
        {/*              { revalidate: false },*/}
        {/*            );*/}

        {/*            return 'Downvoted Response!';*/}
        {/*          },*/}
        {/*          error: 'Failed to downvote response.',*/}
        {/*        });*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      <ThumbDownIcon />*/}
        {/*    </Button>*/}
        {/*  </TooltipTrigger>*/}
        {/*  <TooltipContent>Downvote Response</TooltipContent>*/}
        {/*</Tooltip>*/}
      </div>
    </TooltipProvider>
  );
}
