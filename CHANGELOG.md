# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of loopmessage-sdk
- Complete TypeScript SDK for LoopMessage API
- Support for sending iMessages and SMS
- Message status tracking and polling
- Webhook handling and verification
- Event-driven architecture with EventEmitter
- Comprehensive error handling with retry logic
- Tree-shakeable ES modules
- Full TypeScript types and documentation

### Features
- **LoopSdk**: Unified SDK interface for all functionality
- **LoopMessageService**: Send messages, reactions, replies, and effects
- **MessageStatusChecker**: Track message delivery status
- **WebhookHandler**: Process incoming webhooks securely
- **LoopMessageConversationService**: Conversation management and tracking
- **Middleware**: Express.js webhook middleware helpers
- **Error Handling**: Custom LoopMessageError with retry support
- **Validation**: Comprehensive parameter validation
- **Tree Shaking**: Optimized for modern bundlers (21KB gzipped)

### Technical
- ES2022 target for modern performance
- Pure ES modules with proper exports
- No side effects for optimal tree shaking
- Comprehensive test suite (58 tests)
- Automated CI/CD with GitHub Actions
- Professional documentation with examples