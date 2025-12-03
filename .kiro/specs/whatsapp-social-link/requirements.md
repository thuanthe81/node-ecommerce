# Requirements Document

## Introduction

This feature adds WhatsApp social media link support to the existing footer settings infrastructure, following the same pattern as the recently implemented Zalo link. The implementation will leverage the established pattern for social media links (Facebook, Twitter, TikTok, Zalo) and requires minimal changes across the database schema, backend API, and frontend components.

## Glossary

- **Footer Settings**: The system component that manages footer content including copyright text, contact information, and social media links
- **WhatsApp**: A popular messaging platform owned by Meta (Facebook) that allows users to send messages and make calls
- **Social Media Link**: A clickable URL in the footer that directs users to the business's social media profile
- **DTO (Data Transfer Object)**: A pattern used to transfer data between software application subsystems
- **Prisma**: The ORM (Object-Relational Mapping) tool used for database schema management and migrations

## Requirements

### Requirement 1

**User Story:** As a website administrator, I want to add a WhatsApp contact link to the footer settings, so that customers can easily reach out to the business via WhatsApp.

#### Acceptance Criteria

1. WHEN an administrator accesses the footer settings form THEN the system SHALL display a WhatsApp URL input field alongside other social media fields
2. WHEN an administrator provides a WhatsApp URL THEN the system SHALL validate it as a properly formatted URL
3. WHEN an administrator saves footer settings with a WhatsApp URL THEN the system SHALL persist the WhatsApp URL to the database
4. WHEN an administrator leaves the WhatsApp URL field empty THEN the system SHALL accept the null value without validation errors
5. WHEN an administrator provides an invalid URL format THEN the system SHALL reject the input and display a validation error message

### Requirement 2

**User Story:** As a website visitor, I want to see a WhatsApp link in the footer, so that I can quickly contact the business through WhatsApp.

#### Acceptance Criteria

1. WHEN a visitor views any page with a footer AND the WhatsApp URL is configured THEN the system SHALL display a clickable WhatsApp link with the WhatsApp icon
2. WHEN a visitor clicks the WhatsApp link THEN the system SHALL open the link in a new browser tab
3. WHEN a visitor views any page with a footer AND the WhatsApp URL is not configured THEN the system SHALL not display any WhatsApp link element
4. WHEN a visitor uses a screen reader THEN the system SHALL provide proper accessibility attributes for the WhatsApp link

### Requirement 3

**User Story:** As a system developer, I want the WhatsApp link implementation to follow the existing social media link pattern, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. WHEN the database schema is updated THEN the system SHALL add a whatsappUrl column following the same pattern as zaloUrl
2. WHEN the backend API processes footer settings THEN the system SHALL include whatsappUrl in the DTO validation and response
3. WHEN the frontend renders the footer THEN the system SHALL display the WhatsApp link in the socials section alongside Facebook, TikTok, and Zalo
4. WHEN the system caches footer settings THEN the system SHALL automatically include the whatsappUrl field in the cached data
