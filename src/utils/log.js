const EXT_LOG_NAME = '[NightLightSlider]'; //TODO

export const debug = (msg) => {
  console.log(`${EXT_LOG_NAME} ${msg}`);
};

export const error = (msg, error) => {
  console.log(`${EXT_LOG_NAME} ${msg}:\n${error}`);
};
