// "use strict"

const isDev = require('electron-is-dev');

const DOMAIN = "https://playsmallworlds.com";
const API = "https://playsmallworlds.com";
const userAgent = 'SmallWorldsClient';
let mainWindow = null;

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  DOMAIN,
  getMainWindow,
  userAgent, API
}

const load = async () => {
  const { app, dialog } = require("electron");


  try {
   
    require('./tools/storage')();
    // require('./tools/rpc')();
    require('./tools/updater')();
    require('./tools/flash')();
    app.commandLine.appendSwitch('no-sandbox');
    await app.whenReady();
    require('./tools/userAgent')();

    mainWindow = require('./frames/main')();



    // require('./tools/smi')();

  } catch (ex) {
    const options = {
      type: "error",
      title: "Fatal Error occurred",
      message: String(ex),
    };

    console.error(ex)

    dialog.showMessageBox(null, options, (response, checkboxChecked) => {
      app.quit();
    });
  }
};

load();
