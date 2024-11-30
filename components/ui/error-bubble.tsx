import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorBubbleProps {
	message: string
}

export default function ErrorBubble({ message }: ErrorBubbleProps) {
	return (
		<div className="flex justify-center w-full">
			<div className="w-full md:w-[50%] flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
				<AlertCircle className="flex-shrink-0 w-6 h-6 mr-3" />
				<span className="sr-only">Error</span>
				<div>
					<span className="font-medium">{message}</span>
				</div>
			</div>
		</div>
	)
}

