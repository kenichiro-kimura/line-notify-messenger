
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
      'jest'
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        "linebreak-style": [
            0,
            "unix"
        ]        
    },
    "env": {
        "jest/globals": true
    }
};