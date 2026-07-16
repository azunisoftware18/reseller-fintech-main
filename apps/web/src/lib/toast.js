let toastHandler = null;

export const toast = {
  success: (message) => toastHandler?.("success", message),
  error: (message) => toastHandler?.("error", message),
  info: (message) => toastHandler?.("info", message),
};

export const registerToastHandler = (handler) => {
  toastHandler = handler;
};
