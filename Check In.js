
//FUNCTION TO SET A STRING TO TITLE CASE
//---------------------------------------------
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}
//---------------------------------------------


//FUNCTION TO CREATE A DEFAULT SETTINGS OBJECT IN THE CASE OF A RESET, NO RETURN VALUE
//---------------------------------------------
function createSettingsDefault(filePath) {
    var fm = FileManager.local();
    var dir = fm.libraryDirectory();
    var path = fm.joinPath(dir, "check_in_tracker_settings.txt");
    var data = {
        checkInItems: [
            "Victim",
            "Hours Of Sleep",
            "Dailies",
            "Social Media Usages"
        ],
        accountabilityContact: ["(888) 888-8888", "Contact Name"],
        checkInSheetPath: filePath,
        bookmarkAdded: false
    };
    var string = JSON.stringify(data);
    fm.writeString(path, string);
    var cont = fm.readString(path);
    var ps = JSON.parse(cont)
}
//---------------------------------------------


//FUNCTION TO UPDATE THE SETTINGS, RETURNS NO VALUES
//---------------------------------------------
function updateSettings(items, contact, filePath, bmAdded) {
    var fm = FileManager.local();
    var dir = fm.libraryDirectory();
    var path = fm.joinPath(dir, "check_in_tracker_settings.txt");
    var data = {
        checkInItems: items,
        accountabilityContact: contact,
        checkInSheetPath: filePath,
        bookmarkAdded: bmAdded
    };
    var string = JSON.stringify(data);
    fm.writeString(path, string);
    var cont = fm.readString(path);
    var ps = JSON.parse(cont)
}
//---------------------------------------------


//FUNCTION TO GET ALL SETTINGS, RETURNS A JSON OBJECT OF THE SETTINGS
//---------------------------------------------
function getSettings() {
    var fm = FileManager.local();
    var dir = fm.libraryDirectory();
    var path = fm.joinPath(dir, "check_in_tracker_settings.txt");
    var cont = fm.readString(path);
    var ps = JSON.parse(cont)
    return ps;
}
//---------------------------------------------


//FUNCTION TO RUN A CHECK-IN
//---------------------------------------------
async function runCheckIn(settings) {

   //Initialize variables
    var textStorage = []; // init storage for the text message
    var finalSt; // init storage for the file on which your check-in will be stored
    var finalText; // init where the final text message will be stored
    var date = new Date(); // set date for logging

  //Create check-in alert
    let alert = new Alert(); // create the alert object
    alert.title = "Check In"; // Set title
    for (var i in CHECK_IN_AREAS) { // fill the alert fields with the CHECK_IN_AREAS defined above	
        var t = CHECK_IN_AREAS[i];
        alert.addTextField(t).setNumbersAndPunctuationKeyboard();
    }
    alert.addAction("Submit");
    alert.addCancelAction("Cancel");

    //Present alert then take data and preps it for storage
    if (await alert.present() == 0) {
        for (var i in CHECK_IN_AREAS) {
            textStorage.push(alert.textFieldValue(i));
        }

      //Preps for storage in file
        for (var i in textStorage) { // build the rows to be appended to the storage file
            if (i == 0) {
                finalSt = date + "," + CHECK_IN_AREAS[i] + "," + textStorage[i] + "\n";
            } else {
                finalSt = finalSt + date + "," + CHECK_IN_AREAS[i] + "," + textStorage[i] + "\n";
            }
        }

        //Preps for storage in text message
        for (var j in textStorage) { // build the text message
            if (j == 0) {
                finalText = CHECK_IN_AREAS[j] + ":" + textStorage[j] + "\n";
            } else if(j < textStorage.length-1) {
                finalText = finalText + CHECK_IN_AREAS[j] + ":" + textStorage[j] + "\n";
            } else{
              finalText = finalText + CHECK_IN_AREAS[j] + ":" + textStorage[j];
            }
        }
      //Start file storage initialization
        let fm = FileManager.local();
        let iCloudInUse = fm.isFileStoredIniCloud(fm.bookmarkedPath("Checkin"));
        fm = await iCloudInUse ? await FileManager.iCloud() : await FileManager.local()
        let path = fm.bookmarkedPath("Checkin");
        fm.downloadFileFromiCloud(path);
        var cont = fm.readString(path); // get current file
        let nCont = cont + finalSt; // add today's check-in to the file
        await fm.writeString(path, nCont); // update the file with the newly formed check-in
       
       //Build text message
        var mes = new Message();
        mes.body = finalText;
        mes.recipients = [PARTNER];
        mes.send();
    } else {
        log("Canceled")
    }
}
//---------------------------------------------


