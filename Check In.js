function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function createSettingsDefault(filePath) {
    var fm = FileManager.local();
    var dir = fm.libraryDirectory();
    //console.log(fm.listContents(dir));
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
    console.log(ps);
}

function updateSettings(items, contact, filePath, bmAdded) {
    var fm = FileManager.local();
    var dir = fm.libraryDirectory();
    //console.log(fm.listContents(dir));
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
    console.log(ps);
}

function getSettings() {
    var fm = FileManager.local();
    var dir = fm.libraryDirectory();
    //console.log(fm.listContents(dir));
    var path = fm.joinPath(dir, "check_in_tracker_settings.txt");
    var cont = fm.readString(path);
    var ps = JSON.parse(cont)
    //console.log(ps.checkInItems + "   " + ps.accountabilityContact + "   " + ps.checkInSheetPath);
    return ps;
}

async function runCheckIn(settings) {
    // INITIALIZE VARIABLES FOR THIS FUNCTION
    var textStorage = []; // init storage for the text message
    var finalSt; // init storage for the file on which your check-in will be stored
    var finalText; // init where the final text message will be stored
    var date = new Date(); // set date for logging

    // BUILD CHECK IN ALERT THAT WILL CAPTURE DATA
    let alert = new Alert(); // create the alert object
    alert.title = "Check In"; // Set title
    for (var i in CHECK_IN_AREAS) { // fill the alert fields with the CHECK_IN_AREAS defined above	
        var t = CHECK_IN_AREAS[i];
        alert.addTextField(t).setNumbersAndPunctuationKeyboard();
    }
    alert.addAction("Submit");
    alert.addCancelAction("Cancel");
    if (await alert.present() == 0) {
        for (var i in CHECK_IN_AREAS) {
            textStorage.push(alert.textFieldValue(i));
        }
        log(textStorage);

        //BUILD OUT THE DATA TO STORE IN THE FILE
        for (var i in textStorage) { // build the rows to be appended to the storage file
            if (i == 0) {
                finalSt = date + "," + CHECK_IN_AREAS[i] + "," + textStorage[i] + "\n";
            } else {
                finalSt = finalSt + date + "," + CHECK_IN_AREAS[i] + "," + textStorage[i] + "\n";
            }
        }

        //BUILD OUT THE TEXT MESSAGE DATA
        for (var j in textStorage) { // build the text message
            if (j == 0) {
                finalText = CHECK_IN_AREAS[j] + ":" + textStorage[j] + "\n";
            } else if (j < textStorage.length - 1) {
                finalText = finalText + CHECK_IN_AREAS[j] + ":" + textStorage[j] + "\n";
            } else {
                finalText = finalText + CHECK_IN_AREAS[j] + ":" + textStorage[j];
            }
        }

        // BUILD FILE MANAGER AND POPULATE FILE WITH CHECK-IN DATA
        let fm = FileManager.local()
        const iCloudInUse = fm.isFileStoredIniCloud(fm.bookmarkedPath("Checkin"))
        fm = iCloudInUse ? FileManager.iCloud() : fm;
        let path = fm.bookmarkedPath("Checkin");
        fm.downloadFileFromiCloud(path); // find the file that is associated with the bookmark that is defined in the settings of the Scriptable app, titled "Checkin" in the File Bookmarks section and download it
        var cont = fm.readString(path); // get current fill
        let nCont = cont + finalSt; // add today's check-in to the file
        await fm.writeString(path, nCont); // update the file with the newly formed check-in
        let f = fm.read(path);

        // SEND MESSAGE TO ACCOUNTABILITY CONTACT
        var mes = new Message(); // build text message
        mes.body = finalText;
        mes.recipients = [PARTNER];
        mes.send();
    } else {
        log("Canceled")
    }
}

