const { app } = require('electron');
const log = require('electron-log');
const path = require('path');
const flash = {
    win32: 'pepflashplayer.dll',
    darwin: 'PepperFlashPlayer.plugin',
    linux: 'libpepflashplayer.so',
  };
module.exports = function () { 
    if (app.isPackaged) {
        // asar plugins is two directories up
        // app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, '..',  'app.asar.unpacked', 'plugins', flash[process.platform]));
      //   '/app.asar.unpacked/plugins/' + flash[process.platform]
      // the file is located up one level of the resorces directory
      app.commandLine.appendSwitch('ppapi-flash-path', path.join(process.resourcesPath, '..', 'plugins', flash[process.platform]));
      // what is the app.asar.unpacked path of above?
      
      } else {
        app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, '../../../', 'plugins', flash[process.platform]));
        // what is the app.asar.unpacked path of above?
      
      }
      app.commandLine.appendSwitch('ignore-certificate-errors');
      console.log('Flash plugin loaded from: ' + path.join(__dirname, '../../../', 'plugins', flash[process.platform]));
    
};
