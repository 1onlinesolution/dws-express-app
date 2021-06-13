module.exports = (isProduction, consoleOptions, fileOptions, mongoOptions) => {
  return {
    level: 'error',
    preferGlobalOptions: true,
    useConsole: !isProduction,
    useFile: true,
    useMongoDB: false,
    consoleOptions: consoleOptions,
    fileOptions: fileOptions,
    mongoOptions: mongoOptions,
  };
};