# Footer Settings Admin Page

## Overview

This page allows administrators to manage the website footer content including copyright text, contact information, and social media links.

## Features

### Form Fields

1. **Copyright Text** (Required)
   - Main copyright notice displayed in the footer
   - Example: "© 2024 ALA Craft. All rights reserved."

2. **Contact Email** (Optional)
   - Email address for customer contact
   - Displayed as a clickable mailto link

3. **Contact Phone** (Optional)
   - Phone number for customer contact
   - Displayed as a clickable tel link

4. **Social Media Links** (Optional)
   - Facebook URL
   - Twitter URL
   - TikTok URL
   - All URLs are validated for proper format

### Live Preview

The page includes a live preview panel that shows exactly how the footer will appear on the website. The preview updates in real-time as the admin edits the form fields.

### Validation

- **Copyright text** is required
- **Social media URLs** must be valid URL format (e.g., https://facebook.com/alacraft)
- Empty optional fields are allowed and will not be displayed in the footer

### Error Handling

- Displays validation errors inline with the form fields
- Shows success message after successful save
- Handles API errors gracefully with user-friendly messages

## Requirements Satisfied

- **Requirement 4.1**: Admin can access and view current footer settings
- **Requirement 4.2**: URL validation for social media links
- **Requirement 4.3**: Admin can save changes and see updates across all pages

## Usage

1. Navigate to `/admin/footer-settings`
2. Edit the footer content in the form
3. View the live preview on the right side
4. Click "Save Changes" to update the footer
5. The footer will be updated across all pages of the website

## Technical Details

- Uses the `footerSettingsApi` client for API communication
- Implements client-side URL validation using the URL constructor
- Provides real-time preview using the `Footer` component
- Requires admin authentication (handled by `AdminProtectedRoute`)
