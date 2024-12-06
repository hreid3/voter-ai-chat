![Voter AI](./public/images/original-logo.svg)

## Overview

[VoterAI](http://voterai.chat) is a conversational web application designed to empower Georgia voters, election stakeholders, and campaign managers by providing timely, data-driven insights into voter registration and district information. The platform simulates a ChatGPT-like interface, enabling users to pose natural language queries, which are then transformed into SQL through a Retrieval Augmented Generation (RAG) pipeline. This approach allows VoterAI to present precise results drawn from a locally maintained database of voter registration records originally sourced from the Georgia Secretary of State. 


### Key Features

- **Conversational Interface:**  
  Interact with the system as if chatting with an assistant. Ask questions in plain English, and the platform handles the rest, making data exploration more approachable and intuitive.


- **RAG-Enabled NLP to SQL Conversion:**  
  Harness the power of a Retrieval Augmented Generation pipeline to convert user queries into optimized SQL statements. This ensures that the responses are grounded in actual data rather than relying solely on inferred knowledge.

[//]: # (- **Verified Georgia Voter Data:**  )

[//]: # (  Leverage data sourced directly from the Georgia Secretary of State. The records are periodically loaded into VoterAI’s own database, ensuring the platform remains current, accurate, and free from any dependency on direct external access.)

- **District & Representative Insights:**  
  Explore voter districts, learn about elected officials, and gain a clearer understanding of the political landscape. Identify patterns in voter distribution to better strategize engagement and outreach efforts.


- **Campaign Strategy & Outreach:**  
  Determine high-impact areas, identify demographic segments, and develop targeted strategies to enhance voter turnout. Campaign managers can analyze trends, measure performance, and refine outreach methods based on evidence rather than guesswork.


- **Visualizations & Data Presentation:**  
  Translate complex voter information into visually appealing charts and maps. All visualization queries are URL-encoded for stability, while QuickChart.io and the Google Maps Static API power rich graphical outputs, helping users see and understand patterns at a glance.


- **Privacy & Compliance:**  
  Uphold stringent data protection standards. No personally identifiable information (PII) is disclosed, and all voter data is handled responsibly, ensuring compliance with relevant laws and regulations.


### Getting Started

Visit [http://voterai.chat](http://voterai.chat) to begin exploring voter data, learning about districts, and developing data-backed strategies.


## Running VoterAI locally

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
