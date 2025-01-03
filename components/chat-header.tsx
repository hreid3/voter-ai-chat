'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { BetterTooltip } from '@/components/ui/tooltip';
import { PlusIcon, } from './icons';
import { useSidebar } from './ui/sidebar';
import { ThemeToggle } from "@/components/theme-toggle";
import useGoogleAnalytics from "@/hooks/useGoogleAnalytics";
import TrackingLink from "@/components/ui/TrackingLink";

export function ChatHeader({ selectedModelId }: { selectedModelId: string }) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();
	const { trackEvent } = useGoogleAnalytics();

  return (
    <header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
      {(!open || windowWidth < 768) && (
				<BetterTooltip align="start" content="New Chat">
					<span>
						<Button
							variant="outline"
							className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
							onClick={() => {
								trackEvent("chat", "Click New Chat", "New Chat")
								router.push('/');
								router.refresh();
							}}
						>
							<PlusIcon />
							<span className="md:sr-only">New Chat</span>
						</Button>
						<TrackingLink category="chat" action="sidebar-click logo" href="/">
							<img src="/images/original-logo.svg" alt="Voter AI Logo" className="inline-flex ml-4 w-28	" />
						</TrackingLink>
					</span>
        </BetterTooltip>
      )}
			<div className="ml-auto"><ThemeToggle /></div>
    </header>
  );
}