// FUNCTION TO CHOOSE A NEW CONTACT, RETURNS CONTACT ["PHONE NUMBER", "NAME"]
async function selectContact() {
    var cont = await ContactsContainer.all();
    var c = await Contact.all(cont);
    var contacts = [];

    for (var i in c) {
        var name = c[i].givenName + " " + c[i].familyName,
            pns = c[i].phoneNumbers;
        //log(pns);
        for (var j in pns) {
            var s = pns[j];
            var v = s.value;
            var n = s.localizedLabel;
            //log(v);
            if (v != "") {
                var val = [name, n + ":" + v, v];
                contacts.push(val);
            }
        }
    }

    var partnerNum;
    var partnerName;
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

//FUNCTION TO ADD NEW CHECK IN ITEMS, RETURNS AN ARRAY CONTAINING THE CHECK-IN VALUES
async function addCheckInItems() {
    var cis = [];
    var al = new Alert();
    al.addTextField("Example: Triggers,Hours Slept");
    al.title = "Add Check-in Items";
    al.message = "Add your check-in items below, please separate each item by a comma";
    al.addAction("Submit");
    al.addCancelAction("Cancel")
    if (await al.present() == 0) {
        var val = await al.textFieldValue(0);
        //log(val);

        var split = val.split(",");
        for (var i in split) {
            cis.push(toTitleCase(split[i]));
        }
    }
    return cis;
}

//FUNCTION TO SET A NEW NOTIFICATION TIME
async function changeNotificationTime() {
    //CAPTURE NEW CHECK IN TIME
    var a = new Alert();
    a.title = "You will now select the time at which you would like to be presented your check-in notification. Press Next."
    a.addAction("Next");
    let dp = new DatePicker();
    var time = await dp.pickTime();
    log(time);
    let df = new DateFormatter();
    df.dateFormat = "H";
    var hour = df.string(time);
    log(hour);
    df.dateFormat = "m";
    var minute = df.string(time);
    log(minute);

    //DELETE OLD NOTIFICATION AND BUILD A NEW ONE
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

async function runMenu(settings) {
    // BUILD MENU FOR INITIAL SCREEN
    let menu = new Alert()
    menu.addCancelAction('Exit')
    menu.addAction('Check In')
    menu.addAction('Change check-in time')
    menu.addAction('Change accountability contact')
    menu.addAction("Change check-in items")
    menu.addAction('Show spreadsheet')
    menu.addAction('Update check-in storage location')
    menu.addAction('Reset all')
    menu.message = 'What would you like to do?'
    let menuOutput = await menu.presentSheet()
    log(menuOutput)

    //TRIGGER FUNCTION BASED ON MENU SELECTION
    switch (menuOutput) {
        case 0:
            await runCheckIn(settings)
            break
        case 1:
            await changeNotificationTime()
            break
        case 2:
            var contact = await selectContact()
            await updateSettings(settings.checkInItems, contact, settings.checkInSheetPath, settings.bookmarkAdded);
            break
        case 3:
            var cii = await addCheckInItems();
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

//FUNCTION TO OPEN A FILE, WILL FORCE YOU TO LEAVE THE APP AND OPEN THE FILES APP
async function openFile(path) {
    console.log(path);
    var url = encodeURI("shareddocuments://" + path);
    console.log(url)
    Safari.open(url);
    Script.complete()
}

//TRIGGER APPLE SHORTCUT TO UPDATE BOOKMARK, IF YOU HAVEN'T YET DOWNLOADED THE SHORTCUT, YOU WILL BE PROMPTED TO DOWNLOAD IT
async function updateBookmark(settings) {
    var bmAdded = settings.bookmarkAdded || "false";
    console.log(bmAdded);
    if (!bmAdded || bmAdded === "false") {
        var url = encodeURI("https://www.icloud.com/shortcuts/1959cf3cbc62438ca5ac0ca079ce916e");
        console.log(url)
        updateSettings(settings)
        Safari.open(url);
        Script.complete()
    } else {
        var url = encodeURI("shortcuts://run-shortcut?name=Create Scriptable Bookmark");
        console.log(url)
        Safari.open(url);
    }
}

async function showAlert(title, message) {
    var al = new Alert();
    al.title = title;
    al.message = message;
    al.addAction = "Continue"
    al.addCancelAction = "Cancel"
    al.present();
}

async function setup() {
    var contact = await selectContact();
    var cii = await addCheckInItems();
    if (!path || !contact || !cii) {
        var al = new Alert();
        al.title = "Something went wrong. Please try again.";
        al.present();
    } else {
        updateSettings(cii, contact, path);
        changeNotificationTime();
    }
}

//MAIN
var params = args.queryParameters // receives data from trigger url params, normally the url triggered by clicking a notification
var action = params.action

const settings = getSettings();
const bookmarkName = "Checkin"
if (!settings.checkInItems) { // if a user has not set up the app, this will force a setup action
    action = "setup";
}
//PULLS CONSTANTS FROM SETTINGS
const PARTNER = Array.from(settings.accountabilityContact)[0];
const CHECK_IN_AREAS = settings.checkInItems;

switch (action) {
    case undefined:
        console.log("Made it to run menu")
        await runMenu(settings);
        break;
    case "checkIn":
        runCheckIn(settings);
        break
    case "setup":
        setup();
    default:
        runMenu(settings);
}
