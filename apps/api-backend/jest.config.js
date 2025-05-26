module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/$1',
    '@domains/(.*)': '<rootDir>/domains/$1',
    '@infrastructure/(.*)': '<rootDir>/infrastructure/$1',
  },
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup-jest.ts'],
}
