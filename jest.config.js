const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|js)x?$': ['ts-jest', {
      isolatedModules: true,
      useESM: false,
      tsconfig: './tsconfig.json'
    }],
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  testMatch: [ "<rootDir>/tests/**/*.test.ts" ],
  // node_modules 内の ESM モジュールも変換対象にする
  transformIgnorePatterns: [
    'node_modules/(?!(reflect-metadata|@azure/|@aws-sdk/|jimp|@line/|tsyringe|@aws-sdk/client-s3|@aws-sdk/s3-request-presigner)/)',
  ],
  // モジュール解決のために必要
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};