---
trigger: glob
globs: "**/services/line.ts,**/handlers/**"
---

# LINE Bot Development Guidelines

## Message Handling

- Respond to LINE within 30 seconds to avoid timeout
- Use fire-and-forget pattern for async processing
- Return 200 OK immediately from webhook
- Process events with `Promise.allSettled`

## Flex Messages

- Use modern UI components
- Include meaningful visual hierarchy
- Add appropriate badges and icons
- Test on mobile devices

## Error Recovery

- Log all message handling errors
- Don't crash on individual event failures
- Reply with user-friendly error messages
- Track failed events for debugging

## Best Practices

- Use reply tokens correctly (one-time use)
- Validate event types before processing
- Handle both text and image messages
- Implement proper user context management
