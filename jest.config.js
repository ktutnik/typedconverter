module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage:true,
  collectCoverageFrom: ["src/*"],
  snapshotSerializers: [
    "<rootDir>script/function-snapshot-serializer.js",
    "<rootDir>script/date-snapshot-serializer.js"
  ]
};