/**
 * Bike Check -> Google Drive bridge.
 *
 * Receives the checks report from the Bike Check app and saves it as a CSV
 * file in a "Bike Checks" folder in your Google Drive (made on first use).
 * Saving a report with the same name again replaces the earlier copy.
 *
 * One-time setup (see drive/README.md):
 *   1. Paste this into a new project at script.google.com.
 *   2. Run setup() once and allow access to Drive.
 *   3. Deploy > New deployment > Web app: Execute as "Me", Access "Anyone".
 *   4. Run showAppLink() and copy the link from the log into Bike Check.
 */

const FOLDER_NAME = 'Bike Checks';

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('KEY')) props.setProperty('KEY', Utilities.getUuid().replace(/-/g, ''));
  const folder = getFolder_();
  Logger.log('Folder ready: ' + folder.getUrl());
  Logger.log('Now deploy as a web app, then run showAppLink().');
}

function showAppLink() {
  const key = PropertiesService.getScriptProperties().getProperty('KEY');
  if (!key) return Logger.log('Run setup() first.');
  // Run from the editor, getUrl() gives the test address ending in /dev, which the app
  // can't use. The real address (ending in /exec) is under Deploy > Manage deployments.
  Logger.log('1. Click Deploy > Manage deployments and copy the Web app URL (it ends in /exec).\n' +
    '2. Add this to the end of it, with no spaces:  ?key=' + key + '\n' +
    '3. Paste the whole thing into Bike Check > Connect Google Drive.');
}

function doPost(e) {
  try {
    const key = PropertiesService.getScriptProperties().getProperty('KEY');
    if (!key || (e.parameter && e.parameter.key) !== key) return reply_({ ok: false, error: 'Wrong link' });
    const body = JSON.parse(e.postData.contents);
    const name = String(body.name || 'Bike_checks.csv').replace(/[\\/]/g, '_');
    const folder = getFolder_();
    const old = folder.getFilesByName(name);
    while (old.hasNext()) old.next().setTrashed(true);
    const file = folder.createFile(name, String(body.csv || ''), MimeType.CSV);
    return reply_({ ok: true, url: file.getUrl(), folder: FOLDER_NAME });
  } catch (err) {
    return reply_({ ok: false, error: String(err) });
  }
}

function getFolder_() {
  const found = DriveApp.getFoldersByName(FOLDER_NAME);
  return found.hasNext() ? found.next() : DriveApp.createFolder(FOLDER_NAME);
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
