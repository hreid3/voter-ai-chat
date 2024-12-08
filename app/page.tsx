'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart, FileText, MapPin, PieChart, ChevronRight } from 'lucide-react'
// import { ThemeToggle } from '@/components/theme-toggle'
import { motion } from 'framer-motion'

const fadeInUp = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 }
}

const hoverScale = {
	scale: 1.05,
	transition: { duration: 0.2 }
}

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col bg-white dark:bg-gradient-to-b dark:from-gray-950 dark:to-gray-900">
			{/* Header */}
			<motion.header
				className="container mx-auto px-4 py-6 flex justify-end items-center"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<nav className="space-x-4">
					{/*<ThemeToggle />*/}
					<Button asChild variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
						<motion.div whileHover={hoverScale}>
							<Link href="/login">Sign In</Link>
						</motion.div>
					</Button>
					<Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
						<motion.div whileHover={hoverScale}>
							<Link href="/register">Sign Up</Link>
						</motion.div>
					</Button>
				</nav>
			</motion.header>

			{/* Hero Section */}
			<motion.div
				className="flex flex-col items-center justify-center px-4 py-12 text-center bg-gray-50 dark:bg-transparent dark:border-t dark:border-gray-800"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<div className="space-y-8 max-w-4xl">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.5, delay: 0.4 }}
					>
						<Image
							src="/images/original-logo.svg"
							alt="VoterAI Logo"
							width={500}
							height={167}
							className="mx-auto mb-12 transition-transform hover:scale-105"
						/>
					</motion.div>
					<motion.h2
						className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-200"
						{...fadeInUp}
						transition={{ ...fadeInUp.transition, delay: 0.6 }}
					>
						Empowering Voters with Accurate Information
					</motion.h2>
					<motion.p
						className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400"
						{...fadeInUp}
						transition={{ ...fadeInUp.transition, delay: 0.8 }}
					>
						Access accurate, privacy-protected voter registration information through our sophisticated AI-powered platform.
					</motion.p>
					<motion.div
						className="flex flex-col sm:flex-row gap-4 justify-center"
						{...fadeInUp}
						transition={{ ...fadeInUp.transition, delay: 1 }}
					>
						<Button asChild size="lg" className="bg-[#F74040] hover:bg-[#F74040]/90 text-white">
							<motion.div whileHover={hoverScale}>
								<Link href="/register">Get Started</Link>
							</motion.div>
						</Button>
						<Button asChild size="lg" variant="outline" className="text-gray-800 hover:text-gray-900 dark:text-white dark:hover:text-white">
							<motion.div whileHover={hoverScale} className="flex items-center">
								<Link href="/login" className="flex items-center">
									Sign In
									<ChevronRight className="ml-2 size-4" />
								</Link>
							</motion.div>
						</Button>
					</motion.div>
				</div>
			</motion.div>

			<hr className="border-t border-gray-700/30 w-full max-w-4xl mx-auto my-8 hidden dark:block" />

			{/* Features Section */}
			<div className="container mx-auto px-4 py-12 bg-white dark:bg-transparent">
				<motion.h2
					className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-200 font-normal text-center mb-12"
					{...fadeInUp}
				>
					How VoterAI Helps You
				</motion.h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					{[
						{ icon: BarChart, title: "Campaign Insights", description: "Identify strong and weak areas for voter campaign management" },
						{ icon: MapPin, title: "District Information", description: "Learn about voting districts and representatives" },
						{ icon: FileText, title: "Registration Help", description: "Step-by-step guidance for registering to vote in Georgia" },
						{ icon: PieChart, title: "Demographic Analysis", description: "Explore voter demographics and trends to inform campaign strategies" }
					].map((feature, index) => (
						<motion.div
							key={feature.title}
							{...fadeInUp}
							transition={{ ...fadeInUp.transition, delay: 0.2 * (index + 1) }}
							className="flex"
						>
							<Card className="bg-white dark:bg-gray-800/50 hover:shadow-lg transition-shadow dark:backdrop-blur-sm flex flex-col w-full">
								<CardContent className="pt-6 flex flex-row items-start gap-4">
									<div className="rounded-full size-12 bg-[#F74040]/20 dark:bg-[#F74040]/30 flex items-center justify-center shrink-0">
										<feature.icon className="size-6 text-[#F74040] dark:text-[#FF6B6B]" />
									</div>
									<div className="flex flex-col grow">
										<h3 className="font-semibold text-xl mb-2 text-gray-800 dark:text-white">{feature.title}</h3>
										<p className="text-gray-600 dark:text-gray-300">
											{feature.description}
										</p>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</div>

			{/* CTA Section */}
			<div className="py-16 bg-gray-50 dark:bg-transparent">
				<hr className="border-t border-gray-700/30 w-full max-w-4xl mx-auto mb-16 hidden dark:block" />
				<motion.div
					className="container mx-auto px-4 text-center"
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					viewport={{ once: true }}
				>
					<h2 className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-200 font-normal mb-4">Ready to Get Started?</h2>
					<p className="text-gray-600 mb-8 max-w-2xl mx-auto dark:text-gray-300">
						Join VoterAI today and get instant access to Georgia voter registration information and assistance.
					</p>
					<Button asChild size="lg" className="bg-[#F74040] hover:bg-[#F74040]/90 text-white">
						<motion.div whileHover={hoverScale}>
							<Link href="/register">Create Free Account</Link>
						</motion.div>
					</Button>
				</motion.div>
			</div>
		</div>
	)
}

