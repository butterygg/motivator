This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

A) Rename .env.example in .env

```
mv .env.example .env
```

B) Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


Separatation in two folders Protocols and Core

## Core 
This contain the Game Theory of Motivator, only focus on the elements that are necessary to the life of Motivator
- Handle of Motivator mechanics
- Audit, Leaderboard, Payment
- Points manager
- Assessor management
- Authentication
- Schema, DB, Data related to Motivator 

## Protocols
Contain the specific implementation for each protocol. 
- Acquisition of specifics data
- Display and components of this data
- Schema and DB for specific protocol
- Specific implementations for this protocol
