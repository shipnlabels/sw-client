const { MacUpdater, DebUpdater, NsisUpdater } = require("electron-updater")
const { dialog, app } = require('electron');
const log = require('electron-log');

let awaitingToUpdate = false;

module.exports = () => {
    let updater;

    if(process.platform === 'darwin') {
        updater = new MacUpdater({
            provider: "generic",
            url: "https://content.playsmallworlds.com/updates/mac/",
            channel: "latest"
        })
    }else if(process.platform === "linux") {
        updater = new DebUpdater({
            provider: "generic",
            url: "https://content.playsmallworlds.com/updates/linux/",
            channel: "latest"
        })
    }
    else if(process.platform === "win32") {
        updater = new NsisUpdater({
            provider: "generic",
            url: "https://content.playsmallworlds.com/updates/win/",
            channel: "latest"
        })
    }
    else {
        return;
    }

    updater.logger = log;
    updater.logger.transports.file.level = 'info';

    updater.checkForUpdatesAndNotify();

    // Set interval to check for updates every 1 minute
    setInterval(() => {
        if(awaitingToUpdate) return;
        updater.checkForUpdates();
    }, 30 * 60 * 1000);

    updater.on('update-downloaded', (event, releaseNotes, releaseName) => {
        if(awaitingToUpdate) return;
        awaitingToUpdate = true;

        const dialogOpts = {
            type: 'info',
            buttons: ['Restart', 'Later'],
            title: 'Application Update',
            message: process.platform === 'win32' ? releaseNotes : releaseName,
            detail: 'A new version has been downloaded. Restart the application to apply the updates.'
        };

        dialog.showMessageBox(dialogOpts).then((returnValue) => {
            awaitingToUpdate = false;
            if (returnValue.response === 0) {
                if(process.platform === 'darwin')
                    app.removeAllListeners('window-all-closed');

                updater.quitAndInstall();
            }
        });
    });
}