import React, { useCallback, useRef } from "react";
import Link, { type LinkProps } from "next/link";
import useGoogleAnalytics from "@/hooks/useGoogleAnalytics";
import { debounce } from "next/dist/server/utils";

interface TrackingLinkProps extends LinkProps {
	category: string;
	action: string;
	label?: string;
	value?: number;
	className?: string; // Allow className to be passed
	children: React.ReactNode;
}

const TrackingLink: React.FC<TrackingLinkProps> = ({
																										 category,
																										 action,
																										 label,
																										 value,
																										 className,
																										 children,
																										 ...linkProps
																									 }) => {
	const { trackEvent } = useGoogleAnalytics();

	const debouncedHover = useRef(
		debounce((category: string, action: string, label?: string) => {
			trackEvent(category, action, label);
		}, 300) // Adjust debounce delay as needed
	).current;

	const handleMouseEnter = useCallback(() => {
		debouncedHover(category, `${action} - hover`, label);
	}, [debouncedHover, category, action, label]);

	const handleClick = useCallback(() => {
		trackEvent(category, action, label, value);
	}, [trackEvent, category, action, label, value]);

	return (
		<Link
			{...linkProps}
			className={className}
			onMouseEnter={handleMouseEnter}
			onClick={handleClick}
		>
			{children}
		</Link>
	);
};

export default TrackingLink;
