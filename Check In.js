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
    var path = fm.joinPath(dir, SET_LOC);
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
function updateSettings(data) {
    var fm = FileManager.local();
    var dir = fm.libraryDirectory();
    var path = fm.joinPath(dir, SET_LOC);
    var string = JSON.stringify(data);
    fm.writeString(path, string);
    var cont = fm.readString(path);
    var ps = JSON.parse(cont)
}
//---------------------------------------------


//FUNCTION TO GET ALL SETTINGS, RETURNS A JSON OBJECT OF THE SETTINGS
//---------------------------------------------
async function getSettings() {
    try {
        var fm = FileManager.local();
        var dir = fm.libraryDirectory();
        var path = fm.joinPath(dir, SET_LOC);
        var cont = fm.readString(path);
        var ps = JSON.parse(cont)
        return ps;
    } catch (e) {
        return -1
    }
}
//---------------------------------------------


// FUNCTION TO GET SETTINGS BY THE SYSTEM ID
//---------------------------------------------
function getSettingsByName(id, settings) {
    var s = null;
    var c
    for (var i in settings) {
        if (settings[i].id == id) {
            s = settings[i]
            c = i
        }
    }
    return [s, c]
}
//---------------------------------------------


//FUNCTION TO RUN A CHECK-IN
//---------------------------------------------
async function runCheckIn(settings, name) {

    //Initialize variables
    var textStorage = []; // init storage for the text message
    var finalSt; // init storage for the file on which your check-in will be stored
    var finalText; // init where the final text message will be stored
    var date = new Date(); // set date for logging
    let CHECK_IN_AREAS = settings.checkInItems;
    let PARTNER = settings.accountabilityContact[0];

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
            } else if (j < textStorage.length - 1) {
                finalText = finalText + CHECK_IN_AREAS[j] + ":" + textStorage[j] + "\n";
            } else {
                finalText = finalText + CHECK_IN_AREAS[j] + ":" + textStorage[j];
            }
        }
        //Start file storage initialization
        let fm = FileManager.local();
        let iCloudInUse = fm.isFileStoredIniCloud(fm.bookmarkedPath(name));
        fm = await iCloudInUse ? await FileManager.iCloud() : await FileManager.local()
        let path = fm.bookmarkedPath(name);
        fm.downloadFileFromiCloud(path);
        var cont = fm.readString(path); // get current file
        let nCont = cont + finalSt; // add today's check-in to the file
        await fm.writeString(path, nCont); // update the file with the newly formed check-in

        //Build text message	
        if (PARTNER != null) {
            var mes = new Message();
            mes.body = finalText;
            mes.recipients = [PARTNER];
            mes.send();
        }
        t
    } else {
        log("Canceled")
    }
}
//---------------------------------------------



// FUNCTION TO FORMAT A PHONE NUMBER
//---------------------------------------------
function formatPhoneNumber(phoneNumberString) {
    var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        var intlCode = (match[1] ? '+1 ' : '');
        return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    }
    return null;
}
//---------------------------------------------



