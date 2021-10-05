// Variables used by Scriptable. Variables may exist above this line if the tool was set up with the iOS installer shortcut



// CONSTANTS | UNCOMMENT THIS SECTION IF YOU WANT TO SET THESE VALUES MANUALLY
// ------------------------------------------------------
/*
const PARTNER = ["(801) 372-7423"]; //input the phone numbers of the people to whome you want your check-ins sent
// repeat the below rows with anything that you want on your check-in
const CHECK_IN_AREAS = [
  "item 1",
  "item 2",
  "..."
];
*/
// ------------------------------------------------------
// END CONSANTS

var textStorage = []; // init storage for the text message
var finalSt; // init storage for the file on which your check-in will be stored
var finalText; // init where the final text message will be stored
var date = new Date(); // set date for logging


let alert = new Alert(); // create the alert object
alert.title = "Check In";  // Set title
for (var i in CHECK_IN_AREAS) { // fill the alert fields with the CHECK_IN_AREAS defined above
    alert.addTextField(CHECK_IN_AREAS[i]);
}
alert.addAction("Submit");
alert.addCancelAction("Cancel");
if (await alert.present() == 0) {
    for (var i in CHECK_IN_AREAS) {
        textStorage.push(alert.textFieldValue(i));
    }
    for (var i in textStorage) {  // build the rows to be appended to the storage file
        if (i == 0) {
            finalSt = date + "," + titleStorage[i] + "," + textStorage[i] + "\n";
        } else {
            finalSt = finalSt + date + "," + titleStorage[i] + "," + textStorage[i] + "\n";
        }
    }
    for (var j in textStorage) { // build the text message
        if (j == 0) {
            finalText = titleStorage[j] + ":" + textStorage[j] + "\n";
        } else {
            finalText = finalText + titleStorage[j] + ":" + textStorage[j] + "\n";
        }
    }
    let fm = await FileManager.iCloud();  // build file manager
    let path = await fm.bookmarkedPath("Check-in"); // find the file that is associated with the bookmark that is defined in the settings of the Scriptable app, titled "Check-in" in the File Bookmarks section
    var cont = fm.readString(path);  // get current file
    let nCont = cont + finalSt; // add today's check-in to the file
    await fm.writeString(path, nCont);  // update the file with the newly formed check-in
    let f = fm.read(path);

    var mes = new Message(); // build text message
    mes.body = finalText;
    mes.recipients = PARTNER;
    mes.send();
} else {
    log("Canceled")
}
