![Voter AI Chatbot)(./public/images/original-logo.svg)
<p align="center">
  An Open-Source Voter AI Chat Template Built With Next.js and the AI SDK by Vercel.

[//]: # (</p>)

[//]: # ()
[//]: # (<p align="center">)

[//]: # (  <a href="#features"><strong>Features</strong></a> ·)

[//]: # (  <a href="#model-providers"><strong>Model Providers</strong></a> ·)

[//]: # (  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·)

[//]: # (  <a href="#running-locally"><strong>Running locally</strong></a>)

[//]: # (</p>)

[//]: # (<br/>)

[//]: # (## Features)

[//]: # (- [Next.js]&#40;https://nextjs.org&#41; App Router)

[//]: # (  - Advanced routing for seamless navigation and performance)

[//]: # (  - React Server Components &#40;RSCs&#41; and Server Actions for server-side rendering and increased performance)

[//]: # (- [AI SDK]&#40;https://sdk.vercel.ai/docs&#41;)

[//]: # (  - Unified API for generating text, structured objects, and tool calls with LLMs)

[//]: # (  - Hooks for building dynamic chat and generative user interfaces)

[//]: # (  - Supports OpenAI &#40;default&#41;, Anthropic, Cohere, and other model providers)

[//]: # (- [shadcn/ui]&#40;https://ui.shadcn.com&#41;)

[//]: # (  - Styling with [Tailwind CSS]&#40;https://tailwindcss.com&#41;)

[//]: # (  - Component primitives from [Radix UI]&#40;https://radix-ui.com&#41; for accessibility and flexibility)

[//]: # (- Data Persistence)

[//]: # (  - [Vercel Postgres powered by Neon]&#40;https://vercel.com/storage/postgres&#41; for saving chat history and user data)

[//]: # (  - [Vercel Blob]&#40;https://vercel.com/storage/blob&#41; for efficient file storage)

[//]: # (- [NextAuth.js]&#40;https://github.com/nextauthjs/next-auth&#41;)

[//]: # (  - Simple and secure authentication)

[//]: # (## Model Providers)

[//]: # ()
[//]: # (This template ships with OpenAI `gpt-4o` as the default. However, with the [AI SDK]&#40;https://sdk.vercel.ai/docs&#41;, you can switch LLM providers to [OpenAI]&#40;https://openai.com&#41;, [Anthropic]&#40;https://anthropic.com&#41;, [Cohere]&#40;https://cohere.com/&#41;, and [many more]&#40;https://sdk.vercel.ai/providers/ai-sdk-providers&#41; with just a few lines of code.)

[//]: # ()
[//]: # ()
[//]: # (## Deploy Your Own)

[//]: # ()
[//]: # (You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:)

[//]: # ()
[//]: # ()
[//]: # ([![Deploy with Vercel]&#40;https://vercel.com/button&#41;]&#40;https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}]&#41;)


## Running locally


You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.


> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.


1. Install Vercel CLI: `npm i -g vercel`

2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`

3. Download your environment variables: `vercel env pull`


```bash

pnpm install

pnpm dev

```

Your app template should now be running on [localhost:3000](http://localhost:3000/).
