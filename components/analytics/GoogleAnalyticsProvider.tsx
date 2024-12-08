'use client';

import React, { useEffect, type PropsWithChildren } from 'react';
import useGoogleAnalytics from "@/hooks/useGoogleAnalytics";
import { usePathname, useSearchParams } from "next/navigation";

const GoogleAnalyticsProvider: React.FC<PropsWithChildren<Record<string, unknown>>> = ({ children }) => {
	const { trackPageView } = useGoogleAnalytics();
	const pathname = usePathname()
	const query = useSearchParams();

	useEffect(() => {
		try {
			trackPageView(pathname + query);
		} catch (error) {
			// Recommend: reporting this error to an error tracking service
			console.log("Error executing trackPageView Google Analytics", { Error: error });
		}
	}, [pathname, trackPageView]);
	// Remark: this allows GoogleAnalyticsProvider to wrap other components without affecting the UI
	return <>{children}</>;
}

export default GoogleAnalyticsProvider;
