var facet;
facet = {};
//var activeURI;
var fm;
var facetBrowser;

facet.FacetBrowser = function(inParser){
	var self = this;
	var parser = inParser;
	var managers = {};
	var vars_uris = {};
	var activeManager = null;
	var mainManager = null;
	var varCount = 1;
	var autoCompleteProperty = null;
	var activeLabel = null;
	
	self.loadFacets = function(){
		parser.parse();
		activeURI = parser.getActiveUri();
		activeVar = parser.getVariable();
		self.addManager(activeURI, "", activeVar);
		mainManager = managers[activeURI].manager;
		activeManager = managers[activeURI].manager;
		$j("#facets").html("<p style=\"font-weight:bold\">Loading filters...</p>");
		$j("#facets").append("<img id='waitImage' src=\"images/black-loader.gif\"/>");	
		parameters = {};
		parameters["facetURI"] = activeURI;
		activeLabel = makeLabel(activeURI);
		parameters["mode"] = "facets";
		rhz.getFacets(parameters, 
				function(output) 
				{
					var response = output.evalJSON();		
					$j.each(response.properties, 
						function(i, property)
						{
							managers[activeURI].manager.addFacet(property);
						});
					managers[activeURI].manager.renderFacets("facets");
					addToggle();
					self.setDefaultFilters();
					managers[activeURI].manager.reloadFacets();
					fm = managers[activeURI].manager;
					self.printActiveFilters();
					self.printRelated();
				}
		);
	};
	
	self.getActiveManager = function(){
		return activeManager;
	}
	
	self.getManager = function(uri){
		return managers[uri].manager;
	};
	
	self.getMainManager = function(){
		return mainManager;
	};
	
	self.setDefaultFilters = function(){
		restrictions = parser.getRestrictions();
		for(i=0; i<restrictions.length; i++){
			if(restrictions[i][0]!=null){
				property = restrictions[i][1].replace('<','').replace('>','');
				if(!property.startsWith("http://")){
					var tmp = property.split(":");
					var prefix = inverse_prefixes[tmp[0]];
					var property = prefix+tmp[1];
				}
				for(x=0;x<restrictions[i][3].length;x++){
					var variable = restrictions[i][0];
					var value = restrictions[i][3][x];
					self.filterInitProperty(variable, property, value);
				}
			}
		}
	};
	
	self.toggleFacet = function(id){
		activeManager.toggleFacet(id);
	};
	
	self.filterProperty = function(propertyUri, propertyValue, vlabel){
		activeManager.filterProperty(propertyUri, propertyValue, vlabel);
	};
	
	self.removeProperty = function(typeUri, propertyUri, propertyValue, vlabel){
		managers[typeUri].manager.filterProperty(propertyUri, propertyValue, vlabel);
	};
	
	self.reloadFacets = function(){
		activeManager.reloadFacets();
	};
	
	self.deletePivotFacet = function(range){
		delete(managers[range]);
		activeURI = mainManager.getTypeUri();
		activeManager = mainManager;
		//TODO: Missing property URI
		// mainManager.deletePivotedFacet(uri);
		activeManager.renderFacets("facets");		
		mainManager.reloadFacets();
		self.printActive();
	};
	
	self.printActiveFilters = function(){
		activeManager.printActiveInit();
	};
	
	self.filterInitProperty = function(variable, property, value){
		uri = vars_uris[variable];
		managers[uri].manager.filterInitProperty(property,value);
	};
	
	self.addManager = function(range, propertyURI, variable){
		var obj = {};
        obj.range = range;
        obj.propertyURI = propertyURI;
        obj.manager = new facet.FacetManager(range, variable);
        managers[range] = obj;
		//managers[range] = new facet.FacetManager(range, variable);
		vars_uris[variable] = range;
		varCount++;
	};
	
	self.makeRestrictions = function(uri){
		var query = "";
		for(var m in managers){
			query += managers[m].manager.makeRestrictions(uri);
		}
		return query;
	};
	
	self.printActive = function(){
		$j("#active_facets").empty();
		$j("#active_facets").append("<span><a href=\"\">Reset all filters[x]</a></span><br/><br/>");
		var html = mainManager.printActive(true);
		for(m in managers){
			if(managers[m].manager!=mainManager){
				html += "<br/>has "+makeLabel(managers[m].propertyURI, false)+" ";
				html += managers[m].manager.printActive(false);
				
			}
		}
		$j("#active_facets").append(html);
	};
	
	self.printRelated = function(){
		$j("#related").html("<h4>Navigate to:</h4><ul>");
		var html = "";
		var navigableFacets = mainManager.getNavigableFacets();
		for(f in navigableFacets){
			if(!navigableFacets[f].isInverse() && $j.isEmptyObject(managers[f]))
				html += "<li><a href=\"javascript:facetBrowser.pivotFacet('','"+navigableFacets[f].getUri()+"','"+navigableFacets[f].getRange()+"');\">"+navigableFacets[f].getLabel()+"</a></li>";
		}
		for(m in managers){
			if(managers[m].manager!=mainManager)
				html += "<li><a href=\"javascript:facetBrowser.pivotFacet('','','"+m+"');\">"+managers[m].manager.getLabel();+"</a></li>";
		}
		html += "</ul>";
		$j("#related").append(html);
	};
	
	self.setAutoCompleteProperty = function(id){
		autoCompleteProperty = activeManager.getUriById(id);
	};
	
	self.getAutoCompleteProperty = function(){
		return autoCompleteProperty;
	};
	
	self.pivotFacet = function(classURI, propertyURI, range){
		if(managers[range]){
			activeManager = managers[range].manager;
			activeManager.renderFacets("facets");
			activeManager.reloadFacets();
			mainManager = activeManager;
			self.printRelated();
		}
		else{	        
			activeManager.addPivotedFacet(propertyURI, range, "r"+varCount);
			self.addManager(range, propertyURI, "r"+varCount);
			activeURI = range;
			activeManager = managers[range].manager;
			activeManager.loadFacets();
			mainManager = activeManager;
		}
		self.printActive();
	};
	
	self.inversePivotFacet = function(inverseClassUri, propertyUri, propertyRange){
		self.addManager(inverseClassUri, propertyUri, "r"+varCount);
		activeURI = inverseClassUri;
		var variable = activeManager.getVariable();
		activeManager = managers[inverseClassUri].manager;
		mainManager = managers[inverseClassUri].manager;
		activeManager.addPivotedFacet(propertyUri, propertyRange, variable);
		activeManager.loadFacets();
		self.printActive();
	};	
	
	return self;
};
