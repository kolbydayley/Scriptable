// Names of Weather 
const gitHubUrl = "https://raw.githubusercontent.com/kolbydayley/Scriptable/main/Check%20In.js";
var req = new Request(gitHubUrl);
var codeString = await req.loadString();
//log(codeString);

var cont = await ContactsContainer.all();
//log(cont);
var c = await Contact.all(cont);
//log(c)
var contacts = [];

for(var i in c){
	var name = c[i].givenName + " " + c[i].familyName,	
		pns = c[i].phoneNumbers;
	//log(pns);
	for(var j in pns){
		var s = pns[j];
		var v = s.value;
		var n = s.localizedLabel;
		//log(v);
		if(v != ""){
			var val = [name,n + ":" + v, v];
			contacts.push(val);
		}
	}
}

var partner;
const menu = contacts;
contacts.sort()
var table = new UITable();
table.showSeparators = true;
const r = new UITableRow();
r.addText("Please select accountability partner");
r.isHeader = true;
table.addRow(r);

for(var i in menu){
	const row = new UITableRow()
	const name = menu[i][0];
	const num = menu[i][2];
	const sub = menu[i][1];
	row.onSelect = async () => {
		 partner = num;
		//log("selection"+selection);
	}
	row.addText(name,sub)
	table.addRow(row);
}
await table.present();

var al = new Alert();
al.addTextField("Add check-items here, please separate each by a comma...");
al.title = "Add Check-in Items";
al.message = "Add your check-in items below, please separate each item by a comma";
al.addAction("Submit");
al.addCancelAction("Cancel")
if (await al.present() == 0) {
var val = await al.textFieldValue(0);
//log(val);

var split = val.split(",");
var cis = [];
for(var i in split){
	cis.push("\n    \""+split[i]+"\"")
}
log(cis);

codeString = "const PARTNER = [\"" + partner + "\"];\n" + "const CHECK_IN_AREAS = [" + cis + "\n];\n" + codeString;

log(codeString)


var fm = await FileManager.iCloud();
const path = fm.joinPath(fm.documentsDirectory(), "Check-in 123.js");
fm.writeString(path, codeString);
} else{
	log("Canceled");
}