//FUNCTION TO SELECT A NEW CONTACT FOR THE DAILY ACCOUNTABILITY CONTACT VARIABLE
//---------------------------------------------
async function selectContact(contact, filter) {
    //Initialize variables
    var partnerNum = null;
    var partnerName = null;
    if (contact && contact != "") {
        var c = Array.from(contact);
        partnerNum = c[0]
        partnerName = c[1]
    }
    var fil = filter || null;

    // Build contacts container, gets all contacts from the contact object and prepares them for the selection window
    var cont = await ContactsContainer.all();
    var c = await Contact.all(cont);
    var contacts = [];
    for (var i in c) {
        var name = c[i].givenName + " " + c[i].familyName,
            pns = c[i].phoneNumbers;
        index = name.toLowerCase().indexOf(fil);
        if (index > -1 || fil === null) {
            for (var j in pns) {
                var s = pns[j];
                var v = formatPhoneNumber(s.value);
                var n = s.localizedLabel;
                if (v != "") {
                    var val = {
                        name: name,
                        subTitle: n + ": " + v,
                        num: v
                    };
                    var cInc = contacts.indexOf(val)
                    if (cInc == -1) {
                        contacts.push(val);
                    }
                }
            }
        }
    }

    //Build and present contactselection menu
    const menu = contacts;
    contacts.sort()
    contacts.sort(function(a, b) {
        var nameA = a.name.toUpperCase(); // ignore upper and lowercase
        var nameB = b.name.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // names must be equal
        return 0;
    });
    var table = new UITable();
    table.showSeparators = true;
    const r = new UITableRow();
    var tit = r.addText("Select your accountability partner");
    tit.centerAligned()
    r.isHeader = true;
    var skip = new UITableRow();
    var cell = skip.addText("Do not send text");
    cell.titleColor = Color.blue()
    cell.centerAligned()
    skip.dismissOnSelect = true
    skip.onSelect = () => {
        partnerName = null
        partnerNum = null
    }
    var displayedRows = [];
    var search = new UITableRow();
    var cell2 = search.addText("Search");
    cell2.titleColor = Color.blue()
    cell2.centerAligned()
    search.onSelect = async () => {
        var a = new Alert();
        a.title = "Search"
        a.message = "Not case sensitive"
        a.addTextField("Ex: John")
        a.addAction("Search")
        await a.present()
        var val = a.textFieldValue(0)
        filter = val.toLowerCase();
        //console.log("Displayed: "+ JSON.stringify(displayedRows))
        log("filter: " + filter)
        var c = [];
        for (var f in menu) {
            var name = rows[f].name
            var row = rows[f].row;
            var num = rows[f].num;
            var sub = rows[f].sub;
            var index = name.toLowerCase().indexOf(filter)
            var result = displayedRows.findIndex(item => item.num === num);
            //console.log("Name: "+num+" | Result: " +result+" | index: "+ index + " | ")
            if (index == -1) {
                //log("Row Removed");
                table.removeRow(row);
                displayedRows.splice(parseInt(result), 1)
            } else if (index > -1 && result === -1) {
                //log("Row Added")
                table.addRow(row);
                displayedRows.push({
                    name: name,
                    num: num,
                    sub: sub
                })
            }
        }
        table.reload()
    }
    search.dismissOnSelect = false
    //var searchR = new UITableRow()
    //const search = searchR.addButton("Search");
    //search.onSelect = (function(){searchAlert();})
    //table.addRow(searchR)
    table.addRow(r);
    table.addRow(skip)
    table.addRow(search);
    var rows = [];
    for (var i in menu) {
        const name = menu[i].name;
        const num = menu[i].num;
        const sub = menu[i].subTitle;
        var result = displayedRows.findIndex(item => item.num === num);
        //if(result == -1){
        const row = new UITableRow()
        row.cellSpacing = 1
        row.onSelect = async () => {
            partnerNum = num;
            partnerName = name;
        }
        var cellLeft = row.addText(name)
        var cellRight = row.addText(sub)
        cellLeft.leftAligned();
        cellRight.titleFont = Font.ultraLightRoundedSystemFont(15)
        cellRight.rightAligned();
        table.addRow(row);
        rows.push({
            name: name,
            row: row,
            num: num,
            sub: sub
        });
        displayedRows.push({
            name: name,
            num: num,
            sub: sub
        });
        // }
    }
    await table.present();

    return [partnerNum, partnerName];
}
//---------------------------------------------


