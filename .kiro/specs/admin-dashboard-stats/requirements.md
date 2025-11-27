# Requirements Document

## Introduction

The admin dashboard currently displays hardcoded values for key business metrics (revenue, orders, products, and customers). This feature will integrate the dashboard with the existing backend analytics service to display real-time data from the database, providing administrators with accurate insights into their business performance.

## Glossary

- **Admin Dashboard**: The main administrative interface displaying key business metrics and quick actions
- **Dashboard Stats**: The four key metrics displayed on the dashboard: total revenue, order count, product count, and customer count
- **Analytics Service**: The backend service that aggregates and provides business metrics from the database
- **Real-time Data**: Current data fetched from the database reflecting the actual state of the system

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to see the actual total revenue on the dashboard, so that I can monitor business performance accurately.

#### Acceptance Criteria

1. WHEN the admin dashboard loads, THE system SHALL fetch the total revenue from paid orders via the backend analytics service
2. WHEN the revenue data is loading, THE system SHALL display a loading indicator in place of the hardcoded value
3. WHEN the revenue data is successfully fetched, THE system SHALL display the formatted revenue amount with currency symbol
4. IF the revenue fetch fails, THEN THE system SHALL display an error state with a retry option
5. THE system SHALL format revenue values according to locale conventions (e.g., "$1,234.56" for English, "1.234,56 ₫" for Vietnamese)

### Requirement 2

**User Story:** As an administrator, I want to see the actual number of orders on the dashboard, so that I can track order volume.

#### Acceptance Criteria

1. WHEN the admin dashboard loads, THE system SHALL fetch the total count of orders from the backend
2. WHEN the order count data is loading, THE system SHALL display a loading indicator
3. WHEN the order count is successfully fetched, THE system SHALL display the numeric count
4. IF the order count fetch fails, THEN THE system SHALL display an error state with a retry option

### Requirement 3

**User Story:** As an administrator, I want to see the actual number of products on the dashboard, so that I can monitor inventory size.

#### Acceptance Criteria

1. WHEN the admin dashboard loads, THE system SHALL fetch the total count of products from the backend
2. WHEN the product count data is loading, THE system SHALL display a loading indicator
3. WHEN the product count is successfully fetched, THE system SHALL display the numeric count
4. IF the product count fetch fails, THEN THE system SHALL display an error state with a retry option

### Requirement 4

**User Story:** As an administrator, I want to see the actual number of customers on the dashboard, so that I can track user base growth.

#### Acceptance Criteria

1. WHEN the admin dashboard loads, THE system SHALL fetch the total count of registered customers from the backend
2. WHEN the customer count data is loading, THE system SHALL display a loading indicator
3. WHEN the customer count is successfully fetched, THE system SHALL display the numeric count
4. IF the customer count fetch fails, THEN THE system SHALL display an error state with a retry option

### Requirement 5

**User Story:** As an administrator, I want the dashboard to handle data fetching errors gracefully, so that I can understand when data is unavailable and take appropriate action.

#### Acceptance Criteria

1. IF any dashboard stat API call fails, THEN THE system SHALL display an error message for that specific stat
2. WHEN an error occurs, THE system SHALL provide a retry button for the failed stat
3. WHEN the retry button is clicked, THE system SHALL re-attempt to fetch the failed stat data
4. THE system SHALL continue to display successfully fetched stats even when other stats fail
5. THE system SHALL log errors to the console for debugging purposes

### Requirement 6

**User Story:** As an administrator, I want the dashboard stats to refresh automatically, so that I always see current data without manual intervention.

#### Acceptance Criteria

1. WHEN the admin dashboard is visible, THE system SHALL refresh dashboard stats every 5 minutes
2. WHEN the user navigates away from the dashboard, THE system SHALL stop automatic refresh
3. WHEN the user returns to the dashboard, THE system SHALL resume automatic refresh
4. THE system SHALL not interrupt the user experience during background refresh
