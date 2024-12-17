import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		ppr: false,
	},
	images: {
		remoteP atterns: [
			{
				hostname: 'avatar.vercel.sh',
			},
		],
	},
	webpack: (config) => {
		// Add support for importing .md files as strings
		config.module.rules.push({
			test: /\.md$/,
			use: 'raw-loader',
		});

		return config;
	},
};

export default nextConfig;
