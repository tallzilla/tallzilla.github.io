// Script to grab upcoming shows from a Google Sheet and display as a table
url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0N69Gf5EdrfyOFEuUwWjYpKr_DfpwDh-qpx-2xxGx9VKjfGOWrtPJAKNugIANj_abfdc0Zhd833CA/pub?gid=0&single=true&output=csv';
params = getUrlParameters();

function convertStringToTimestamp(dateString) {
    // Define month names for parsing
    const monthNames = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    // Regular expression pattern to match the date format
    const pattern = /^(\w{3}), (\w{3}) (\d{1,2}) (\d{4}), (\d{1,2})([AP]M)$/;

    // Use regular expression to extract date components
    const [, dayOfWeek, monthStr, day, year, hour, ampm] = dateString.match(pattern);

    // Convert month abbreviation to month number
    const month = monthNames[monthStr];

    // Convert 12-hour format to 24-hour format
    let hour24 = parseInt(hour);
    if (ampm === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
        hour24 = 0;
    }

    // Create a new Date object with the extracted components
    const date = new Date(year, month, day, hour24, 0);

    // Return the timestamp
    return date.getTime();
}

function convertTimestampToString(timestamp, format) {
    const date = new Date(timestamp);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayOfWeek = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hour = date.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert hour to 12-hour format

    // Format the date according to the specified format
    if (format === 'short') {
        const monthDay = `${date.getMonth() + 1}/${day}`;
        const hour12 = hour % 12 || 12; // Convert hour to 12-hour format
        const ampm = hour < 12 ? 'PM' : 'AM';
        return `${dayOfWeek.slice(0,3)}. ${monthDay}, ${hour12}${ampm}`;
    } else if (format === 'long') {
        return `${dayOfWeek}, ${month} ${day} ${year}, ${hour}${ampm}`;
    }
}

function getUrlParameters() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params = {};

    for (const [key, value] of urlParams) {
        params[key] = value;
    }

    return params;
}

// Simple function to validate if text in calendar is a valid URL
function isValidHttpUrl(string) {
    let url;  
    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

function createDataElement(htmlTag, innerText, idParent) { 
    let node = document.createElement(htmlTag);
    let textnode;

    //If we have a valid url in the calendar, HTML-enclose it
    if(isValidHttpUrl(innerText)) {
        textnode = document.createElement('a');
        textnode.setAttribute('href',innerText);
        textnode.innerHTML = "Tickets";
    } else {
        textnode = document.createTextNode(innerText);             
    }
    node.appendChild(textnode); 
    document.getElementById(idParent).appendChild(node); 
}

function createHeaderElement(columnText) { 
    createDataElement("th", columnText, "tableHeader"); 
}

function createCellData(rowIndex, columnIndex, cellText) { 

    dateFormat = params['dateFormat'] === undefined ? 'long' : params['dateFormat'];
	// for rendering the beginning of the row, and the first cell
	// which is (thus far) always time. time is converted from a
	// specific format from the spreadsheet. TODO: get both talking
	// in unix timestamps

    if(columnIndex === 0) { 
        let node = document.createElement("tr"); 
        node.setAttribute("id", "row" + rowIndex); 
        document.getElementById("tableBody").appendChild(node);

        timestamp = convertStringToTimestamp(cellText)
        createDataElement("td", convertTimestampToString(timestamp, dateFormat), "row" + rowIndex);

    } else {
        createDataElement("td", cellText, "row" + rowIndex); 
    } 
}

Papa.parse(url, { 
    download: true,
    complete: function(results) { 

    	params = Params.getUrlParameters()

    	// save the header row, will need it leader
    	headerRow = results.data[0];
    	results.data = results.data.slice(1);

    	// now results.data is headerless

    	// take the user's parameters and trim down the rows in the remaining data set
    	let startShow = params['startShow'] === undefined ? 0 : params['startShow'];
        results.data = params['numShows'] === undefined ? results.data : results.data.slice(startShow, params['numShows']);    	

    	// add back the header 
    	results.data.unshift(headerRow);

	   	// now trim down the expected columns (including the header)
    	results.data = params['cols'] === undefined ? results.data : results.data.map(row => row.slice(0, params['cols']));

        for(let i = 0; i < results.data.length; i++) { 
            if(i === 0) { 
                for(let j = 0; j < results.data[i].length; j++) { 
                    createHeaderElement(results.data[i][j]); 
                } 
            } 
            if(i > 0) { 
                for(let j = 0; j < results.data[i].length; j++) { 

                    createCellData(i, j, results.data[i][j]); 
                } 
            } 
        } 
    } 
});