/**
 * ESLint rule to prevent inline SVG elements in React components
 * Encourages use of centralized SVG components from @/components/Svgs
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent inline SVG elements in React components',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowedFiles: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noInlineSvg: 'Inline SVG elements are not allowed. Use centralized SVG components from @/components/Svgs instead.',
      suggestCentralized: 'Consider creating a reusable SVG component in components/Svgs.tsx and importing it here.'
    }
  },

  create(context) {
    const options = context.getOptions()[0] || {};
    const allowedFiles = options.allowedFiles || ['components/Svgs.tsx'];
    const filename = context.getFilename();

    // Check if current file is in allowed files list
    const isAllowedFile = allowedFiles.some(allowedFile =>
      filename.includes(allowedFile)
    );

    if (isAllowedFile) {
      return {}; // Skip checking for allowed files
    }

    return {
      JSXElement(node) {
        if (node.openingElement.name.name === 'svg') {
          context.report({
            node,
            messageId: 'noInlineSvg',
            suggest: [
              {
                messageId: 'suggestCentralized',
                fix: null // No auto-fix available, requires manual intervention
              }
            ]
          });
        }
      }
    };
  }
};