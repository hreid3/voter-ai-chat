'use client';

import React, { type PropsWithChildren, useEffect } from 'react';
import useGoogleAnalytics from "@/hooks/useGoogleAnalytics";
import { usePathname } from "next/navigation";

const GoogleAnalyticsProvider: React.FC<PropsWithChildren<Record<string, unknown>>> = ({ children }) => {
	const { trackPageView } = useGoogleAnalytics();
	const pathname = usePathname()

	useEffect(() => {
		try {
			trackPageView(pathname);
		} catch (error) {
			// Recommend: reporting this error to an error tracking service
			console.log("Error executing trackPageView Google Analytics", { Error: error });
		}
	}, [pathname, trackPageView]);
	// Remark: this allows GoogleAnalyticsProvider to wrap other components without affecting the UI
	return <>{children}</>;
}

export default GoogleAnalyticsProvider;
