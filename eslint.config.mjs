export default [
  {
    ignores: ["node_modules/**", ".next/**", "next-env.d.ts", "**/*.ts", "**/*.tsx"]
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off"
    }
  }
];
