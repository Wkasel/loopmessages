# Publishing to NPM

This document outlines the steps required to publish the Loop Message SDK to the npm registry.

## Prerequisites

Before publishing, ensure you have:

1. An npm account (create one at [npmjs.com](https://www.npmjs.com/signup))
2. Access permissions to publish to the npm registry
3. Node.js and npm installed on your machine

## Preparation Steps

### 1. Update Version

Update the version in `package.json` following semantic versioning:

- **Patch** release (1.0.x): Bug fixes and minor changes
- **Minor** release (1.x.0): New features (backward compatible)
- **Major** release (x.0.0): Breaking changes

You can use npm version commands:

```bash
# For patch update (e.g., 1.0.0 -> 1.0.1)
npm version patch

# For minor update (e.g., 1.0.0 -> 1.1.0)
npm version minor

# For major update (e.g., 1.0.0 -> 2.0.0)
npm version major
```

### 2. Ensure Tests Pass

Run the test suite to ensure all tests pass:

```bash
npm test
```

### 3. Check Linting

Ensure code follows style guidelines:

```bash
npm run lint
```

### 4. Generate Documentation (Optional)

If using TypeDoc or similar tools, generate documentation:

```bash
# If you have a doc generation script
npm run docs
```

### 5. Build the Package

Compile TypeScript to JavaScript:

```bash
npm run build
```

### 6. Check Package Contents

Review the files that will be included in the package:

```bash
npm pack
```

This creates a `.tgz` file in your project directory. Review its contents to ensure:

- No unnecessary files are included
- All required files are present
- No sensitive information is exposed

## Publishing

### 1. Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

### 2. Publish the Package

For initial publishing:

```bash
npm publish
```

For scoped packages or publishing with access controls:

```bash
# For public scoped packages
npm publish --access public

# For private scoped packages (requires npm paid plan)
npm publish --access restricted
```

### 3. Verify Publication

After publishing, check that your package is available on npm:

```bash
npm view loop-messages
```

Visit `https://www.npmjs.com/package/loop-messages` to verify the package page.

## After Publishing

1. Create a Git tag for the release:

```bash
git tag -a v$(node -p "require('./package.json').version") -m "Release v$(node -p "require('./package.json').version")"
git push origin v$(node -p "require('./package.json').version")
```

2. Create a GitHub release (if applicable) with release notes

3. Update your documentation or website to reflect the new version

## Publishing Beta Versions

For testing before official releases:

```bash
# Set version with beta tag in package.json
# e.g., "version": "1.0.0-beta.1"

# Publish with beta tag
npm publish --tag beta
```

Users can install beta versions with:

```bash
npm install loop-messages@beta
```

## Troubleshooting

- **Package name already taken**: Choose a different name or use a scope
- **Authentication issues**: Ensure you're logged in (`npm whoami`) and have publishing rights
- **Version conflicts**: You cannot publish the same version twice. Always increment the version before republishing
- **Files not included**: Check your `files` field in package.json or `.npmignore` file 