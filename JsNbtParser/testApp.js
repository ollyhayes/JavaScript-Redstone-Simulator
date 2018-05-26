//Init the name space:
window["com"] = {mordritch: {mcSim:{}}};

$(document).ready(function () {
	$.ajax({
		url: 'php/getSchematic.php',
		beforeSend: function(xhr) {
			xhr.overrideMimeType('text/plain; charset=x-user-defined'); //Unless set, charAtCode doesn't always return the expected result
		},
		success: function(data) {
			onSuccess(data);
		}
	});
});

function logOut(text) {
	$("#feedback").append(text + "<br/>");
}

function onSuccess(data) {
	var startTime = new Date().getTime();
	try {
		window["nbtData"] = new com.mordritch.mcSim.NbtParser().decode(data);
	} 
	catch (e) {
		alert(e);
	}
	var diffTime = new Date().getTime() - startTime;
	window["schematic"] = new com.mordritch.mcSim.World_Schematic(window["nbtData"]);
	
	logOut("Loaded " + data.length + " bytes in "+diffTime+"ms.");
	
	logOut("X size: " + schematic.getSizeX() + " (X increases East, decreases West)");
	logOut("Y size: " + schematic.getSizeY() + " (Y increases upwards, decreases downwards)");
	logOut("Z size: " + schematic.getSizeZ() + " (Z increases South, decreases North)");
	
	preview();
}

function preview() {
	var preString = "";
	var blockID;
	
	preString += "+";
	for (var x = 0; x < schematic.getSizeX(); x++) {
		preString += "--";
	}
	preString += "+\n";
	
	for (var z = 0; z < schematic.getSizeZ(); z++) {
		preString += "|";
		for (var x = 0; x < schematic.getSizeX(); x++) {
			blockID = schematic.getBlockId(x,0,z);
			if (blockID == 0) preString += "  ";
			if (blockID > 0 && blockID < 16) preString += "0" + blockID.toString(16);
			if (blockID >= 16) preString += blockID.toString(16);
		}
		preString += "|\n";
	}

	preString += "+";
	for (var x = 0; x < schematic.getSizeX(); x++) {
		preString += "--";
	}
	preString += "+\n";
	
	$("#preview").html(preString); 
}
