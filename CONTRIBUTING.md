# Contributing to Nexora AI Observability Dashboard

First off, thank you for considering contributing to Nexora AI! It is people like you who make open-source software a wonderful ecosystem to learn, build, and innovate.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to `mahdisoleimani2003@gmail.com`.

---

## How Can I Contribute?

### 1. Reporting Bugs
- Check the [existing issues](https://github.com/Mahdi-Soleimani/NexoraAILog/issues) to ensure the bug has not already been reported.
- Open a new issue using our **Bug Report** template.
- Provide a clear title, description, reproduction steps, expected vs. actual behavior, and environment details (Node version, OS, browser).

### 2. Suggesting Enhancements
- Check if your proposed feature or enhancement has already been requested.
- Open a new issue using our **Feature Request** template.
- Describe the motivation, use cases, and proposed API or UI changes.

### 3. Submitting Pull Requests
1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Make your changes**:
   - Adhere to the established TypeScript and React patterns.
   - Ensure the UI remains responsive, dark/light compatible, and RTL friendly.
   - Never commit sensitive keys, personal credentials, or unnecessary build files.
4. **Verify linting and build**:
   ```bash
   npm run lint
   npm run build
   ```
5. **Commit your changes**:
   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add export to JSON feature`
   - `fix: correct latency calculation for sub-second requests`
   - `docs: update deployment documentation`
   - `chore: update dependencies`
6. **Push and submit PR**:
   - Push to your fork and open a Pull Request against `main`.
   - Complete the PR template checklist.

---

## Development Guidelines

- **Formatting**: 2 spaces indentation, UTF-8 encoding.
- **Components**: Functional React components with TypeScript interfaces.
- **Styling**: Tailwind CSS utility classes with RTL consideration (`ms-`, `me-`, `text-right`, `dir="rtl"`).
