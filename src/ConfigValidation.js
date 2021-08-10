module.exports = (config) => {
  const { inputBase, outputBase, base, seperator, keys } = config;
  if (!inputBase || !outputBase || !base || !seperator || !keys) return false;

  if (!Array.isArray(keys) || !keys.length) return false;

  return true;
};
