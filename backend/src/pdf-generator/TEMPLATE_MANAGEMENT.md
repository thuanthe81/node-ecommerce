# Template Management System

This document describes the comprehensive template management system implemented for PDF generation in the order attachment system.

## Overview

The template management system provides validation, monitoring, backup, and recovery capabilities for PDF template files. It ensures template integrity, provides development-time hot-reloading, and maintains backup versions for recovery.

## Components

### 1. TemplateValidationService

Provides comprehensive validation of template files including:

- **Structure Validation**: Checks for required HTML elements and template sections
- **Syntax Validation**: Validates Handlebars template syntax and placeholder formatting
- **Placeholder Validation**: Ensures all essential placeholders are present
- **CSS Validation**: Validates CSS references and styling consistency
- **Compatibility Validation**: Checks for deprecated features and version compatibility

#### Usage

```typescript
const report = await templateValidation.validateTemplate('order-confirmation');
console.log(`Template is ${report.isValid ? 'valid' : 'invalid'}`);
console.log(`Errors: ${report.errors.length}, Warnings: ${report.warnings.length}`);
```

### 2. TemplateMonitoringService

Provides file system monitoring and hot-reloading for development:

- **File Watching**: Monitors template files for changes using chokidar
- **Hot Reloading**: Automatically invalidates cache when templates change
- **Change History**: Tracks template modifications with timestamps
- **Development Only**: Only active in development environment

#### Configuration

Set environment variables:
- `NODE_ENV=development` - Enables monitoring
- `TEMPLATE_MONITORING_ENABLED=true` - Explicitly enable/disable monitoring

### 3. TemplateBackupService

Provides backup and recovery capabilities:

- **Automatic Backups**: Creates backups before template modifications
- **Version Control**: Maintains multiple versions of each template
- **Integrity Checking**: Validates template file integrity
- **Recovery**: Restores templates from valid backups
- **Cleanup**: Removes old backups based on retention policy

#### Configuration

Set environment variables:
- `TEMPLATE_BACKUP_DIR` - Directory for storing backups (default: templates/../backups)
- `MAX_TEMPLATE_BACKUPS` - Maximum backups per template (default: 10)
- `MAX_BACKUP_AGE_DAYS` - Maximum backup age in days (default: 30)

#### Usage

```typescript
// Create backup
const backup = await templateBackup.createBackup('order-confirmation', 'Pre-update backup');

// Restore from backup
const result = await templateBackup.restoreFromBackup('order-confirmation', '20240102120000');

// Check integrity
const isIntact = await templateBackup.checkTemplateIntegrity('order-confirmation');
```

### 4. TemplateManagementService

Provides unified interface for all template management operations:

- **Health Checks**: Comprehensive template health assessment
- **Maintenance**: Automated maintenance operations
- **Emergency Recovery**: Automatic template recovery from failures
- **Statistics**: Management statistics and monitoring data

#### Usage

```typescript
// Perform health check
const healthChecks = await templateManagement.performHealthCheck();

// Emergency recovery
const recovery = await templateManagement.emergencyRecovery('order-confirmation');

// Get management statistics
const stats = await templateManagement.getManagementStats();
```

## Template File Structure

Templates are stored in `backend/src/pdf-generator/templates/`:

```
templates/
├── order-confirmation.html    # Order confirmation template
├── invoice.html              # Invoice template
└── pdf-styles.css           # Shared CSS styles
```

### Template Syntax

Templates use Handlebars syntax with the following features:

- **Variables**: `{{variableName}}`
- **Nested Objects**: `{{customer.name}}`
- **Conditionals**: `{{#if condition}}...{{/if}}`
- **Loops**: `{{#each items}}...{{/each}}`
- **Partials**: `{{> partialName}}`
- **Localization**: `{{orderConfirmationTitle}}`

### Required Template Sections

All templates must include:

- `pdf-container` - Main container
- `pdf-header` - Header section
- `pdf-content` - Main content area
- `pdf-footer` - Footer section

