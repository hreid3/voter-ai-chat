'use server'
import {openai} from "@ai-sdk/openai"
import 'dotenv/config';
import {z} from 'zod';
import {streamText, tool} from 'ai';
import {config} from "dotenv";
import path from "node:path";
import {readStreamToConsole} from "@/lib/utils";
import {getVoterAiChatUiToolset} from "@/lib/voter/query/voter-ui-toolset";
import {voterAssistantSystemMessage} from "@/lib/voter/query/prompt-engineering";

config({
    path: ['.env.local', path.join(__dirname, '../../../.env.local')],
});

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("Missing OpenAI API key. Set it in the .env file.");
}
// const weatherToolSchema = z.object({
//     location: z.string().describe('The location of the request'),
//     // temperature: z.string().describe('The temperature of the weather in F '),
// }).describe("Retrieves the weather at said location.");

const fetchWeather = async ({location}: { location: string }) => {
    const obj = {location, temperature: 72 + Math.floor(Math.random() * 21) - 10};
    return obj
}
const weatherTool = tool({
    description: "Gets the weather by a location",
    parameters: z.object({
        location: z.string().describe('The location of the request')
    }),
    execute: fetchWeather
});

(async () => {
    const {textStream} = await streamText({
        model: openai('gpt-3.5-turbo'),
        maxSteps: 5,
        temperature: 0,
        messages: [
            voterAssistantSystemMessage,
            {role: 'user', content: 'How many non-voters are out there?'},
            // {role: 'user', content: 'Where there any voters that changed status in 2020?'},
        ],
        tools: {
            weather: weatherTool,
            ...getVoterAiChatUiToolset()
        }
    });
    await readStreamToConsole(textStream)
    process.exit(0);

    // const object= await generateObject({
    //     model: openai('gpt-4o', { structuredOutputs: true }),
    //     schema: z.object({
    //         recipe: z.string().describe("A title of a recipe")
    //     }),
    //     messages: [
    //         {role: 'system', content: 'You are a football player that cannot cook except for scrambled eggs'},
    //         {role: 'user', content: 'Write a vegetarian lasagna recipe for 4 people.'}
    //     ],
    // })
})();