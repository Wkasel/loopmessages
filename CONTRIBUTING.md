# Contributing to Loop Messages SDK

We love your input! We want to make contributing to Loop Messages SDK as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/loop-messages.git
cd loop-messages

# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Build the project
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

## Project Structure

```
loop-messages/
├── src/                 # Source code
│   ├── services/       # Core service classes
│   ├── utils/          # Utility functions
│   ├── errors/         # Error classes
│   └── index.ts        # Main exports
├── __tests__/          # Test files
├── examples/           # Usage examples
│   ├── sdk-usage/     # SDK examples
│   └── server-apps/   # Full applications
├── dist/              # Compiled output
└── docs/              # Documentation
```

## Code Style Guide

### TypeScript

- Use TypeScript for all new code
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for public methods
- Document all public APIs with JSDoc

```typescript
/**
 * Sends a message to the specified recipient
 * @param params - Message parameters
 * @returns Promise resolving to the send response
 * @throws {LoopMessageError} When the API request fails
 */
public async sendMessage(params: SendMessageParams): Promise<LoopMessageSendResponse> {
  // Implementation
}
```

### Naming Conventions

- Use PascalCase for classes and interfaces
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants
- Prefix interfaces with 'I' only when necessary to avoid naming conflicts

### Error Handling

- Always use the custom `LoopMessageError` class for API errors
- Include error codes and descriptive messages
- Preserve the original error as the `cause` when wrapping errors

```typescript
throw new LoopMessageError(
  'Failed to send message',
  500,
  originalError.message
);
```

## Testing

### Writing Tests

- Write tests for all new features
- Follow the existing test structure
- Use descriptive test names
- Mock external dependencies

```typescript
describe('LoopMessageService', () => {
  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Test implementation
    });

    it('should handle API errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Making Changes

### Adding a New Feature

1. Create a new branch: `git checkout -b feature/my-new-feature`
2. Add your feature with tests
3. Update the README if needed
4. Add an example if applicable
5. Submit a pull request

### Fixing a Bug

1. Create a new branch: `git checkout -b fix/issue-description`
2. Add a test that reproduces the bug
3. Fix the bug
4. Ensure all tests pass
5. Submit a pull request

### Improving Documentation

1. Create a new branch: `git checkout -b docs/improvement-description`
2. Make your improvements
3. Check for spelling and grammar
4. Submit a pull request

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the examples if you've changed the API
3. The PR will be merged once you have the sign-off of at least one maintainer

### PR Title Format

Use conventional commit format for PR titles:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Examples:
- `feat: add support for message scheduling`
- `fix: handle rate limit errors properly`
- `docs: improve webhook setup instructions`

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(webhooks): add signature verification

Add automatic signature verification for incoming webhooks
to ensure message authenticity and prevent replay attacks.

Closes #123
```

## Issues and Feature Requests

### Reporting Bugs

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening)

### Requesting Features

- Check if the feature has already been requested
- Clearly describe the feature and its use case
- Provide examples of how it would be used
- Be open to discussion about implementation

## Community

- Be respectful and considerate
- Help others when you can
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

## Questions?

Feel free to contact the maintainers if you have any questions. We're here to help!

Thank you for contributing to Loop Messages SDK! 🎉