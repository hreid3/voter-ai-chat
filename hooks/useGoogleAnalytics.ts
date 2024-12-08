import { useEffect } from 'react';
import ReactGA from 'react-ga4';

const appVersion = process.env.APP_VERSION;
const useGoogleAnalytics = ({ userId }: { userId?: string } = {} as Record<string, unknown>) => {
	const trackingId = process.env.NEXT_PUBLIC_GA_ID;
	useEffect(() => {
		if (trackingId) {
			try {
				ReactGA.initialize([
					{
						trackingId,
						gaOptions: {
							anonymizeIp: true,
							clientId: userId,
						}
					}
				]);
				ReactGA.set({ app_version: appVersion });
			} catch (error) {
				// Recommend: reporting this error to an error tracking service
				console.log("Error initializing Google Analytics", { Error: error });
			}
		}
	}, [userId]);

	const isTrackingEnabled = () => !!trackingId;
	const setOption = (key: string, value: unknown) => {
		ReactGA.set({ [key]: value });
	};

	const setUserId = (userId: string | number) => {
		setOption("userId", userId);
	};

	const sendData = (type: string, data: Record<string, unknown>) => {
		if (isTrackingEnabled()) {
			ReactGA.send({ hitType: type, ...data });
		}
	};

	const trackPageView = (pagePath?: string) => {
		if (isTrackingEnabled() && pagePath) {
			setOption('app_version', appVersion);
			sendData("pageview", {page: pagePath});
		}
	};

	const trackEvent = (category: string, action: string, label?: string, value?: number) => {
		setOption('app_version', appVersion);
		ReactGA.event({ category, action, label, value });
	};

	return {
		setOption,
		setUserId,
		trackPageView,
		trackEvent,
	};
};

export default useGoogleAnalytics;
