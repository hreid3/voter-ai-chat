import { useEffect, useRef, type RefObject } from 'react';
import throttle from 'lodash.throttle';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

	useEffect(() => {
		const container = containerRef.current;
		const end = endRef.current;

		if (container && end) {
			const observerCallback = (mutationRecords: MutationRecord[]) => {
				// Function to check if any parent has the "DO-NOT-JUMP-DOWN" class
				const hasDoNotJumpDownParent = (node: Node): boolean => {
					let currentNode: HTMLElement | null = node as HTMLElement;

					while (currentNode) {
						if (currentNode.classList?.contains("DO-NOT-JUMP-DOWN")) {
							return true;
						}
						currentNode = currentNode.parentElement;
					}

					return false;
				};

				// Check each mutation record for affected nodes
				for (const record of mutationRecords) {
					// Check added nodes
					for (const node of record.addedNodes) {
						if (!hasDoNotJumpDownParent(node)) {
							end.scrollIntoView({ behavior: 'instant', block: 'end' });
							return; // Scroll only once
						}
					}

					// Check target element (if mutation affected attributes)
					if (
						record.target &&
						!hasDoNotJumpDownParent(record.target)
					) {
						end.scrollIntoView({ behavior: 'instant', block: 'end' });
						return; // Scroll only once
					}
				}
			};

			// Wrap observer callback with lodash throttle (5ms)
			const throttledCallback = throttle(observerCallback, 5);

			const observer = new MutationObserver(throttledCallback);

			observer.observe(container, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: true,
			});

			return () => {
				observer.disconnect();
				throttledCallback.cancel(); // Cleanup throttle
			};
		}
	}, []);
  return [containerRef, endRef];
}
