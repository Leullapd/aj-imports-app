module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Allow unused variables in development
    'no-unused-vars': 'warn',
    // Allow missing dependencies in useEffect
    'react-hooks/exhaustive-deps': 'warn',
    // Allow template string expressions
    'no-template-curly-in-string': 'warn'
  }
};
