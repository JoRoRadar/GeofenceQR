var intent = "Error"; //YAY GLOBALS

function generateQRCode(value){
    console.log(`Return Value ${value}`);

    var qrcode = new QRCode(document.getElementById("qr_code"),{
        text:JSON.stringify(value),
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function scrapeAPIKey(){
    var raw_page = document.documentElement.innerHTML;

    var key_regex = /<code class="privateselectable">(prj_test_pk_[a-z0-9A-Z]+)<\/code>/;

    var api_key = raw_page.match(key_regex)[1];

    console.log(`
    API Key : ${api_key}
    `)

    if( api_key == null ){
        return null;
    }

    return {"apiKey": api_key};
}

function scrapeGeofenceData(){
    var raw_page = document.documentElement.innerHTML;

    var tag_regex = /tag=(\w+)/;
    var id_regex = /<h6>External ID<\/h6><p>(\w+)<\/p>/;

    var tag = raw_page.match(tag_regex)[1];
    var id = raw_page.match(id_regex)[1];

    console.log(`
    Tag : ${tag}
    ID : ${id}
    `)

    if( tag == null || id == null ){
        return null;
    }

    return {"tag": tag, "id": id};
}

function checkGeofenceTabUrl(url){
    var url_regex = /https:\/\/radar.io\/dashboard\/geofences\/[0-9a-z]+\?project=[0-9a-z]+&live=*/;

    return url_regex.test(url);
}

function checkHomeTabUrl(url){
    var url_regex = /https:\/\/radar.io\/dashboard\/quickstart\?project=[0-9a-z]+&live=*/;

    return url_regex.test(url);
}

chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
    var activeTab = tabs[0];
    var activeTabId = activeTab.id;
    var url = activeTab.url;

    intent = "Error";
    if( checkGeofenceTabUrl(url)){
        intent = "Geofence";
    }else if( checkHomeTabUrl(url)){
        intent = "Key";
    }

    console.log(`URL : ${url}`);
    console.log(`Intent : ${intent}`);
    
    //I think rerunning multiple times causes the script to pile up on that page.
    //No good way of passing intent. God lazy but thinking about using global.
    if( intent == "Geofence" ){

        chrome.scripting.executeScript(
            {
                target: {tabId: activeTabId},
                function: scrapeGeofenceData
            },
            (injectionResults) => {
                console.log(`Callback Intent ${intent}`);
                var geofence_values = injectionResults[0].result;
                
                if(geofence_values == null){
                    alert("Not able to gather data from page. Please update.");
                }else{
                    generateQRCode(geofence_values);
                }
            }
        );
    }else if( intent == "Key" ){
        chrome.scripting.executeScript(
            {
                target: {tabId: activeTabId},
                function: scrapeAPIKey
            },
            (injectionResults) => {
                console.log(`Callback Intent ${intent}`);
                var api_key = injectionResults[0].result;
                
                if(api_key == null){
                    alert("Not able to gather data from page. Please update.");
                }else{
                    generateQRCode(api_key);
                }
            }
        );
    }
    else{
        alert("Cannot generate QR Code. Please navigate to a specific Geofence or Home in Radar Dashboard");
    }

});