'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cx } from 'class-variance-authority'

type Message = 'Working...' | 'Please standby' | 'This is taking longer than expected...'
type Role = 'assistant' | 'user'

interface ThinkingMessageProps {
	initialMessage?: Message
	role?: Role
	haltAnimation?: boolean
}

export const ThinkingMessage: React.FC<ThinkingMessageProps> = ({
																																	initialMessage = 'Working...',
																																	role = 'assistant',
																																	haltAnimation = false
																																}) => {
	const [message, setMessage] = useState<Message>(initialMessage)
	const [elapsed, setElapsed] = useState(0)

	useEffect(() => {
		if (haltAnimation) {
			return
		}

		const timer = setInterval(() => {
			setElapsed((prev) => prev + 1)
		}, 1000)

		return () => clearInterval(timer)
	}, [haltAnimation])

	useEffect(() => {
		if (haltAnimation) {
			return
		}

		if (elapsed < 5) {
			setMessage('Working...')
		} else if (elapsed < 9) {
			setMessage('Please standby')
		} else {
			setMessage('This is taking longer than expected...')
		}
	}, [elapsed, haltAnimation])

	return (
		<motion.div
			className="w-full mx-auto max-w-3xl px-4 group/message"
			initial={{ y: 5, opacity: 0 }}
			animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
			data-role={role}
		>
			<div
				className={cx(
					'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
					{
						'group-data-[role=user]/message:bg-muted': true,
					}
				)}
			>
				<div className="flex flex-col gap-2 w-full">
					<motion.div
						className="flex flex-col gap-4 text-muted-foreground"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
						{message}
					</motion.div>
				</div>
			</div>
		</motion.div>
	)
}

