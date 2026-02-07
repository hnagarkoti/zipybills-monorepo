# Template Feature

This is a template for creating new features in the monorepo.

## Usage

Run the following command from the monorepo root:

```bash
pnpm generate-feature
```

Follow the prompts to:
1. Enter the feature name (e.g., `my-awesome-feature`)
2. Select the category (e.g., `frontend-shared`, `backend-shared`, or custom)
3. The generator will create a new feature based on this template

## Structure

```
template-feature/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts
    ├── types.ts
    ├── utils.ts
    └── utils.test.ts
```

## Next Steps

After generating your feature:
1. Update `package.json` with your feature details
2. Implement your feature logic in `src/`
3. Add tests
4. Update the exports in `src/index.ts`
5. Build and test your feature
