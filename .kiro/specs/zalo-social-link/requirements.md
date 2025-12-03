# Requirements Document

## Introduction

This feature adds Zalo social media link support to the footer settings, allowing administrators to configure a Zalo URL that will be displayed alongside existing social media links (Facebook, Twitter, TikTok) in the website footer.

## Glossary

- **Footer Settings**: Database-stored configuration containing contact information and social media links displayed in the website footer
- **Zalo**: A Vietnamese messaging and social media platform
- **System**: The handmade e-commerce web application
- **Admin Interface**: The administrative dashboard where authorized users can manage footer settings

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to add a Zalo URL to the footer settings, so that customers can connect with us on Zalo.

#### Acceptance Criteria

1. WHEN an administrator accesses footer settings THEN the System SHALL display a field for entering a Zalo URL
2. WHEN an administrator enters a Zalo URL THEN the System SHALL validate the URL format
3. WHEN an administrator saves a valid Zalo URL THEN the System SHALL store it in the footer_settings table
4. WHEN an administrator leaves the Zalo URL field empty THEN the System SHALL accept the empty value and hide the Zalo link from the footer
5. WHEN an administrator enters an invalid URL format THEN the System SHALL reject the input and display a validation error

### Requirement 2

**User Story:** As a website visitor, I want to see a Zalo link in the footer, so that I can connect with the company on Zalo.

#### Acceptance Criteria

1. WHEN a visitor views any page with a configured Zalo URL THEN the System SHALL display a clickable Zalo icon in the footer socials section
2. WHEN a visitor clicks the Zalo icon THEN the System SHALL open the Zalo URL in a new tab
3. WHEN no Zalo URL is configured THEN the System SHALL hide the Zalo link from the footer
4. WHEN the Zalo link is displayed THEN the System SHALL include proper accessibility attributes for screen readers

### Requirement 3

**User Story:** As a developer, I want the Zalo link to follow existing patterns, so that the implementation is consistent and maintainable.

#### Acceptance Criteria

1. WHEN implementing the Zalo field THEN the System SHALL follow the same pattern as existing social media fields (facebookUrl, twitterUrl, tiktokUrl)
2. WHEN rendering the Zalo link THEN the System SHALL use the same styling and structure as other social media links
3. WHEN validating the Zalo URL THEN the System SHALL use the same validation logic as other social media URLs
