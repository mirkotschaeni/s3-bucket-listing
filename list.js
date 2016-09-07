// see https://github.com/mirkotschaeni/s3-bucket-listing 

// TODO 
// * reenable paging support
// * reenable sub path listing
// * clean up


var parameters = parseQueryString();
var path="";
if (parameters.prefix) {
	path = parameters.prefix;
}

function parseQueryString() {
	var parameters = {};
	var queryString = location.search.replace("?", "");
	var keyValuePairs = queryString.split("&");
	for (var i=0; i<keyValuePairs.length; i++) {
		var elements = keyValuePairs[i].split("=");
		if (elements.length == 2) {
			parameters[elements[0]] = elements[1];
		}
	}
	return parameters;	
}

function readListing(path) {
	// expects json with bucketName and bucketUrl keys
	$.get("listOptions.json").then(function(cfg) {
		console.log("list Options: " + cfg + " " + (typeof cfg));
		
		var url = cfg.bucketUrl + "?delimiter=/"
		if (path) {
			url = url + "&prefix=" + path;
		}
	
		var displayPath = "/" + path;
		document.title = displayPath;
		var displayPathElements = displayPath.split("/");
	
		var headingHtml = "<a href='/index.html'>" + cfg.bucketName + "<a>";
		var currentPrefix = "";
		for (var i=0; i<displayPathElements.length; i++) {
			var displayPathElement = displayPathElements[i].trim();
			if (displayPathElement.length == 0) {
				continue;
			}
			currentPrefix += displayPathElement + "/";
			headingHtml += " / <a href='/index.html?prefix=" + currentPrefix + "'>"  + displayPathElement + "<a>";
		}
	
		document.getElementById("heading").innerHTML = headingHtml;
	
		$.get(url).done(function(data) {
			var xml = $(data);
			var info = getInfoFromS3Data(xml);
			window.ginfo = info;
	
			for(var i=0; i<info.objects.length;i++) {
				var object = info.objects[i];
				if (object.key == "index.html") continue;
				if (object.key == "list.js") continue;
				if (object.key == "listOptions.json") continue;
				var tr = document.createElement("tr");
				var iconTd = document.createElement("td");
				if (object.type == "file") {
					iconTd.innerHTML = "<span class=\"glyphicon glyphicon-file\" aria-hidden=\"true\"></span>"
				} else if (object.type == "directory") {
					iconTd.innerHTML = "<span class=\"glyphicon glyphicon-folder-open\" aria-hidden=\"true\"></span>"
				}
				tr.appendChild(iconTd);
				var nameTd = document.createElement("td");
				var name = object.key.substring(path.length).replace("/", "");
				var href = "";
				if (object.type == "file") {
					href = cfg.bucketUrl + "/" + object.key;
	
				} else if (object.type == "directory") {
					href = "index.html?prefix=" + object.key;
				}
	 			nameTd.innerHTML = "<a href='" + href + "'>" + name + "</a>";
				tr.appendChild(nameTd);
				var modifiedTd = document.createElement("td");
				modifiedTd.innerHTML = object.lastModified;					
				tr.appendChild(modifiedTd);			
				var sizeTd = document.createElement("td");
				sizeTd.innerHTML = object.size;
				tr.appendChild(sizeTd);				
	
				document.getElementById("objectContainer").appendChild(tr);
			}
		}).fail(function(error) {
			console.error(error);
		});		
	}).fail(function(error) {
		console.error(error);
	});
	

}

function objectComparator(o1, o2) {
	var s1 = o1.key.toLowerCase();
	var s2 = o2.key.toLowerCase();
	
	if (s1 < s2) return -1;
	if (s1 > s2) return 1;
	return 0;
}

function getInfoFromS3Data(xml) {
  var files = $.map(xml.find('Contents'), function(item) {
	item = $(item);
	var lastModifiedDate = new Date(Date.parse(item.find('LastModified').text()));
	return {
	  key: item.find('Key').text(),
	  lastModified: lastModifiedDate.toString(),
	  size: bytesToHumanReadable(item.find('Size').text()),
	  type: 'file'
	}
  });
  var directories = $.map(xml.find('CommonPrefixes'), function(item) {
	item = $(item);
	return {
	  key: item.find('Prefix').text(),
	  lastModified: '',
	  size: '',
	  type: 'directory'
	}
  });
  var objects = $.merge(files, directories);
  objects.sort(objectComparator)
  
  if ($(xml.find('IsTruncated')[0]).text() == 'true') {
	var nextMarker = $(xml.find('NextMarker')[0]).text();
  } else {
	var nextMarker = null;
  }
  return {
	objects: objects,
	prefix: $(xml.find('Prefix')[0]).text(),
	nextMarker: encodeURIComponent(nextMarker)
  }
}

function bytesToHumanReadable(sizeInBytes) {
  var i = -1;
  var units = [' kB', ' MB', ' GB'];
  do {
	sizeInBytes = sizeInBytes / 1024;
	i++;
  } while (sizeInBytes > 1024);
  return Math.max(sizeInBytes, 0.1).toFixed(1) + units[i];
}



readListing(path);