//FUNCTION TO SELECT A NEW CONTACT FOR THE DAILY ACCOUNTABILITY CONTACT VARIABLE
//---------------------------------------------
async function selectContact(contact) {
  //Initialize variables
    var partnerNum = null;
    var partnerName = null;
    if (contact) {
        var c = Array.from(contact);
        partnerNum = c[0]
        partnerName = c[1]
    }

  // Build contacts container, gets all contacts from the contact object and prepares them for the selection window
    var cont = await ContactsContainer.all();
    var c = await Contact.all(cont);
    var contacts = [];
    for (var i in c) {
        var name = c[i].givenName + " " + c[i].familyName,
            pns = c[i].phoneNumbers;
        for (var j in pns) {
            var s = pns[j];
            var v = s.value;
            var n = s.localizedLabel;
            if (v != "") {
                var val = [name, n + ":" + v, v];
                contacts.push(val);
            }
        }
    }

  //Build and present contactselection menu
    const menu = contacts;
    contacts.sort()
    var table = new UITable();
    table.showSeparators = true;
    const r = new UITableRow();
    r.addText("Please select accountability partner");
    r.isHeader = true;
    table.addRow(r);
    for (var i in menu) {
        const row = new UITableRow()
        const name = menu[i][0];
        const num = menu[i][2];
        const sub = menu[i][1];
        row.onSelect = async () => {
            partnerNum = num;
            partnerName = name;
        }
        row.addText(name, sub)
        table.addRow(row);
    }
    await table.present();

    return [partnerNum, partnerName];
}
//---------------------------------------------


//FUNCTION TO ADD OR CHANGE ITEMS INCLUDED IN THE DAILY CHECK-IN
//---------------------------------------------
async function addCheckInItems(cii) {
    var cis = [];
    var al = new Alert();
    al.addTextField("Example: Triggers,Hours Slept");
    al.title = "Add Check-in Items";
    al.message = "Add your check-in items below, please separate each item by a comma";
    al.addAction("Submit");
    al.addCancelAction("Cancel")
    if (await al.present() == 0) {
        var val = await al.textFieldValue(0);
        var split = val.split(",");
        for (var i in split) {
            cis.push(toTitleCase(split[i]));
        }
    }
    return cis;
}
//---------------------------------------------


//CHANGES NOTIFICATION TIME, NO OUTPUTS
//---------------------------------------------
async function changeNotificationTime() {
  //Build and present alert warning before the time selector pops
    var a = new Alert();
    a.title = "You will now select the time at which you would like to be presented your check-in notification. Press Next."
    a.addAction("Next");
    await a.present();

  //Build and present the DatePicker
    let dp = new DatePicker();
    var time = await dp.pickTime();

    //formats the result of the data picker
    let df = new DateFormatter();
    df.dateFormat = "H";
    var hour = df.string(time);
    df.dateFormat = "m";
    var minute = df.string(time);

  //Build and set a new daily notification, removes the old one first
    Notification.removePending(["scriptable-check-in"])
    var n = new Notification();
    n.title = "Check-in 📈";
    n.body = "Click here to add today's numbers";
    n.openURL = "scriptable:///run/Untitled%20Script%201?action=checkIn";
    n.identifier = "scriptable-check-in";
    hour = parseInt(hour)
    minute = parseInt(minute)
    n.setDailyTrigger(hour, minute, true);
    n.schedule();

}
//---------------------------------------------


