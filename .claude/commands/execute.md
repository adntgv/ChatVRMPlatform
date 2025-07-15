## Task Execution Protocol

### 1. Initial Task Analysis
- Read docs/tasks.md thoroughly and identify the next task
- Create a TodoWrite list immediately for task tracking
- Break down vague tasks into specific, actionable subtasks in tasks.md
- Use planning mode for complex tasks requiring architectural decisions

### 2. Architecture & Design Phase (REQUIRED for non-trivial tasks)
**Consult Gemini CLI early and often:**
```bash
# Architecture review for the task
gemini -p "@src/ @docs/tasks.md For the task [TASK_NAME], suggest the best architecture approach"

# Check for existing patterns
gemini -p "@src/ Are there existing patterns I should follow for [FEATURE]?"

# Performance implications
gemini -p "@src/ What are the performance implications of implementing [FEATURE]?"
```

### 3. TDD Implementation Flow
1. **Design interfaces and types first** (create TypeScript interfaces)
2. **For infrastructure code**: Create the core utility/service before writing components that use it
3. **Write comprehensive failing tests** covering:
   - Happy path scenarios
   - Edge cases and error conditions
   - Integration points
   - Performance benchmarks (for critical paths)
4. **Implement minimal code** to make tests pass
5. **Refactor** while keeping tests green
6. **Run full test suite** to ensure no regressions

**Infrastructure-First Pattern**: When implementing cross-cutting concerns (error handling, logging, auth), always:
- Build the core infrastructure component first
- Test it thoroughly in isolation
- Then integrate it into the application
- This prevents circular dependencies and ensures consistency

### 4. Implementation Priority
1. **Core business logic** (models, services, stores)
2. **State management** (if applicable)
3. **API/External service interfaces** (with mocks)
4. **UI components** (last, built on tested logic)

### 5. External Services Strategy
- Create interfaces with full TypeScript types
- Implement mock versions for testing
- Add "proper implementation" tasks to roadmap
- Document integration requirements

### 6. Progress Tracking
- Update TodoWrite status in real-time (mark as in_progress when starting)
- Update tasks.md after each subtask completion
- Commit meaningful progress (don't wait until everything is done)
- Add discovered subtasks immediately to tasks.md

### 7. Quality Checkpoints
After each major step:
```bash
npm test                    # All tests passing?
npm run lint               # No linting errors?
npm run build             # Builds successfully?
```

### 8. Documentation Updates
- Update relevant docs immediately after implementation
- Document architectural decisions in code comments
- Update CLAUDE.md if you discover new patterns/best practices

### 9. Performance Validation (for 3D/real-time features)
- Profile before and after implementation
- Check for unnecessary re-renders
- Monitor memory usage
- Test with production-like data volumes

### 10. Final Reflection & Continuous Improvement
At task completion:
1. **What worked well?**  
2. **What was challenging?**  
3. **What tools/patterns emerged?** 
4. **What follow-up tasks were discovered?**  

After answering to those questions think hard what kind of information can improve your workflow execute.md, CLAUDE.md or should go as a task to tasks.md
Then go and update those documents only if your findings bring value to those documents

### Gemini CLI Usage Examples for Common Scenarios

**Before starting implementation:**
```bash
gemini -p "@src/ @docs/ What's the current architecture and how would [NEW_FEATURE] best fit?"
```

**When stuck or need validation:**
```bash
gemini -p "@src/[relevant_files] Is this the right approach for [PROBLEM]? Suggest alternatives."
```

**For code review:**
```bash
gemini -p "@src/[new_files] Review this implementation for best practices and potential issues"
```

**For test coverage:**
```bash
gemini -p "@src/[feature] @__tests__/ What test cases am I missing for complete coverage?"
```

Remember: Gemini has massive context window - use it liberally for architecture decisions and code reviews!

### Additional Best Practices 
- **Always use Gemini CLI first** for understanding complex flows
- **Create comprehensive test helpers** early  
- **Mock dependencies incrementally** - start with minimal mocks and expand as needed
- **Track re-render performance** from the start using React Profiler
- **Document architectural decisions** in real-time, not after completion
- **Use git history exploration** (`git show`, `git log`) to understand previous implementations

### Search & Discovery Patterns for Complex Tasks
When implementing system-wide changes (like error handling):
1. **Use Task tool first** for comprehensive analysis: `Task("Search for error handling patterns", "Search for...")`
2. **Follow up with targeted Grep searches** for specific patterns
3. **Prioritize by impact**: API routes (high), stores (medium), UI components (low)
4. **Use TodoWrite extensively** - complex tasks need 6+ subtasks for proper tracking
5. **Test as you go** - don't wait until the end to run tests