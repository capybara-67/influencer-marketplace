# Project Structure

```text
influencer-marketplace-mvp/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── auth.tsx
│   ├── offers.tsx
│   ├── offers/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── applications.tsx
│   ├── profile.tsx
│   └── menu.tsx
├── components/
│   ├── Screen.tsx
│   └── ui.tsx
├── hooks/
│   └── useAuth.ts
├── lib/
│   ├── api.ts
│   ├── supabase.ts
│   └── types.ts
├── supabase/
│   ├── schema.sql
│   └── queries.sql
├── docs/
│   └── project-structure.md
├── .env.example
├── app.config.js
├── babel.config.js
├── package.json
├── tsconfig.json
└── README.md
```
