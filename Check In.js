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
    //console.log(settings);	
    var textStorage = []; // init storage for the text message
    var finalSt; // init storage for the file on which your check-in will be stored
    var finalText; // init where the final text message will be stored
    var date = new Date(); // set date for logging

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
        for (var i in textStorage) { // build the rows to be appended to the storage file
            if (i == 0) {
                finalSt = date + "," + CHECK_IN_AREAS[i] + "," + textStorage[i] + "\n";
            } else {
                finalSt = finalSt + date + "," + CHECK_IN_AREAS[i] + "," + textStorage[i] + "\n";
            }
        }
        log(finalSt);
        log(textStorage);
        for (var j in textStorage) { // build the text message
            if (j == 0) {
                finalText = CHECK_IN_AREAS[j] + ":" + textStorage[j] + "\n";
            } else {
                finalText = finalText + CHECK_IN_AREAS[j] + ":" + textStorage[j] + "\n";
            }
        }
        console.log(finalText);
        //console.log(path);
        let iCloudInUse = true;
        //console.log("iCloud: " + iCloudInUse);
        let fm = await iCloudInUse ? await FileManager.iCloud() : await FileManager.local()
        let path = fm.bookmarkedPath("Checkin");
        fm.downloadFileFromiCloud(path);
        // find the file that is associated with the bookmark that is defined in the settings of the Scriptable app, titled "Check-in" in the File Bookmarks section
        console.log("Made it past FM");
        var cont = fm.readString(path); // get current file
        console.log("cont " + cont);
        let nCont = cont + finalSt; // add today's check-in to the file
        await fm.writeString(path, nCont); // update the file with the newly formed check-in
        let f = fm.read(path);
        console.log("file contents " + f);

        var mes = new Message(); // build text message
        mes.body = finalText;
        mes.recipients = [PARTNER];
        mes.send();
    } else {
        log("Canceled")
    }
}

async function selectContact(contact) {
	var c = Array.from(contact);
	var partnerNum = c[0]
    var partnerName = c[1]
    var cont = await ContactsContainer.all();
    //log(cont);
    var c = await Contact.all(cont);
    //log(c)
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

            //log("selection"+selection);
        }
        row.addText(name, sub)
        table.addRow(row);
    }
    await table.present();
    return [partnerNum, partnerName];
}

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
        //log(val);

        var split = val.split(",");
        for (var i in split) {
            cis.push(toTitleCase(split[i]));
        }
    }
    return cis;
}


async function changeNotificationTime() {
    var a = new Alert();
    a.title = "You will now select the time at which you would like to be presented your check-in notification. Press Next."
    a.addAction("Next");
    await a.present();
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
    console.log("Made it into run menu")
    let menu = new Alert()
    console.log("settings" + settings)
    menu.addCancelAction('Exit')
    menu.addAction('Check In')
    menu.addAction('Change check-in time')
    menu.addAction('Change accountability contact')
    menu.addAction("Change check-in items")
    menu.addAction('Show spreadsheet')
    menu.addAction('Update check-in storage location')
    menu.addAction('Reset all')
    menu.title = 'What would you like to do?'
    let menuOutput = await menu.presentSheet()
    log(menuOutput)
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
            console.log("cii" + toString(cii));
            if(cii[0] == null){
              cii = settings.checkInItems;
              console.log("Add Check in Canceled")
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

async function selectPath() {
    var dir = await DocumentPicker.open();
    return dir;
}

async function openFile(path) {
    console.log(path);
    var url = encodeURI("shareddocuments://" + path);
    console.log(url)
    Safari.open(url);
    Script.complete()
}

async function updateBookmark(settings) {
    var bmAdded = settings.bookmarkAdded || "false";
    console.log(bmAdded);
    if (!bmAdded || bmAdded === "false") {
        var url = encodeURI("https://www.icloud.com/shortcuts/6987686f9e1947b18fc531fa1e72e224");
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
    /*var a = new Alert();
    a.title = "You will now be guided through set-up, starting with contact selection. Tap next."
    a.addAction("Next");
    await a.present();*/
    var contact = await selectContact();
    if (contact[0] == null) {
        return -1
    } else {
        console.log("contact" + contact);
        var cii = await addCheckInItems();
        if (cii == "") {
            return -1;
        } else {
            await updateSettings(cii,contact,settings.checkInSheetPath,settings.bmAdded);
            await changeNotificationTime();
            return 1
        }
    }
}

//MAIN
var params = args.queryParameters
var action = null
if (params) {
    action = params.action;
    console.log(action);
}

let settings = getSettings();
console.log(settings);
const bookmarkName = "Checkin"
if (settings.checkInItems == "") {
    action = "setup";
}
action = "setup";
//createSettingsDefault()
const PARTNER = Array.from(settings.accountabilityContact)[0];
console.log(PARTNER)

var fm = FileManager.local();
var dir = fm.libraryDirectory();
//console.log(fm.listContents(dir));
var path = fm.joinPath(dir, "check_in_tracker_settings.txt");
//fm.remove(path);

//input the phone numbers of the people to whome you want your check-ins sent
// repeat the below rows with anything that you want on your check-in
const CHECK_IN_AREAS = settings.checkInItems;
//createSettingsDefault();
//let fm = await FileManager.iCloud(); 
// build file manager
//let path = await fm.bookmarkedPath("Check-in")
//updateSettings(settings.checkInItems,settings.accountabilityContact,path);
//getSettings();

// settings options are change accountsbility contaxt, change check-in items, find check in spreadsheet, send check in soreadsheet, check in
switch (action) {
    case undefined:
        console.log("Made it to run menu")
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
