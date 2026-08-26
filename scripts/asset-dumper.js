const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Initialize Flash just like the main app does
require('../src/main/tools/flash')();
app.commandLine.appendSwitch('no-sandbox');

let mainWindow;

app.whenReady().then(() => {
    // Optionally load custom user agent
    try {
        require('../src/main/tools/userAgent')();
    } catch (e) {
        console.warn('Could not load user agent tool', e.message);
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            plugins: true,
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const dumpDir = path.join(process.cwd(), 'asset_dump');
    if (!fs.existsSync(dumpDir)) {
        fs.mkdirSync(dumpDir, { recursive: true });
    }

    try {
        mainWindow.webContents.debugger.attach('1.3');
    } catch (err) {
        console.error('Debugger attach failed:', err);
    }

    mainWindow.webContents.debugger.on('detach', (event, reason) => {
        console.log('Debugger detached due to:', reason);
    });

    mainWindow.webContents.debugger.sendCommand('Network.enable');

    mainWindow.webContents.debugger.on('message', (event, method, params) => {
        if (method === 'Network.responseReceived') {
            const response = params.response;
            if (!response || !response.url || response.url.startsWith('data:')) return;
            
            // Only fetch response body for successful responses
            if (response.status < 200 || response.status >= 400) return;

            mainWindow.webContents.debugger.sendCommand('Network.getResponseBody', { requestId: params.requestId })
                .then(res => {
                    let reqUrl;
                    try {
                        reqUrl = new URL(response.url);
                    } catch (e) {
                        return; // invalid url
                    }
                    
                    let urlPath = reqUrl.pathname;
                    if (urlPath === '/' || urlPath === '') {
                        urlPath = '/index.html';
                    }
                    
                    // Decode URL components to valid file paths
                    urlPath = decodeURIComponent(urlPath);
                    
                    // Construct local file path based on domain to avoid collisions
                    const localPath = path.join(dumpDir, reqUrl.hostname, urlPath);
                    const localDir = path.dirname(localPath);
                    
                    if (!fs.existsSync(localDir)) {
                        fs.mkdirSync(localDir, { recursive: true });
                    }
                    
                    let data = res.body;
                    if (res.base64Encoded) {
                        data = Buffer.from(res.body, 'base64');
                    } else {
                        data = Buffer.from(res.body, 'utf8');
                    }
                    
                    fs.writeFile(localPath, data, (err) => {
                        if (err) {
                            console.error('Failed to save:', localPath, err.message);
                        } else {
                            console.log('Saved:', localPath);
                        }
                    });
                })
                .catch(err => {
                    // Ignore errors (no response body for preflight/redirects/cached)
                });
        }
    });

    // Provide a simple UI to enter the URL
    const htmlPath = path.join(__dirname, 'dumper-ui.html');
    fs.writeFileSync(htmlPath, `
        <!DOCTYPE html>
        <html>
        <head><title>Asset Dumper</title></head>
        <body style="font-family: sans-serif; background: #222; color: #ddd; padding: 20px;">
            <h2>SmallWorlds Asset Dumper</h2>
            <p>Enter the URL of the game (e.g., http://localhost:5173 or a live remake URL) to start dumping assets:</p>
            <input type="text" id="url" value="http://localhost:5173" style="width: 80%; padding: 10px; font-size: 16px;">
            <button onclick="window.location.href = document.getElementById('url').value" style="padding: 10px; font-size: 16px; cursor: pointer;">Go</button>
            <p><small>All loaded assets will be saved to the <code>asset_dump</code> folder in your project directory.</small></p>
        </body>
        </html>
    `);
    
    mainWindow.loadFile(htmlPath);
});

app.on('window-all-closed', () => {
    app.quit();
});
