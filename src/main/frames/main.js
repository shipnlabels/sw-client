const { DOMAIN, API, getMainWindow, userAgent } = require("../main");
module.exports = () => {
    const { BrowserWindow, ipcMain, app, shell } = require("electron");
    const path = require('path');
    const isDev = require("electron-is-dev");
    // Create the browser window.
    let mainWindow = new BrowserWindow({
        width: 1400,
        height: 850,
        minWidth: 1400,
        minHeight: 820,
        icon: path.join(__dirname, "../icon.png"),
        center: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "../preload/app.js"), // use a preload script
            plugins: true,
            worldSafeExecuteJavaScript: true,
            backgroundThrottling: false,
            // The page is served from :5173 but the SWF and all game assets come
            // from :8000 — a different origin. SmallVerse's own shell disables
            // webSecurity for exactly this reason.
            webSecurity: false,
            allowRunningInsecureContent: true
        },
        frame: false,
        show: true,
        autoHideMenuBar: true
    });

    mainWindow.webContents.on("did-fail-load", (event, errorCode) => {
        tryAgain();
    });

    mainWindow.once("close", () => {
        mainWindow = null;
        app.quit()
    })

    mainWindow.webContents.on('new-window', (event, url) => {
        switch (url) {
        }
        event.preventDefault()
    })
    

    const tryAgain = () => {
        mainWindow.loadURL(`${DOMAIN}`);
    }

    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
          }
    });
    if (process.env.NODE_ENV === 'development') {
        const rendererPort = process.argv[2];
        mainWindow.loadURL(`http://localhost:${rendererPort}`);
      }
      else
      {
        mainWindow.loadURL(`${DOMAIN}`);
      }

    mainWindow.webContents.userAgent = userAgent;
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[RENDERER CONSOLE]: ${message}`);
    });

    if (isDev) mainWindow.webContents.openDevTools();

    ipcMain.handle("app_minimize", (e) => mainWindow.minimize())

    ipcMain.handle("app_maximize", () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    })

    ipcMain.handle("app_close", () => {
        app.quit();
    });

    ipcMain.handle("app_smi", (e,SWSID) => {
        require('./smi')(mainWindow, SWSID);
    });
    ipcMain.handle("app_custom", (e, SWSID, url, width, height) => {
        require('./custom')(mainWindow, SWSID, url, width, height);
    });

    ipcMain.handle("set_rpc", (e, data) => {
        console.log("RPC initialized", data);
    });

    return mainWindow;
}