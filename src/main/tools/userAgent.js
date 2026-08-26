const { session } = require('electron');
module.exports = function () {
    // Set User-Agent based on the operating system
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => 
    {
        // Check OS and set User-Agent accordingly
        // Must stay in step with the patterns in root.php - this pair is how the
        // backend tells the game client apart from a plain browser.
        if (process.platform === 'darwin') {
            details.requestHeaders['User-Agent'] = 'SmallWorldsClient-Mac-x64';
        } else if (process.platform === 'win32') {
            details.requestHeaders['User-Agent'] = 'SmallWorldsClient-Windows-x64';
        } else if (process.platform === 'linux') {
            details.requestHeaders['User-Agent'] = 'SmallWorldsClient-Linux-x64';
        }
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
  
}