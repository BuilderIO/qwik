const { Rule } = require('eslint');

const isBrowserAPI = (variable, context) => {
  const browserAPIs = new Set([
    'window', 'document', 'navigator', 'location', 'history', 'localStorage',
    'sessionStorage', 'alert', 'fetch', // ... other known browser APIs
  ]);

  return context.getScope().through.some(scopeVar => 
    scopeVar.identifier.name === variable && browserAPIs.has(variable)
  );
};

const noSyncClosure = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure sync$ does not close over non-browser API variables.',
      recommended: false, // Set to true if this rule should be enabled by default
    },
    messages: {
      nonBrowserVariableClosure: 'sync$ is closing over non-browser API variable "{{name}}".',
    },
  },
  create(context) {
    return {
      'CallExpression[callee.name="sync$"]'(node) {
        const functionNode = node.arguments[0]; // Assuming the function is the first argument

        if (functionNode && (functionNode.type === 'FunctionExpression' || functionNode.type === 'ArrowFunctionExpression')) {
          const variablesInFunctionScope = context.getDeclaredVariables(functionNode);

          variablesInFunctionScope.forEach(variable => {
            if (!isBrowserAPI(variable.name, context)) {
              context.report({
                node: variable.identifiers[0],
                messageId: 'nonBrowserVariableClosure',
                data: { name: variable.name },
              });
            }
          });
        }
      },
    };
  },
};

module.exports = noSyncClosure;
