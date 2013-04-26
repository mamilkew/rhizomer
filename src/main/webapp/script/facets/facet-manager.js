facet.FacetManager = function (uri, inVariable){
	var self = this;
	
	/**
	 * Private Attributes
	 */
	var typeUri = uri;
	var variable = inVariable;
	var facets = {};
	var facetIds = {};
	var selectedFacets = {};
	var defaultFilters = {};
	var defaultLabels = {};
	var pivotedFacets = {};
	var label = makeLabel(uri);
    var numInstances = 0;

	self.getVariable = function(){
		return variable;
	};
	
	self.getTypeUri = function(){
		return typeUri;
	};
	
	self.getLabel = function(){
		return label;
	};

    self.setNumInstances = function(inNumInstances){
        numInstances = inNumInstances;
    };
	
	self.needsToPrint = function(){
		if(!$j.isEmptyObject(selectedFacets))
			return true;
		else
			return false;
	};
	
	self.getNavigableFacets = function(){
		var navigableFacets = {};
		for(f in facets){
			if(facets[f].isNavigable())
				navigableFacets[f] = facets[f];
		}
		return navigableFacets;
	};

    self.getPivotedFacets = function(){
      return pivotedFacets;
    };
	
	self.addPivotedFacet = function(propertyURI, range, pivotedVar){
        var obj = {};
        obj.range = range;
        obj.pivotedVar = pivotedVar;
		pivotedFacets[propertyURI] = obj;
	};

    self.addPivotedInverseFacet = function(propertyURI, range, pivotedVar){
        var obj = {};
        obj.range = range;
        obj.pivotedVar = pivotedVar;
        pivotedFacets[propertyURI+range] = obj;
    };

    self.deletePivotedFacet = function(propertyURI){
        delete(pivotedFacets[propertyURI]);
    }

    self.deletePivotedFacet = function(propertyURI, range){
		delete(pivotedFacets[propertyURI+range]);
	}

    self.getFacet = function (propertyURI){
        return facets[propertyURI];
    };

	self.getFacet = function (propertyURI, range){
		return facets[propertyURI+range];
	};
	
	self.getFacetById = function (id){
		return facets[facetIds[id]];
	};
	
	self.getUriById = function (id){
		return facets[facetIds[id]].getUri();
	};
	
	/*
	self.makeUrl = function(){
		if(!$j.isEmptyObject(selectedFacets)){
			//var url = "&f=";
			var url = "";
			for(f in selectedFacets){
				for(key in selectedFacets[f]){
					prefix = prefixes[getPrefix(facets[facetIds[f]].getUri())];
					url += encodeURIComponent(facets[facetIds[f]].getUri());
					value = selectedFacets[f][key];
					url += "/"+encodeURIComponent(value.uri)+"/";
				}			
			}
			return url;
		}
		else
			return "";
	};
	*/	
	
	self.setDefaultFilters = function(){
		restrictions = parser.getRestrictions();
		for(i=0; i<restrictions.length; i++){
			if(restrictions[i][0]!=null){
				property = restrictions[i][1].replace('<','').replace('>','');
				if(!property.startsWith("http://")){
					tmp = property.split(":");
					prefix = inverse_prefixes[tmp[0]];
					property = prefix+tmp[1];
				}
				for(x=0;x<restrictions[i][3].length;x++){					
					value = restrictions[i][3][x];
					self.filterInitProperty(property, value);
				}
			}
		}
	};
	
	self.addFacet = function(property){
        if(property.isInverse == "true"){
            facets[property.uri+property.range] = facet.InverseFacet(property, self.getVariable(), typeUri);
            facetIds[hex_md5(property.uri+property.range)] = property.uri+property.range;
        }
        else{
            facets[property.uri] = facet.StringFacet(property, self.getVariable(), typeUri);
            facetIds[hex_md5(property.uri)] = property.uri;
        }

		/*
		if(property.type == NS.xsd("integer"))
			facets[property.uri] = facet.NumberFacet(property, self.getVariable(), typeUri);
		else if(property.type == NS.xsd("string"))
			facets[property.uri] = facet.StringFacet(property, self.getVariable(), typeUri);
		else
			facets[property.uri] = facet.StringFacet(property, self.getVariable(), typeUri);
		*/	
		
	};
	
	self.renderFacets = function(target){
		html = "<div class='filter_by'>Filter <strong>"+label+"</strong> by:</div>";
		html += "<div class='reset_facets'><a href=''>Reset filters</a></div>";
        html += "<div class='facet_list'>";
		$j("#"+target).html(html);		
		for(f in facets){
			facets[f].render(target);
		}
        $j("#"+target).append("</div>");
	};
	
	self.toggleFacet = function(id) {
		self.getFacetById(id).toggleFacet();
	};
	
	self.filterInitProperty = function(propertyUri, propertyValue){
		var facet = facets[propertyUri];
		facet.addInitValue(propertyValue);
		var vlabel = makeLabel(propertyValue);
		var fvalue = new FacetValue(propertyValue, vlabel, 0);
		if(selectedFacets[propertyUri]){
			selectedFacets[propertyUri][propertyValue] = fvalue;
		}
		else{
			selectedFacets[propertyUri] = {};
			selectedFacets[propertyUri][propertyValue] = fvalue;
		}
	};
	
	self.setSelectedFacetLabel = function(facetID, propertyValue, propertyLabel){
		selectedFacets[facetID][propertyValue].setLabel(propertyLabel);
	};
	
	self.filterProperty = function(facetID, propertyValue, vlabel){
		var facet = facets[facetIds[facetID]];
		valueReturn = facet.toggleValue(propertyValue);
		if(selectedFacets[facetID]){
			if(valueReturn){
				selectedFacets[facetID][propertyValue] = valueReturn;
			}
			else{
				delete(selectedFacets[facetID][propertyValue]);
				if($j.isEmptyObject(selectedFacets[facetID])){
					delete(selectedFacets[facetID]);
				}
			}
		}
		else{
			if(vlabel)
				valueReturn = new FacetValue(propertyValue, vlabel, 0);
			selectedFacets[facetID] = {};
			selectedFacets[facetID][propertyValue] = valueReturn;
		}
		facet.setSelected(true);
		facetBrowser.reloadFacets();
		facet.setSelected(false);
		//facetBrowser.printActive();
        facetBrowser.printBreadcrumbs();
	};

    /*
	self.printActiveInit = function(){
		$j("#active_facets").empty();
		if(!$j.isEmptyObject(selectedFacets)){
			$j("#active_facets").append("<div>Your filters:</div>");
			for(f in selectedFacets){
				html = "<div class=\"selected_facet\"><span>"+facets[facetIds[f]].getLabel()+"</span>";
				html += "<ul id=\""+facets[facetIds[f]].getId()+"_active\">";
				html += "</ul></div>";
				$j("#active_facets").append(html);
			}
			
			for(f in selectedFacets){
				facets[facetIds[f]].printInitActiveLabels();
			}
		}
	};
	*/
	
	self.printActive = function(main){
        console.log(label);
        console.log(self.getPivotedFacets());
		if(main){
            var numResults = facetBrowser.getNumResults();
			var html = "Showing "+numResults+" <b>"+label+"</b> filtered from "+numInstances + " ";
        }
		else
			var html = "<a href=\"javascript:facetBrowser.pivotFacet('','','"+typeUri+"');\">"+label+"</a> ";
		if(!$j.isEmptyObject(selectedFacets)){
			html += "where "			
			var x=0;
			for(f in selectedFacets){
				if(x>0)
					html += " and ";
				html += "<b>"+facets[facetIds[f]].getLabel()+"</b> is ";
				var i=0;
				for(key in selectedFacets[f]){
					if(i>0)
						html += " or ";
					value = selectedFacets[f][key];
                    html += "<b>"+value.label+"&nbsp;</b>"
					html += "<a class=\"pointer\" onclick=\"javascript:facetBrowser.removeProperty('"+typeUri+"','"+f+"','"+value.uri+"'); return false;\"><img src='/images/delete_blue.png'/></a>";
					i++;
				}
				x++;
			}
		}
		return html;
	};

	
	self.reloadFacets = function(){
        var constraints = facetBrowser.makeRestrictions();
		var query = "SELECT DISTINCT ?"+variable+" "+
			"WHERE { "+
			"?"+variable+" a <"+typeUri+"> . ";
		query += constraints;
		query += "}";
		//alert(query);
		rhz.listResourcesNoHistory(query);
		self.reloadProperties();
	};	
	
	self.reloadProperties = function(){
		var f;
		for(f in facets){
			restrictions = facetBrowser.makeRestrictions(f);
			if(facets[f].isOpened() && !facets[f].isSelected()){
					facets[f].reloadValues(restrictions);
			}
			facets[f].setSelected(false);
		};
	};	
	
	/**SPARQL Queries**/
	
	self.makeRestrictions = function(uri){
		var f;
		var query = "";
		var varCount2 = 0;
		for(f in facets){
			if(facets[f].isActive() && f != uri){
				query += facets[f].makeSPARQL(varCount2, variable);
				varCount2++;
			}
		}
		for(m in pivotedFacets) {
            if (facets[m].isInverse())
                query += " ?"+pivotedFacets[m].pivotedVar+" <"+facets[m].getUri()+"> ?"+variable+" .";
            else
                query += " ?"+variable+" <"+facets[m].getUri()+"> ?"+pivotedFacets[m].pivotedVar+" .";
            query += " ?"+variable+" a <"+typeUri+"> .";
		}
		return query;
	};	
	
	self.makeSPARQL = function(){
		return activeManager.makeSPARQL();
	};
	
	self.loadFacets = function(){
		facets = {};
		$j("#facets").html("<p style=\"font-weight:bold\">Loading filters...</p>");
		$j("#facets").append("<img class='waitImage' src=\"images/black-loader.gif\"/>");
		parameters = {};
		parameters["facetURI"] = typeUri;
		parameters["mode"] = "facets";
		rhz.getFacets(parameters, 
				function(output) 
				{
					var response = JSON.parse(output);
                    numInstances = response.numInstances;
					$j.each(response.properties, 
						function(i, property)
						{
							self.addFacet(property);
						});
					self.renderFacets("facets");
					addToggle();  
					self.reloadFacets();
					facetBrowser.printRelated();
				}
		);
	};
	
	return self;
};
