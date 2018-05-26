/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * 
 */

com.mordritch.mcSim.NbtParser = function() {
	this.TAG_End = 0;
	this.TAG_Byte = 1;
	this.TAG_Short = 2;
	this.TAG_Int = 3;
	this.TAG_Long = 4;
	this.TAG_Float = 5;
	this.TAG_Double = 6;
	this.TAG_Byte_Array = 7;
	this.TAG_String = 8;
	this.TAG_List = 9;
	this.TAG_Compound = 10;

	this.binaryParser = new BinaryParser(true, false);
	this.expectedStartingTag = this.TAG_Compound;

	this.readByte = function(peekOnly) {return this.binaryParser.toByte(this.readBuffer(8,peekOnly))};
	this.readShort = function(peekOnly) {return this.binaryParser.toShort(this.readBuffer(16,peekOnly))};
	this.readInt = function(peekOnly) {return this.binaryParser.toInt(this.readBuffer(32),peekOnly)};
	this.readLong = function(peekOnly) {return this.binaryParser.toLong(this.readBuffer(64),peekOnly)};
	this.readFloat = function(peekOnly) {return this.binaryParser.toFloat(this.readBuffer(32),peekOnly)};
	this.readDouble = function(peekOnly) {return this.binaryParser.toDouble(this.readBuffer(64),peekOnly)};
	this.readString = function() {return this.readBuffer(8 * this.readShort())};

	this.writeByte = function(number) {return String.fromCharCode(number)};
	this.writeShort = function(number) {return this.binaryParser.fromShort(number)};
	this.writeInt = function(number) {return this.binaryParser.fromInt(number)};
	this.writeLong = function(number) {return this.binaryParser.fromLong(number)};
	this.writeFloat = function(number) {return this.binaryParser.fromFloat(number)};
	this.writeDouble = function(number) {return this.binaryParser.fromDouble(number)};
	this.writeString = function(string) {return this.writeShort(string.length) + string;}
	
	/**
	 * Returns string of data of a length in bits
	 * 
	 * @param {Integer}	bitLength	length of data to return in terms of number of bits
	 * @param {Bool}	peekOnly	If true, we doin't move the pointer
	 * @return {String}
	 */
	this.readBuffer = function(bitLength, peekOnly) {
		var byteLength;
		var returnData;
		
		if (typeof peekOnly == undefined) peekOnly = false;
		
		byteLength = bitLength/8;

		if (byteLength < 1) { 
			//Sometimes we are asked to read strings of zero length, this is not unusual for blocks like signs without text on every line
			returnData = "";
		}
		else {
			if (this.pointer + byteLength > this.binaryNbtData.length) {
				throw new Error("NbtParser.readBuffer(): Unexpectedly reached end of NBT data of length "+this.binaryNbtData.length+" (0x"+(this.binaryNbtData.length - 1).toString(16)+"). Tried reading "+byteLength+" bytes of data at position "+this.pointer+" (0x"+this.pointer.toString(16)+").");
			}
			else {
				returnData = this.binaryNbtData.substr(this.pointer, byteLength);
			}
		}

		if (!peekOnly) this.pointer += byteLength;
		return returnData;
	}

	/**
	 * Decodes uncompressed NBT data
	 * 
	 * Returns as an object structured to represent the NBT data
	 * 
	 * @param	{String}	binaryNbtData
	 * @return	{Object}
	 */
	this.decode = function(binaryNbtData) {
		var returnData = {};
		var starterTagId;
		var starterTagName;
		
		this.binaryNbtData = binaryNbtData;
		this.pointer = 0;
		
		//Check if it's gzipped (starts with 0x1F and 0x8B):
		var byte1 = this.readByte();
		var byte2 = this.readByte();
		if (
			byte1 == 0x1f &&
			byte2 == 0x8b
		) {
			var gzipObject = GZip.load(this.binaryNbtData);
			this.binaryNbtData = '';
			for (var i=0; i<gzipObject.data.length; i++) {
				this.binaryNbtData += gzipObject.data[i];
			}
		}
		
		this.pointer = 0;
		starterTagId = this.readByte();

		//I don't know if it's alpha levels in general, or my chunk extractor/decompressor, but
		//chunks seem to start with a TAG_Compound which has a name length of 0. That is, files
		//start with 0x0a0000. 
		if (this.readShort(true) == 0) {
			this.pointer += 2;
			starterTagId = this.readByte();
		}


		if (starterTagId != this.expectedStartingTag) {
			throw new Error("NbtParser.decode(): Bad starting tag for NBT data, expected 0x"+this.byteToHex(this.expectedStartingTag)+" but got 0x"+this.byteToHex(starterTagId)+".");
		}
		starterTagName = this.readString();
		
		returnData[starterTagName] = {
			"type": starterTagId,
			"payload": this.readTagData(starterTagId)
		};
		
		return returnData;
	}
	
	/**
	 * Returns a hex representation of a byte value
	 * 
	 * Intended for values from 0 to 255, but won't show an error for values higher, will merely return more than 2
	 * hex characters. Used in the thrown exceptions.
	 * 
	 * @param {Integer} The number to convert to hex
	 * 
	 * @return {String} Hex representation
	 */
	this.byteToHex = function(number) {
		if (number < 17) {
			return "0" + number.toString(16);
		}
		else {
			return number.toString(16);
		}
	}
	
	/**
	 * Get the tagData associated with the tag type
	 * 
	 * @param {Integer} The tag type of the data we will need to read
	 * 
	 * @return {Object} 
	 */
	this.readTagData = function(tagId) {
		switch (tagId) {
			case this.TAG_End:
				break;
			case this.TAG_Byte:
				return this.readTagData_byte();
				break;
			case this.TAG_Short:
				return this.readTagData_short();
				break;
			case this.TAG_Int:
				return this.readTagData_int();
				break;
			case this.TAG_Long:
				return this.readTagData_long();
				break;
			case this.TAG_Float:
				return this.readTagData_float();
				break;
			case this.TAG_Double:
				return this.readTagData_double();
				break;
			case this.TAG_Byte_Array:
				return this.readTagData_byteArray();
				break;
			case this.TAG_String:
				return this.readTagData_string();
				break;
			case this.TAG_List:
				return this.readTagData_list();
				break;
			case this.TAG_Compound:
				return this.readTagData_compound();
				break;
			default:
				throw new Error("NbtParser.readTagData(): Unknown tag type 0x"+this.byteToHex(tagId)+" encountered. Current pointer position is "+this.pointer+" (0x"+this.pointer.toString(16)+").");
				break;
		}
	}
	
	this.readTagData_byte = function() {
		return this.readByte();
	}
	
	this.readTagData_short = function() {
		return this.readShort();
	}
	
	this.readTagData_int = function() {
		return this.readInt();
	}
	
	this.readTagData_long = function() {
		return this.readLong();
	}
	
	this.readTagData_float = function() {
		return this.readFloat();
	}
	
	this.readTagData_double = function() {
		return this.readDouble();
	}
	
	this.readTagData_byteArray = function() {
		var byteLength = this.readInt();
		var byteString = this.readBuffer(byteLength*8);
		var byteArray = [];

		for (var i = 0; i < byteLength; i++) {
			byteArray.push(byteString.charCodeAt(i) & 0xff);
		}

		return byteArray;
	}
	
	this.readTagData_string = function() {
		return this.readString();
	}
	
	this.readTagData_list = function() {
		var tagId = this.readByte();
		var length = this.readInt();
		var returnArray = new Array();
		
		for (var i = 0; i < length; i++) {
			returnArray.push(this.readTagData(tagId));
		}
		
		return {"ofType": tagId, "list": returnArray};
	}
	
	this.readTagData_compound = function() {
		var returnData = {};
		var tagId;
		var tagName;
		
		
		tagId = this.readByte();
		while (tagId != this.TAG_End) {
			tagName = this.readString();
			returnData[tagName] = {"type": tagId, "payload": this.readTagData(tagId)};
			tagId = this.readByte();
		}
		return returnData;
	}

	/**
	 * Takes a Javascript object and encodes it into NBT data 
	 * 
	 * @param	{String}	data	The object to encode, must be in expected structure
	 * @param	{Bool}		encloseInUnnamedCompoundTag	Whether or not to write the data as enclosed in a unnamed compound tag.
	 * 													It seems that Alpha level chunks do this.
	 * @return	{string}
	 */
	this.encode = function(data, encloseInUnnamedCompoundTag, gzipDeflate) {
		var returnData = "";
		var starterTagId;
		var starterTagName;
		
		if (typeof encloseInUnnamedCompoundTag == "undefined") encloseInUnnamedCompoundTag = false;
		
		var count = 0;
		for (starterTagName in data) {
			count++;
		}
		if (count > 1) {
			throw new Error("NbtParser.encode(): Too many elements in root node, expected 1 but found " + count + ".");
		}
		
		starterTagId = data[starterTagName].type;
		if (starterTagId != this.expectedStartingTag) {
			throw new Error("NbtParser.encode(): Bad starting tag for NBT data, expected 0x"+this.byteToHex(this.expectedStartingTag)+" but got 0x"+this.byteToHex(starterTagId)+".");
		}
		
		if (encloseInUnnamedCompoundTag) {
			returnData += this.writeByte(this.TAG_Compound);
			returnData += this.writeShort(0);
		}  
		returnData += this.writeByte(starterTagId);
		returnData += this.writeString(starterTagName);
		returnData += this.writeTagData(starterTagId, data[starterTagName].payload);
		if (encloseInUnnamedCompoundTag) returnData += this.writeByte(this.TAG_End);
		
		return returnData;
	}

	/**
	 * Generate binary version of data for a tag
	 * 
	 * @param {Integer} tagId	The tag type of the data we will need to read
	 * @param {Object}	data	The data to process
	 * 
	 * @return {Object} 
	 */
	this.writeTagData = function(tagId, data) {
		switch (tagId) {
			case this.TAG_End:
				break;
			case this.TAG_Byte:
				return this.writeTagData_byte(data);
				break;
			case this.TAG_Short:
				return this.writeTagData_short(data);
				break;
			case this.TAG_Int:
				return this.writeTagData_int(data);
				break;
			case this.TAG_Long:
				return this.writeTagData_long(data);
				break;
			case this.TAG_Float:
				return this.writeTagData_float(data);
				break;
			case this.TAG_Double:
				return this.writeTagData_double(data);
				break;
			case this.TAG_Byte_Array:
				return this.writeTagData_byteArray(data);
				break;
			case this.TAG_String:
				return this.writeTagData_string(data);
				break;
			case this.TAG_List:
				return this.writeTagData_list(data);
				break;
			case this.TAG_Compound:
				return this.writeTagData_compound(data);
				break;
			default:
				throw new Error("NbtParser.writeTagData(): Unknown tag type 0x"+this.byteToHex(tagId)+" encountered.");
				break;
		}
	}
	
	this.writeTagData_byte = function(number) {
		return this.writeByte(number);
	}
	
	this.writeTagData_short = function(number) {
		return this.writeShort(number);
	}
	
	this.writeTagData_int = function(number) {
		return this.writeInt(number);
	}
	
	this.writeTagData_long = function(number) {
		return this.writeLong(number);
	}
	
	this.writeTagData_float = function(number) {
		return this.writeFloat(number);
	}
	
	this.writeTagData_double = function(number) {
		return this.writeDouble(number);
	}
	
	this.writeTagData_byteArray = function(byteArray) {
		var returnString = '';
		for (
			var i=0;
			i<byteArray.length;
			returnString += this.writeByte(byteArray[i++])
		);

		return this.writeInt(returnString.length) + returnString;
	}
	
	this.writeTagData_string = function(string) {
		return this.writeString(string);
	}
	
	this.writeTagData_list = function(data) {
		var ofTagId = data.ofType;
		var length = data.list.length;
		var returnData = "";

		for (var i in data.list) {
			returnData += this.writeTagData(ofTagId, data.list[i]);
		}
		
		return this.writeByte(ofTagId) + this.writeInt(length) + returnData;
	}
	
	this.writeTagData_compound = function(data) {
		var returnData = "";
		
		for (var tagName in data) {
				returnData += this.writeByte(data[tagName].type);
				returnData += this.writeString(tagName);
				returnData += this.writeTagData(data[tagName].type, data[tagName].payload);
			if (data[tagName].type != this.TAG_Float && data[tagName].type != this.TAG_Double) {
			}
		}
		returnData += this.writeByte(this.TAG_End);
		return returnData;
	}
}
