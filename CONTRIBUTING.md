# Contributing to ChatVRM

Thank you for your interest in contributing to ChatVRM! This guide will help you get started with development and explain our contribution process.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 16.14.2 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **API Keys**: 
  - OpenAI API key (for ChatGPT integration)
  - Koeiromap API key (for voice synthesis)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ChatVRMPlatform.git
   cd ChatVRMPlatform
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```bash
   OPEN_AI_KEY=your-openai-api-key
   KOEIROMAP_API_KEY=your-koeiromap-api-key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to see the application.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint to check code style |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |

## 📁 Project Structure

See [Project Structure Documentation](./docs/developer/project-structure.md) for detailed information about the codebase organization.

Key directories:
- `/src/components/` - React UI components
- `/src/features/` - Business logic organized by feature
- `/src/pages/` - Next.js pages and API routes
- `/docs/` - Project documentation

## 🔧 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes

### 2. Make Your Changes

Follow these guidelines:
- Write clean, readable code
- Follow existing code patterns and styles
- Add comments for complex logic
- Update tests if applicable
- Update documentation if needed

### 3. Code Style

We use ESLint and Prettier for code formatting. Before committing:

```bash
npm run lint        # Check for linting errors
npm run format      # Auto-format code
npm run typecheck   # Check TypeScript types
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
# Good examples
git commit -m "feat: add emotion-based voice tone selection"
git commit -m "fix: resolve streaming disconnection on timeout"
git commit -m "docs: update API endpoint documentation"

# Bad examples
git commit -m "fixed stuff"
git commit -m "update"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build process or auxiliary tool changes

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Description of what was changed and why
- Reference to any related issues
- Screenshots/videos for UI changes

## 📋 Pull Request Guidelines

### PR Title Format
```
type: brief description

Examples:
feat: add dark mode support
fix: correct emotion tag parsing in streaming responses
docs: add VRM viewer component documentation
```

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Local development testing
- [ ] Browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged
```

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test:

1. **Core Functionality**
   - [ ] Chat conversation works
   - [ ] Voice synthesis plays correctly
   - [ ] Character expressions change appropriately
   - [ ] VRM model loads and animates

2. **Error Handling**
   - [ ] Missing API keys show appropriate errors
   - [ ] Network failures are handled gracefully
   - [ ] Invalid inputs are validated

3. **Browser Compatibility**
   - [ ] Chrome/Edge (required for speech recognition)
   - [ ] Firefox
   - [ ] Safari

4. **Performance**
   - [ ] No memory leaks during extended use
   - [ ] Smooth animations (60 fps)
   - [ ] Reasonable load times

### Adding Tests

While the project currently uses manual testing, we welcome test contributions:
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components

## 🏗️ Architecture Guidelines

### Component Structure

```typescript
// components/MyComponent.tsx
import { useState, useCallback } from 'react';

interface MyComponentProps {
  title: string;
  onAction: (value: string) => void;
}

export const MyComponent = ({ title, onAction }: MyComponentProps) => {
  // Component logic
};
```

### State Management

- Use local state for component-specific data
- Use Context API for truly global state (like viewer instance)
- See [State Management Guide](./docs/developer/state-management.md)

### API Integration

- API routes go in `/src/pages/api/`
- Keep external API calls in feature modules
- Handle errors appropriately

## 🌐 Internationalization

Currently, the project supports Japanese. When adding text:
- Consider i18n implications
- Use consistent terminology
- Document any new Japanese terms

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex algorithms
- Include usage examples

```typescript
/**
 * Parses emotion tags from text and creates screenplay
 * @param texts - Array of text with emotion tags
 * @param koeiroParam - Voice synthesis parameters
 * @returns Array of screenplay objects with emotions
 * @example
 * textsToScreenplay(["[{happy}]Hello!"], params)
 */
export const textsToScreenplay = (
  texts: string[],
  koeiroParam: KoeiroParam
): Screenplay[] => {
  // Implementation
};
```

### Project Documentation

Update relevant docs in `/docs/` when:
- Adding new features
- Changing architecture
- Modifying APIs

## 🐛 Reporting Issues

### Before Creating an Issue

1. Check existing issues
2. Try latest version
3. Verify your environment setup

### Issue Template

```markdown
**Describe the bug**
Clear description of the problem

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Node version: [e.g., 16.14.2]
```

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what is best for the community

### Getting Help

- Check documentation first
- Look through existing issues
- Ask in discussions
- Be patient and respectful

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes for significant contributions
- Special mentions for major features

Thank you for contributing to ChatVRM! Your efforts help make this project better for everyone.