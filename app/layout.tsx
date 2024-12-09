import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';
import { Favicon } from "@/components/Favicon";

import './globals.css';
import GoogleAnalyticsProvider from "@/components/analytics/GoogleAnalyticsProvider";

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;
export const metadata: Metadata = {
	title: 'VoterAI',
	description: 'Empower users with accurate, privacy-protected voter registration information for Georgia through a sophisticated data management system.',
	metadataBase: new URL('https://voterai.chat'),
	openGraph: {
		title: 'VoterAI',
		description: 'VoteAI is a conversational AI web application to provide voter insights. Explore districts, plan campaigns, and access voter data efficiently.',
		url: 'https://voterai.chat',
		siteName: 'VoterAI',
		images: [
			{
				url: '/images/A_visually_engaging_Open_Graph_image_resized_1200x630.png', // Replace with your actual image URL
				width: 1200,
				height: 630,
					alt: 'Diverse group of people standing in line to vote',
			},
		],
		locale: 'en_US',
		type: 'website',
	},
}
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <head>
				<Favicon />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
					<GoogleAnalyticsProvider>{children}</GoogleAnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