//RUNS MAIN ROLLUP MENU, PRESENTS OPTIONS FOR USE, DOES NOT RETURN ANYTHING
//---------------------------------------------
async function runMenu(settings) {

   //Builds and presents menu
    let menu = new Alert()
    menu.addCancelAction('Exit')
    menu.addAction('Check In')
    menu.addAction('Change Check-in Time')
    menu.addAction('Change Accountability Contact')
    menu.addAction("Change Check-in Items")
    menu.addAction('Show Spreadsheet')
    menu.addAction('Update Check-in Storage File')
    menu.addAction('Reset All')
    menu.title = 'What would you like to do?'
    let menuOutput = await menu.presentSheet()

  //Run switch function pased on menu selection
    switch (menuOutput) {
        case 0:
            await runCheckIn(settings)
            break
        case 1:
            await changeNotificationTime()
            break
        case 2:
            var contact = await selectContact(settings.accountabilityContact)
            await updateSettings(settings.checkInItems, contact, settings.checkInSheetPath, settings.bookmarkAdded);
            break
        case 3:
            var cii = await addCheckInItems();
            if (cii[0] == null) {
                cii = settings.checkInItems;
            }
            await updateSettings(cii, settings.accountabilityContact, settings.checkInSheetPath);
            break
        case 4:
            var path = FileManager.iCloud().bookmarkedPath(bookmarkName);
            await openFile(path)
            break
        case 5:
            await updateBookmark(settings);
            break
        case 6:
            await setup();
            break
        default:
            break
    }
}
//---------------------------------------------


//TAKES FILES PATH AND OPENS FILE IN SAFARI
//---------------------------------------------
async function openFile(path) {
    var url = encodeURI("shareddocuments://" + path);
    Safari.open(url);
    Script.complete()
}
//---------------------------------------------


//UPDATES BOOKMARK BY EITHER DOWNLOADING, OR TRIGGERING A APPLE SHORTCUT NEEDED FOR THE PURPOSE
//---------------------------------------------
async function updateBookmark(settings) {
    var bmAdded = settings.bookmarkAdded || "false";
    if (!bmAdded || bmAdded === "false") {
        var url = encodeURI("https://www.icloud.com/shortcuts/6987686f9e1947b18fc531fa1e72e224");
        Safari.open(url);
        Script.complete()
    } else {
        var url = encodeURI("shortcuts://run-shortcut?name=Create Scriptable Bookmark");
        Safari.open(url);
    }
}
//---------------------------------------------


// GENERAL ALERT, NOT IN USE
//---------------------------------------------
async function showAlert(title, message) {
    var al = new Alert();
    al.title = title;
    al.message = message;
    al.addAction = "Continue"
    al.addCancelAction = "Cancel"
    al.present();
}
//---------------------------------------------


//MAIN SETUP FUNCTION, OUTPUTS A VALUE THAT EITHER SHOWS SUCCESS (1), OR CANCELATION (-1)
//---------------------------------------------
async function setup() {
    var a = new Alert();
    a.title = "You will now be guided through set-up, starting with contact selection. Tap next."
    a.addAction("Next");
    await a.present();
    var contact = await selectContact();
    if (contact[0] == null) {
        return -1
    } else {
        var cii = await addCheckInItems();
        if (cii == "") {
            return -1;
        } else {
            await updateSettings(cii, contact, settings.checkInSheetPath, settings.bmAdded);
            await changeNotificationTime();
            return 1
        }
    }
}
//---------------------------------------------

//MAIN
//Initialize variables
var params = args.queryParameters
var action = null
if (params) {
    action = params.action;
}
let settings = getSettings();
log("Settings: " + JSON.stringify(settings))
const bookmarkName = "Checkin"
if (settings.checkInItems == "") {
    action = "setup";
}
const PARTNER = Array.from(settings.accountabilityContact)[0];
log("PARTNER: " + PARTNER);
const CHECK_IN_AREAS = settings.checkInItems;
log("CHECK_IN_AREAS: " + CHECK_IN_AREAS);

//  switch function to determin, from passed parameters which function to run
switch (action) {
    case undefined:
        await runMenu(settings);
        break;
    case "checkIn":
        runCheckIn(settings);
        break
    case "setup":
        var res = await setup();
        if (res == -1) {
            break
        } else {
            settings = getSettings()
            await runMenu(settings)
            break
        }
        default:
            await runMenu(settings);
            break
}
