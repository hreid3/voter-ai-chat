import React, { useState, useEffect, useRef } from 'react'

interface RippleEffectProps {
	isAnimating?: boolean
	children?: React.ReactNode
}

const RippleEffect: React.FC<RippleEffectProps> = ({
																										 isAnimating = false,
																										 children
																									 }) => {
	const [isActive, setIsActive] = useState(isAnimating)
	const [initialized, setInitialized] = useState(false);
	const rippleRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const rippleElement = rippleRef.current
		if (!rippleElement) return

		if (isAnimating && !initialized) {
			rippleElement.style.animationPlayState = 'running'
			rippleElement.style.opacity = '1'
			setIsActive(true)
			setInitialized(true)
		} else if (!isAnimating && !initialized) {
			setInitialized(true)
		} else {
			rippleElement.style.animationPlayState = 'paused'
			rippleElement.style.opacity = '0'
			const timer = setTimeout(() => {
				setIsActive(false)
			}, 1000) // Match this with the transition duration
			return () => clearTimeout(timer)
		}
	}, [isAnimating])

	return (
		<div className="relative mx-auto my-[160px]" style={{width: 32, height: 32}}>
			<div
				ref={rippleRef}
				className={`absolute inset-0 rounded-full transition-opacity duration-1000 ease-in-out animate-ripple ${
					isActive ? 'opacity-100' : 'opacity-0'
				}`}
			/>
			<div className="absolute inset-0 flex items-center justify-center">
				{children}
			</div>
			<style dangerouslySetInnerHTML={{__html: `
        @keyframes ripple {
          0% {
            box-shadow: 0 0 0 0 rgba(247, 64, 64, 0.1),
                        0 0 0 3px rgba(247, 64, 64, 0.1),
                        0 0 0 6px rgba(247, 64, 64, 0.1),
                        0 0 0 12px rgba(247, 64, 64, 0.1);
          }
          100% {
            box-shadow: 0 0 0 3px rgba(247, 64, 64, 0.1),
                        0 0 0 6px rgba(247, 64, 64, 0.1),
                        0 0 0 12px rgba(247, 64, 64, 0.1),
                        0 0 0 14px rgba(247, 64, 64, 0);
          }
        }
        .animate-ripple {
          animation: ripple 0.6s linear infinite;
        }
      `}} />
		</div>
	)
}

export default RippleEffect

