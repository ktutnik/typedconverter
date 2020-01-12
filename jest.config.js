module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage:true,
  collectCoverageFrom: ["src/*"],
  snapshotSerializers: [
    "<rootDir>script/function-snapshot-serializer.js",
    "<rootDir>script/date-snapshot-serializer.js"
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};