### Essential Placeholders

All templates must include these placeholders:

- `{{orderNumber}}` - Order number
- `{{customerInfo.name}}` - Customer name
- `{{customerInfo.email}}` - Customer email
- `{{items}}` - Order items
- `{{formattedTotal}}` - Total amount

## Backup System

### Backup Structure

Backups are organized by template name:

```
backups/
├── order-confirmation/
│   ├── order-confirmation_20240102120000.html
│   ├── order-confirmation_20240102120000.meta.json
│   └── ...
└── invoice/
    ├── invoice_20240102120000.html
    ├── invoice_20240102120000.meta.json
    └── ...
```

### Version Format

Versions use timestamp format: `YYYYMMDDHHMMSS`

### Metadata

Each backup includes metadata:

```json
{
  "templateName": "order-confirmation",
  "version": "20240102120000",
  "filePath": "/path/to/template.html",
  "backupPath": "/path/to/backup.html",
  "timestamp": "2024-01-02T12:00:00.000Z",
  "fileSize": 12345,
  "checksum": "abc123",
  "isValid": true,
  "description": "Pre-update backup"
}
```

## Monitoring and Alerts

### Health Checks

Regular health checks validate:

- Template file existence
- Template structure and syntax
- Backup availability
- Cache status

### Error Handling

The system provides:

- Graceful error handling
- Detailed error logging
- Fallback mechanisms
- Recovery procedures

### Performance Monitoring

Tracks:

- Validation times
- Cache hit rates
- Backup operations
- File system changes

## Best Practices

### Development

1. **Enable Monitoring**: Set `NODE_ENV=development` for hot-reloading
2. **Validate Changes**: Check validation reports after template modifications
3. **Test Both Languages**: Validate templates in both English and Vietnamese
4. **Use Semantic HTML**: Follow HTML5 semantic structure guidelines

### Production

1. **Create Backups**: Always backup before template updates
2. **Validate Before Deploy**: Run validation checks before deployment
3. **Monitor Health**: Regular health checks in production
4. **Maintain Backups**: Configure appropriate retention policies

### Template Editing

1. **Follow Syntax**: Use proper Handlebars syntax
2. **Include Required Elements**: Ensure all essential placeholders are present
3. **Test Rendering**: Validate template rendering with sample data
4. **Maintain Accessibility**: Include proper accessibility features

## Troubleshooting

### Common Issues

1. **Template Not Found**: Check file paths and permissions
2. **Validation Errors**: Review template structure and syntax
3. **Backup Failures**: Check disk space and directory permissions
4. **Monitoring Not Working**: Verify development environment settings

### Recovery Procedures

1. **Template Corruption**: Use `emergencyRecovery()` method
2. **Invalid Templates**: Restore from valid backup
3. **Missing Backups**: Create new backup from working template
4. **System Failures**: Check logs and run health checks

## API Reference

### TemplateValidationService

- `validateTemplate(templateName)` - Validate specific template
- `validateAllTemplates()` - Validate all templates
- `getValidationSummary()` - Get validation statistics

### TemplateMonitoringService

- `startMonitoring()` - Start file monitoring
- `stopMonitoring()` - Stop file monitoring
- `getMonitoringStats()` - Get monitoring statistics
- `getChangeHistory()` - Get change history

### TemplateBackupService

- `createBackup(templateName, description)` - Create backup
- `restoreFromBackup(templateName, version)` - Restore from backup
- `getTemplateVersions(templateName)` - Get available versions
- `checkTemplateIntegrity(templateName)` - Check integrity
- `repairTemplate(templateName)` - Repair corrupted template

### TemplateManagementService

- `performHealthCheck()` - Run health checks
- `getManagementStats()` - Get management statistics
- `performMaintenance()` - Run maintenance operations
- `emergencyRecovery(templateName)` - Emergency recovery
- `refreshAllTemplates()` - Refresh all templates