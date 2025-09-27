module.exports = async () => {
  // Global cleanup
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};