//FUNCTION TO ADD OR CHANGE ITEMS INCLUDED IN THE DAILY CHECK-IN
//---------------------------------------------
async function addCheckInItems(cii) {
    cii = cii || [];
    var cis = cii
    var ph;
    if (cii.length > 0) {
        for (var i in cii) {
            if (i == 0) {
                ph = cii[i]
            } else {
                ph = ph + "," + cii[i]
            }
        }
    }
    var al = new Alert();
    if (ph != "") {
        al.addTextField("Example: Triggers,Hours Slept", ph);
    } else {
        al.addTextField("Example: Triggers,Hours Slept");
    }
    al.title = "Add Check-in Items";
    al.message = "Add your check-in items below, please separate each item by a comma";
    al.addAction("Submit");
    al.addCancelAction("Cancel")
    if (await al.present() == 0) {
        var val = await al.textFieldValue(0);
        var split = val.split(",");
        cis = []
        for (var i in split) {
            cis.push(toTitleCase(split[i]));
        }
    }
    return cis;
}
//---------------------------------------------


//CHANGES NOTIFICATION TIME, NO OUTPUTS
//---------------------------------------------
async function changeNotificationTime(id, name) {
    //Build and present alert warning before the time selector pops
    var a = new Alert();
    a.title = "Choose your notification time. Press Next."
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
    Notification.removePending(["scriptable-check-in" + id])
    var n = new Notification();
    n.title = name;
    n.body = "Click to log today's numbers";
    var scriptName = SCRIPT_NAME.replaceAll(" ", "%20")
    n.openURL = "scriptable:///run/" + scriptName + "?action=checkIn&id=" + id;
    n.identifier = "scriptable-check-in" + id;
    n.threadIdentifier = id;
    n.scriptName = SCRIPT_NAME
    hour = parseInt(hour)
    minute = parseInt(minute)
    n.setDailyTrigger(hour, minute, true);
    n.schedule();
}
//---------------------------------------------


