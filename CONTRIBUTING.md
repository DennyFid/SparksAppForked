# Contributing to SparksApp

Thank you for your interest in contributing to Sparks! We welcome contributions from the community to help make this project better.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub.
*   **Bugs**: Describe the issue in detail, including steps to reproduce, expected behavior, and screenshots if applicable.
*   **Features**: Explain the proposed feature and its use case.

### Submitting Pull Requests

1.  **Fork the Repository**: Click the "Fork" button on the top right of the repository page.
2.  **Clone your Fork**:
    ```bash
    git clone https://github.com/<your-username>/SparksApp.git
    cd SparksApp
    ```
3.  **Create a Branch**: Create a new branch for your feature or fix.
    ```bash
    git checkout -b feature/my-new-feature
    ```
4.  **Make Changes**: Implement your changes. Ensure your code follows the project's style and conventions.
5.  **Test**: Run the app locally to verify your changes work as expected.
    ```bash
    npm run lint
    npx expo start
    ```
6.  **Commit**: Commit your changes with a descriptive message.
    ```bash
    git commit -m "feat: add new spark for meditation"
    ```
7.  **Push**: Push your branch to your fork.
    ```bash
    git push origin feature/my-new-feature
    ```
8.  **Open a Pull Request**: Go to the original repository and open a Pull Request from your fork. Provide a clear description of your changes.

## Code Style

*   We use **TypeScript** for type safety.
*   We use **Prettier** for code formatting. Please run `npm run format` before committing.
*   We use **ESLint** for linting. Please run `npm run lint` to check for issues.

## Adding a New Spark

If you are adding a new Spark:
1.  Create a new directory in `src/sparks/` (e.g., `src/sparks/MyNewSpark/`).
2.  Implement your Spark component.
3.  Register your Spark in `src/components/SparkRegistry.tsx`.
4.  Add a definition in `src/types/spark.ts`.

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
