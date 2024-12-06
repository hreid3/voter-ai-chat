import { motion } from 'framer-motion';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
			<div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
				<p className="flex flex-row justify-center gap-1 items-center">
					<img src="/images/original-logo.svg" className="w-[40ch]" alt="VoteAI logo"/>
				</p>
				<article className="">
					<p>{`
						I'm here to help you find voter registration information for Georgia quickly and easily. Just ask
						your questions, and I'll guide you with the data you need. This service is completely free and open to
						everyone—let's get started!`}
					</p>
				</article>
			</div>
		</motion.div>
	);
};
