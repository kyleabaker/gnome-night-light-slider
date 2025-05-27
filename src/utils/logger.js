const PREFIX = '[GnomeNightLightSlider]';

export const logger = {
  log: (message) => {
    console.log(`${PREFIX} ${message}`);
  },

  debug: (message) => {
    console.debug(`${PREFIX} ${message}`);
  },

  info: (message) => {
    console.info(`${PREFIX} ${message}`);
  },

  warn: (message) => {
    console.warn(`${PREFIX} ${message}`);
  },

  error: (message, exception = null) => {
    console.error(`${PREFIX} ${message}:\n${exception}`);
  },
};
