import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		ppr: false,
	},
	serverExternalPackages: ['sharp', 'onnxruntime-node'],
	images: {
		remotePatterns: [
			{
				hostname: 'avatar.vercel.sh',
			},
		],
	},
	webpack: (config, { dev }) => {
		// Add support for importing .md files as strings
		config.module.rules.push({
			test: /\.md$/,
			use: 'raw-loader',
		});

		// Disable cache in production builds
		if (config.cache && !dev) {
			config.cache = {
				type: 'memory',
			};
		}

		return config;
	},
};

export default nextConfig;
