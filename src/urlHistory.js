/*
 * JavaScript Redstone Simulator
 * Copyright (C) 2012  Jonathan Lydall (Email: jonathan.lydall@gmail.com)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA. 
 * 
 */

(function(){
	var namespace = com.mordritch.mcSim;
	
	var urlHistory = function(_gui) {
		var _historyApiSupport = !!(window.history && history.pushState);
		var _schematicId = null;
		//var _confirmationModal = new nameSpace.modal(gui);
		
		var isIntVal = function(val) {
			return !!(parseInt(val, 10) == val && parseInt(val, 10));
		};

		var construct = function() {
			if (!_historyApiSupport) {
				initHashChange();
			}
			else {
				initHistoryApi();
			}
			
			if (isIntVal(_schematicId) && _schematicId > 0) {
				onSchematicIdChange_accepted(_schematicId);
			}
		};
		
		var getTitle = function() {
			return $('title').text(); //Can be customized to have something appended to the end.
		};
		
		var initHashChange = function() {
			$(window).hashchange(function() {
				var hash = location.hash.replace( /^#/, '' );
				if (isIntVal(hash)) {
					onSchematicIdChange(hash);
				}
			});
			
			var hash = location.hash.replace( /^#/, '' );
			if (isIntVal(hash)) {
			 	_schematicId = hash;
			}
		};
		
		var initHistoryApi = function() {
			var hash = location.hash.replace( /^#/, '' );
			if (isIntVal(hash)) {
				_schematicId = hash;
				self.setSchematicId(hash);
			}
			else {
				_schematicId = window.schematicIdToOpen;
			}
			
			self.setSchematicId(_schematicId, useReplaceState = true);

			window.addEventListener('popstate', function(event) {
				if (event.state == null) {
					return false;
				}
				
				if (typeof event.state != 'undefined' && event.state != null) {
					onSchematicIdChange(event.state.id);
				}
			});
		};
		
		this.onUrlClick = function(event) {
			if (_historyApiSupport) {
				event.preventDefault();
				var schematicId = $(event.target).data('id');
				self.setSchematicId(schematicId);
			}
		};
		
		this.generateUrl = function(schematicId) {
			return (_historyApiSupport) ? "./"  + schematicId : "./#" + schematicId;
		};
		
		this.getIdToOpen = function() {
			return _schematicId;
		};
		
		this.setSchematicId = function(schematicId, useReplaceState, noChange) {
			useReplaceState = (typeof useReplaceState != 'undefined') ? useReplaceState : false;
			if (schematicId == null || schematicId == -1) schematicId = "";
			
			if (_historyApiSupport) {
				if (useReplaceState) {
					history.replaceState({id: schematicId}, getTitle(), "./"+schematicId);
				}
				else {
					history.pushState({id: schematicId}, getTitle(), "./"+schematicId);
					if (!noChange) {
						onSchematicIdChange(schematicId);
					}
				}
			}
			else {
				window.location.hash = schematicId;
			}
		};
		
		
		var onSchematicIdChange = function(schematicId) {
			onSchematicIdChange_accepted(schematicId); //TODO: Perhaps have a confirmation modal show first.
		};
		
		var onSchematicIdChange_accepted = function(schematicId) {
			var pathname = window.location.pathname;
			var url = (window.location.hash == "" || window.location.hash == "#") ? pathname : pathname + schematicId;
			
			if (typeof window._gac != "undefined") {
				window._gac.push(['_trackPageview', url]);
			}
			
			if (typeof schematicId != "undefined" && schematicId != null && schematicId != "") {
				_gui.loadSchematicId(schematicId);
			}
		};
		
		var onSchematicIdChange_declined = function(schematicId) {
			
		};
		
		var self = this;
		construct();
	};

	namespace.urlHistory = urlHistory;
}());
