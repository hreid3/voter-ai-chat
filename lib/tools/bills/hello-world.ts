import { tool } from 'ai';
import { z } from 'zod';

export const helloWorldTool = tool({
    description: "A simple tool that returns a hello world message with an optional name parameter.",
    parameters: z.object({
        name: z.string().optional().describe("Optional name to greet")
    }),
    execute: async ({ name }: { name?: string }) => {
        const greeting = name ? `Hello, ${name}!` : "Hello, World!";
        console.log("Horace.Tool was invoked")
        return {
            message: greeting,
            timestamp: new Date().toISOString()
        };
    }
}); 
