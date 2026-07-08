# Testing

## Commands

Run the full unit test suite:

```bash
npm run test
```

Run once without watch mode:

```bash
npm run test:run
```

Run type checks:

```bash
npm run typecheck
```

## What is tested

Current tests focus on pure logic and safety-critical helpers:

- backend scoring
- AI Zod schema validation
- safe AI output parsing
- usage-limit helper logic
- CV storage path building
- PDF validation
- safe error message mapping

## What is not tested yet

Not covered yet:

- real Supabase reads/writes
- real Storage upload/download flows
- real AI provider calls
- Server Action integration tests
- browser component interaction tests
- end-to-end UI flows

## Why unit tests stay offline

These tests do not call real external services on purpose.

Reasons:
- no Supabase project is required
- no AI API key is required
- no private CV data is needed
- tests stay fast and deterministic
- failures point to application logic, not network state

## Future plan

Next layers to add later:

1. server integration tests with mocked Supabase clients
2. smoke tests for a few important UI components
3. end-to-end tests for login, upload, and result flows once the product surface is more stable
