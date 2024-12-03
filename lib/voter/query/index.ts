'use server'
import { openai } from "@ai-sdk/openai"
import 'dotenv/config';
import { z } from 'zod';
import { streamText, tool } from 'ai';
import { config } from "dotenv";
import path from "node:path";
import { readStreamToConsole } from "@/lib/utils";

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
