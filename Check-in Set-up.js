const gitHubUrl = "https://raw.githubusercontent.com/kolbydayley/Scriptable/main/Check%20In.js";
var req = new Request(gitHubUrl);
var codeString = await req.loadString();
var fm = await FileManager.iCloud();
const path = fm.joinPath(fm.documentsDirectory(), "Check-in.js");
fm.writeString(path, codeString);
    
	
