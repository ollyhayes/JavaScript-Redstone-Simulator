/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * 
 */

com.mordritch.mcSim.World_Schematic = function(schematic, defaultSizeX, defaultSizeY, defaultSizeZ) {
	this.schematic = schematic;
	this.defaultSizeX = defaultSizeX;
	this.defaultSizeY = defaultSizeY; 
	this.defaultSizeZ = defaultSizeZ;
	this.loadedTileEntities = {}; 
	
	this.construct = function() {
		if (this.schematic == null) {
			this.makeNew(this.defaultSizeX, this.defaultSizeY, this.defaultSizeZ);
		}
		else {
			//Not all programs export TileTicks with schematics (EG: MCEdit), if there is no TileTicks NBT node, this creates it
			if (typeof this.schematic.Schematic.payload.TileTicks == 'undefined')
				this.schematic.Schematic.payload.TileTicks =
					{
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					}; 
		}
	}
	
	/**
	 * Makes this instantiation generate and use a new schematic filled with air
	 */
	this.makeNew = function(sizeX, sizeY, sizeZ) {
		var blockByteArray = [];
		var dataByteArray = [];
		
		for (var i = 0; i < sizeX*sizeY*sizeZ; i++) {
			blockByteArray.push(0);
			dataByteArray.push(0);
		}
		 
		this.schematic = {
			Schematic: {
				type: 10,
				payload: {
					Height: {
						type: 2, 
						payload: sizeY
					},
					Length: {
						type: 2,
						payload: sizeZ
					},
					Width: {
						type: 2,
						payload: sizeX
					},
					Entities: {
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					},
					TileEntities: {
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					},
					TileTicks: {
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					},
					Materials: {
						type: 8,
						payload: "Alpha"
					},
					Blocks: {
						type: 7,
						payload: blockByteArray
					},
					Data: {
						type: 7,
						payload: dataByteArray
					}
				}
			}
		};
	}

	/**
	 * Returns position within the bytearray derived from minecraft coordinates
	 * 
	 * Since BlockId and meta data layout are the same, we can use a common function
	 * to calculate the offset for both.
	 * 
	 * The overrideSize parameters are used by the setSize function.
	 * 
	 * @param	{Integer}	x				In terms of minecraft co-ordinate system
	 * @param	{Integer}	y				In terms of minecraft co-ordinate system
	 * @param	{Integer}	z				In terms of minecraft co-ordinate system
	 * @param	{Integer}	overrideSizeX	(Optional) Use this size instead of the schematics size
	 * @param	{Integer}	overrideSizeY	(Optional) Use this size instead of the schematics size
	 * @param	{Integer}	overrideSizeZ	(Optional) Use this size instead of the schematics size 
	 * @return	{Integer}					The offset of the byte
	 */
	this.getPosition = function(x, y, z, overrideSizeX, overrideSizeY, overrideSizeZ) {
		/*
		The Minecraft coordinate system is as follows:
		(http://www.minecraftwiki.net/wiki/Alpha_Level_Format/Chunk_File_Format#Block_Format)

		X 			increases East, decreases West
		Y 			increases upwards, decreases downwards
		Z			increases South, decreases North
		*/
		
		var schematicSizeX = this.schematic.Schematic.payload.Width.payload;
		var schematicSizeY = this.schematic.Schematic.payload.Height.payload;
		var schematicSizeZ = this.schematic.Schematic.payload.Length.payload;
		
		if (typeof overrideSizeX != "undefined") schematicSizeX = overrideSizeX;
		if (typeof overrideSizeY != "undefined") schematicSizeY = overrideSizeY;
		if (typeof overrideSizeZ != "undefined") schematicSizeZ = overrideSizeZ; 
		
		if (x >= schematicSizeX || x < 0)
			throw new Error("DataSchematic.getPosition(): x is out of bounds.")
		
		if (y >= schematicSizeY || y < 0)
			throw new Error("DataSchematic.getPosition(): y is out of bounds.")
		
		if (z >= schematicSizeZ || z < 0)
			throw new Error("DataSchematic.getPosition(): z is out of bounds.")
		
		return x + (z * schematicSizeX) + (y * schematicSizeX * schematicSizeZ);
	}
	
	/**
	 * Returns the blockID at specified minecraft world co-ordinates
	 */
	this.getBlockId = function(x, y, z) {
		//If a function calls for a blocktype which is off the grid, return 0 (air)
		if (
			x >= this.getSizeX() || x < 0
			|| y >= this.getSizeY()	|| y < 0
			|| z >= this.getSizeZ()	|| z < 0
		) {
			return 0;
		}
		else {
			return this.schematic.Schematic.payload.Blocks.payload[this.getPosition(x,y,z)];
		}
	}
	
	/**
	 * Returns the meta data for block at specified minecraft world co-ordinates
	 */
	this.getBlockMetadata = function(x, y, z) {
		//If a function calls for a blocktype which is off the grid, return 0
		if (
			x >= this.getSizeX() || x < 0
			|| y >= this.getSizeY()	|| y < 0
			|| z >= this.getSizeZ()	|| z < 0
		) {
			return 0;
		}
		else {
			return this.schematic.Schematic.payload.Data.payload[this.getPosition(x,y,z)];
		}
	}

	/**
	 * Sets a block and its metadata to specified values 
	 */
	this.setBlockAndMetadata = function(x, y, z, blockID, metadata) {
		this.setBlockID(x, y, z, blockID);
		this.setBlockMetadata(x, y, z, metadata);
	}

	this.setBlockID = function(x, y, z, blockID) {
		if (blockID > 0xff || blockID < 0x00) throw new Error("World_Schematic.setBlockId(): value must be from 0 to 255.");
		var position = this.getPosition(x, y, z);
		this.schematic.Schematic.payload.Blocks.payload[position] = blockID; 
	}
	
	this.setBlockMetadata = function(x, y, z, blockMetadata) {
		if (blockMetadata > 0xf || blockMetadata < 0x00) throw new Error("World_Schematic.setBlockMetadata(): value must be from 0 to 127.");
		var position = this.getPosition(x, y, z);
		this.schematic.Schematic.payload.Data.payload[position] = blockMetadata;
	}

	/**
	 * Sets a block and its metadata to specified values and resizes the schematic if values fall out of bounds
	 * 
	 * @param x
	 * @param y
	 * @param z
	 * @param blockID
	 * @param metadata
	 *
	 */
	this.forceSetBlockAndMetadata = function(x, y, z, blockID, metadata) {
		if (
			x < 0 ||
			y < 0 ||
			z < 0 ||
			x > this.getSizeX() -1 ||
			y > this.getSizeY() -1 ||
			z > this.getSizeZ() -1
		) {
			this.setDimensions(
				// if dimension is greater than or equal to the total size of the
				// schematic then set the size of the schematic to match; if not
				// get the current size of the schematic and add the inverse of the
				// dimension if the dimension is less than zero
				x >= this.getSizeX() ? x + 1 : this.getSizeX() + (x < 0 ? x * -1 : 0),
				y >= this.getSizeY() ? y + 1 : this.getSizeY() + (y < 0 ? y * -1 : 0),
				z >= this.getSizeZ() ? z + 1 : this.getSizeZ() + (z < 0 ? z * -1 : 0),
				// offset the schematic to the inverse of the dimension if
				// the dimension is less than zero
				x < 0 ? x * -1 : 0,
				y < 0 ? y * -1 : 0,
				z < 0 ? z * -1 : 0
			);
		}
		// because we've already offset the schematic we'll now
		// reset any dimensions below zero
		if ( x < 0 ) x = 0;
		if ( y < 0 ) y = 0;
		if ( z < 0 ) z = 0;
		this.setBlockAndMetadata(x, y, z, blockID, metadata);
	}
	
	/**
	 * Change the dimensions of the schematic
	 * 
	 * One can use the offset to decide where the old data will be in relation
	 * to the updated size
	 * 
	 * It's important that tileEntities, entities and tickdata are dumped from the world into the schematic
	 * before processing so that their coordinates can be updated accordingly
	 */
	this.setDimensions = function(sizeX, sizeY, sizeZ, offsetX, offsetY, offsetZ) {
		var oldBlocksArray = this.schematic.Schematic.payload.Blocks.payload;
		var oldDataArray = this.schematic.Schematic.payload.Data.payload;
		var oldSizeX = this.schematic.Schematic.payload.Width.payload;
		var oldSizeY = this.schematic.Schematic.payload.Height.payload;
		var oldSizeZ = this.schematic.Schematic.payload.Length.payload;
		
		this.schematic.Schematic.payload.Blocks.payload = [];
		this.schematic.Schematic.payload.Data.payload = [];
		this.schematic.Schematic.payload.Width.payload = sizeX;
		this.schematic.Schematic.payload.Height.payload = sizeY;
		this.schematic.Schematic.payload.Length.payload = sizeZ;
		
		//Migrate blocks and data:
		var newOffSet = 0;
		for (var iy = 0; iy < sizeY; iy++) {
			for (var iz = 0; iz < sizeZ; iz++) {
				for (var ix = 0; ix < sizeX; ix++) {
					//For loops deliberately nested such that getPosition would increment normally
					if (
						ix - offsetX >= 0 && ix - offsetX < oldSizeX
						&&
						iy - offsetY >= 0 && iy - offsetY < oldSizeY
						&&
						iz - offsetZ >= 0 && iz - offsetZ < oldSizeZ
					) {
						var oldOffSet = this.getPosition(ix-offsetX, iy-offsetY, iz-offsetZ, oldSizeX, oldSizeY, oldSizeZ);

						this.schematic.Schematic.payload.Blocks.payload[newOffSet] = oldBlocksArray[oldOffSet];
						this.schematic.Schematic.payload.Data.payload[newOffSet] = oldDataArray[oldOffSet];
					}
					else {
						//out of range, set it to blank
						this.schematic.Schematic.payload.Blocks.payload[newOffSet] = 0;
						this.schematic.Schematic.payload.Data.payload[newOffSet] = 0;
					}
					newOffSet++;
				}
			}
		}
		
		//Migrate tile entities
		var tileEntities = this.schematic.Schematic.payload.TileEntities.payload.list;
		for (var i = 0; i < tileEntities.length; i++) {
			tileEntities[i].x.payload = tileEntities[i].x.payload + offsetX;
			tileEntities[i].y.payload = tileEntities[i].y.payload + offsetY;
			tileEntities[i].z.payload = tileEntities[i].z.payload + offsetZ;
		}
		
		//Migrate entities
		var entities = this.schematic.Schematic.payload.Entities.payload.list;
		for (var i = 0; i < entities.length; i++) {
			entities[i].pos.payload[0] = entities[i].pos.payload[0] + offsetX;
			entities[i].pos.payload[1] = entities[i].pos.payload[1] + offsetX;
			entities[i].pos.payload[2] = entities[i].pos.payload[2] + offsetX;
		}
		
		//Migrate tick data
		var tileTicks = this.schematic.Schematic.payload.TileTicks.payload.list;
		for (var i = 0; i < tileTicks.length; i++) {
			tileTicks[i].x.payload = tileTicks[i].x.payload + offsetX;
			tileTicks[i].y.payload = tileTicks[i].y.payload + offsetY;
			tileTicks[i].z.payload = tileTicks[i].z.payload + offsetZ;
		}
	}
	
	/**
	 * Returns the x size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeX = function() {
		return this.schematic.Schematic.payload.Width.payload;
	}
	
	/**
	 * Returns the y size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeY = function() {
		return this.schematic.Schematic.payload.Height.payload;
	}
	
	/**
	 * Returns the z size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeZ = function() {
		return this.schematic.Schematic.payload.Length.payload;
	}
	
	/**
	 * @return {Array}	All TileEntities as an array of NBT objects
	 */
	this.getTileEntities = function() {
		return this.schematic.Schematic.payload.TileEntities.payload.list;
	}
	
	/**
	 * @param	tileEntities	All TileEntities as an array of NBT objects
	 */
	this.setTileEntities = function(tileEntities) {
		this.schematic.Schematic.payload.TileEntities.payload.payload = tileEntities;
	}
	
	/**
	 * @return {Array}	All TileTicks as an array of NBT objects
	 */
	this.getTickData = function() {
		return this.schematic.Schematic.payload.TileTicks.payload.list;
	}
	
	/**
	 * @param	tileTicks	All TileTicks as an array of NBT objects
	 */
	this.setTickData = function(tileTicks) {
		this.schematic.Schematic.payload.TileTicks.payload.payload = tileTicks;
	}
	
	/**
	 * @return {Array}	All Entities as an array of NBT objects
	 */
	this.getEntities = function() {
		return this.schematic.Schematic.payload.Entities.payload.list;
	}
	
	/**
	 * @param	entities	All Entities as an array of NBT objects
	 */
	this.setEntities = function(entities) {
		this.schematic.Schematic.payload.Entities.payload.payload = entities;
	}
	
	/**
	 * Removes internal reference to the schematic object allowing it to be freed by the garbage collector.
	 * 
	 * We can't force freeing of memory in Javascript, but as long as there is no referrence to the object
	 * then the garbage collector should eventually free it up. 
	 */
	this.destroy = function() {
		delete this.schematic;
	}
    
	/**
	 * @param x
	 * @param y
	 * @param z
	 * @return object containing values x, y, z representing the chunk position
	 */
	this.getBlockChunkPosition = function(x, y, z){
		x = Math.floor( x / 16 );
		y = Math.floor( y / 16 );
		z = Math.floor( z / 16 );
		return {
	  		x: x,
	  		y: y,
	  		z: z
	  	};
	}

	this.construct();	
}