//RUNS MAIN ROLLUP MENU, PRESENTS OPTIONS FOR USE, DOES NOT RETURN ANYTHING
//---------------------------------------------
async function runMenu(settings, settingsMaster, loc) {

    //Builds and presents menu
    let menu = new Alert()
    menu.addCancelAction('Exit')
    menu.addAction('Check In')
    menu.addAction('Change Check-in Time')
    menu.addAction('Change Accountability Contact')
    menu.addAction("Change Check-in Items")
    menu.addAction('Show Spreadsheet')
    menu.addAction('Update Check-in Storage File')
    menu.addAction('Delete This System')
    menu.title = 'What would you like to do?'
    let menuOutput = await menu.presentSheet()
    var data = {
        checkInItems: settings.checkInItems,
        accountabilityContact: settings.accountabilityContact,
        checkInSheetPath: settings.checkInSheetPath,
        id: settings.id,
        name: settings.name
    };

    //Run switch function pased on menu selection
    switch (menuOutput) {
        case 0:
            await runCheckIn(settings, settings.name)
            break
        case 1:
            await changeNotificationTime(settings.id, settings.name)
            break
        case 2:
            data.accountabilityContact = await selectContact(settings.accountabilityContact)
            settingsMaster[loc] = data
            await updateSettings(settingsMaster);
            break
        case 3:
            data.checkInItems = await addCheckInItems(settings.checkInItems);
            if (data.checkInItems[0] == null) {
                cii = settings.checkInItems;
            }
            settingsMaster[loc] = data
            await updateSettings(settingsMaster);
            break
        case 4:
            var path = FileManager.iCloud().bookmarkedPath(data.name);
            await openFile(path)
            break
        case 5:
            await updateBookmark(settings, settings.name);
            break
        case 6:
            await removeSystem(settingsMaster, loc, settings.id)
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
async function updateBookmark(settings, name) {
    var id = settings.id
    var url = encodeURI("shortcuts://run-shortcut?name=Check In Helper&input=text&text=" + name + ";" + id + ";" + SET_LOC);
    Safari.open(url);
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



// FUNCTION TO ADD A NEW ACCOUNTABILITY SYSTEM
//---------------------------------------------
async function addNewSystem() {
    log("Add New System")
    var a = new Alert();
    a.title = "What would you like to call this system?"
    a.addTextField("Ex: Daily Check-in")
    a.addAction("Next");
    var data = {
        checkInItems: "",
        accountabilityContact: "",
        checkInSheetPath: "",
        bookmarkAdded: false,
        id: UUID.string(),
        name: ""
    }
    await a.present();
    var name = a.textFieldValue(0);
    log(name);
    data.name = name;
    data.accountabilityContact = await selectContact();
    data.checkInItems = await addCheckInItems();
    await changeNotificationTime(data.id, data.name);
    return data;


    //get the name of the new one, get all other info, including id, push to settings, send to update settings function
    //return new settings creation
}
//---------------------------------------------



// FUNCTION TO REMOVE A SYSTEM
//---------------------------------------------
async function removeSystem(settingsMaster, loc, id) {

    var name = settingsMaster[loc].name;
    var a2 = new Alert();
    a2.title = 'Are you sure you want to delete "' + name + '"?';
    a2.addCancelAction("No");
    a2.addAction("Yes")
    var sel2 = await a2.present();
    var a3 = new Alert();
    log("Sel2: " + sel2)
    if (sel2 == 0) {
        log("Deleted flow. loc: " + loc)
        const index = loc;
        log("index =" + index)
        if (index > -1) {
            log("Deleted index")
            settingsMaster.splice(index, 1);
            // 2nd parameter means remove one item only
            updateSettings(settingsMaster);
            Notification.removePending(["scriptable-check-in" + id])
            a3.title = '"' + name + '" has been permanently deleted?';
            a3.addAction("Okay")
            a3.present()
        }
    } else {
        a3.title = 'This action has been canceled';
        a3.addAction("Okay")
        a3.present()
    }

}
//---------------------------------------------



// FUNCTION TO ALLOW USER TO SELECT THEIR SETTINGS
//---------------------------------------------
async function admin(settings) {
    log(settings);
    var count = 0;
    var a = new Alert();
    a.title = "Which system would you like to view?";
    a.addCancelAction("Exit")
    for (var i in settings) {
        console.log(settings[i].name)
        a.addAction(settings[i].name);
        count++;
    }
    a.addAction("Add New Accountability System")
    var loc = await a.presentSheet()
    console.log(loc + " " + count);
    switch (loc) {
        case count:
            var settingsSelection = await addNewSystem(settings);
            settings.push(settingsSelection);
            await updateSettings(settings);
            await updateBookmark(settingsSelection, settingsSelection.name)
            return [settings, loc]
        case -1:
            log("EXITED")
            return [-1, -1]
        default:
            var settingsSelection = settings[loc]
            return [settingsSelection, loc]
    }
}

//---------------------------------------------

//MAIN
//Initialize variables
var action = null
var id = null
var settings
var settingsMaster
var loc
var resp


const params = args.queryParameters
const SET_LOC = "check_in_tracker_settings_prod.txt"
const SCRIPT_NAME = await Script.name()


if (params.action) {
    action = params.action;
    id = params.id
    settingsMaster = await getSettings();
    resp = await getSettingsByName(id, settingsMaster)
    loc = resp[1]
    settings = resp[0]

} else {
    settingsMaster = await getSettings()
    if (settingsMaster == null) {
        settingsMaster = [];
        resp = await admin(settingsMaster)
        settings = resp[0]
        loc = resp[1]
    } else {
        log("Settings: " + JSON.stringify(settingsMaster))
        log(settings);
        resp = await admin(settingsMaster);
        settings = resp[0]
        loc = resp[1]
    }
}

console.log("Setting selection: " + JSON.stringify(settings))
//  switch function to determin, from passed parameters which function to run
log("action = " + action)
if (settingsMaster != -1 && resp[0] != -1) {
    switch (action) {
        case null:
            log(loc + "   " + settingsMaster)
            await runMenu(settings, settingsMaster, loc);
            break;
        case "checkIn":
            runCheckIn(settings, settings.name);
            break
        case "setup":
            var res = await addNewSystem()
            settingsMaster = [res]
            updateSettings(settingsMaster)
            if (res == -1) {
                break
            } else {
                await runMenu(res, settingsMaster, 0)
                break
            }
            default:
                await runMenu(settings);
                break
    }
} else {
    Script.complete()
}
