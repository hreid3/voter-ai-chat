'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BarChart2, ClipboardList, MapPin, UserCheck } from 'lucide-react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

import { register, type RegisterActionState } from '../actions';
import useGoogleAnalytics from "@/hooks/useGoogleAnalytics";
import TrackingLink from "@/components/ui/TrackingLink";

const fadeInUp = {
	initial: {opacity: 0, y: 20},
	animate: {opacity: 1, y: 0},
	transition: {duration: 0.5}
};

export default function RegisterPage() {
	const router = useRouter();
	const {trackEvent} = useGoogleAnalytics();

	const [email, setEmail] = useState('');
	const [isSuccessful, setIsSuccessful] = useState(false);

	const [state, formAction] = useActionState<RegisterActionState, FormData>(
		register,
		{
			status: 'idle',
		},
	);

	useEffect(() => {
		if (state.status === 'user_exists') {
			toast.error('Account already exists');
		} else if (state.status === 'failed') {
			toast.error('Failed to create account');
		} else if (state.status === 'invalid_data') {
			toast.error('Failed validating your submission!');
		} else if (state.status === 'success') {
			toast.success('Account created successfully');
			setIsSuccessful(true);
			router.refresh();
		}
		trackEvent("register", "response", state.status, 0)
	}, [state, router]);

	const handleSubmit = (formData: FormData) => {
		setEmail(formData.get('email') as string);
		trackEvent("register", "cta", "Sign Up", 0)
		formAction(formData);
	};

	return (
		<div className="flex min-h-screen flex-col bg-white dark:bg-gradient-to-b dark:from-gray-950 dark:to-gray-900">
			<motion.header
				className="container mx-auto px-4 py-6 flex justify-between items-center"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Link href="/">
					<Image
						src="/images/original-logo.svg"
						alt="VoterAI Logo"
						width={150}
						height={50}
						className="transition-transform hover:scale-105"
					/>
				</Link>
				<ThemeToggle />
			</motion.header>

			<main className="grow flex items-start justify-center px-4 py-12">
				<div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
					<motion.div
						className="w-full md:w-1/2"
						initial="initial"
						animate="animate"
						variants={fadeInUp}
					>
						<Card className="bg-white dark:bg-gray-800/50 shadow-lg">
							<CardHeader>
								<h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">Sign Up</h1>
								<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
									Create an account with your email and password
								</p>
							</CardHeader>
							<CardContent>
								<AuthForm action={handleSubmit} defaultEmail={email}>
									<SubmitButton isSuccessful={isSuccessful} className="bg-[#F74040] hover:bg-[#F74040]/90 text-white">Sign up</SubmitButton>
								</AuthForm>
							</CardContent>
							<CardFooter className="flex flex-col space-y-4">
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{'Already have an account? '}
									<TrackingLink
										category="register"
										action="clicked login link"
										href="/login"
										className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
									>
										Sign in
									</TrackingLink>
									{' instead.'}
								</p>
							</CardFooter>
						</Card>
					</motion.div>

					<motion.div
						className="w-full md:w-1/2 hidden md:block"
						initial="initial"
						animate="animate"
						variants={fadeInUp}
					>
						<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 mt-8">
							Join VoterAI and access accurate, privacy-protected voter registration information for Georgia, USA.
						</p>
						<ul className="space-y-6 md:space-y-8">
							<li className="flex flex-col sm:flex-row sm:items-start">
								<ClipboardList className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]" />
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Get answers to voter registration questions</span>
							</li>
							<li className="flex flex-col sm:flex-row sm:items-start">
								<MapPin className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]" />
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Access district and representative information</span>
							</li>
							<li className="flex flex-col sm:flex-row sm:items-start">
								<UserCheck className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]" />
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Receive guidance on Georgia voter registration process</span>
							</li>
							<li className="flex flex-col sm:flex-row sm:items-start">
								<BarChart2 className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]"/>
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Analyze campaign strengths and weaknesses</span>
							</li>
						</ul>
					</motion.div>
				</div>
			</main>
			<footer className="py-4 text-center text-sm text-gray-600 dark:text-gray-400">
				Developed by <TrackingLink
				category="register" action="developer-click"
				href="mailto:horace.reid@bluenetreflections.com" className="hover:underline">Horace Reid III</TrackingLink> @
				2024
			</footer>
		</div>
	);
	}

