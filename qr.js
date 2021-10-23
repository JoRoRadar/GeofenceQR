/*

Author: Joe Ross
Date: October 23, 2021
Email: joe.ross@radar.io

Purpose:
    Generate a QR Code that can be scanned for use in the Radar Toolkit App for iOS and Android(TBD).
    The QR Code should provide the test client API key or the necessary Geofence Data for a trip.

External Libraries:

QRCode Builder - https://github.com/davidshimjs/qrcodejs

*/

//Open Error Modal
function openErrorModal(){
    document.getElementById("status").innerHTML = "Error";
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function:() => {
                var modal = document.getElementsByClassName("qr-radar-modal")[0];
                modal.style.display = "inline";
            }
        }, () => {});
    });
}

/*
@param value : Object - Object to be stringified and presented as QR Code.
*/
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

/*               */
/* Page Scrapers */
/*               */

// Retrieve API Key from Page w/ Regex
function scrapeAPIKey(){
    var raw_page = document.documentElement.innerHTML;

    var key_regex = /<code class="privateselectable">(prj_test_pk_[a-z0-9A-Z]+)<\/code>/;

    var api_key = raw_page.match(key_regex)[1];

    // console.log(`
    // API Key : ${api_key}
    // `)

    if( api_key == null ){
        console.log("Key not found");
        return null;
    }

    return {"apiKey": api_key};
}

//Retrieve Geofence Data for Trip with Regex
function scrapeGeofenceData(){
    var raw_page = document.documentElement.innerHTML;

    var tag_regex = /tag=(\w+)/;
    var id_regex = /<h6>External ID<\/h6><p>(\w+)<\/p>/;

    var tag = raw_page.match(tag_regex)[1];
    var id = raw_page.match(id_regex)[1];

    // console.log(`
    // Tag : ${tag}
    // ID : ${id}
    // `)

    if( tag == null || id == null ){
        return null;
    }

    return {"tag": tag, "id": id};
}

/*                   */
/*  URL Verification */
/*                   */

//Check if current tab is specific Radar geofence
function checkGeofenceTabUrl(url){
    var url_regex = /https:\/\/radar.io\/dashboard\/geofences\/[0-9a-z]+\?project=[0-9a-z]+&live=*/;

    return url_regex.test(url);
}

//Check if current tab is Radar Dashboard
function checkHomeTabUrl(url){
    var url_regex = /https:\/\/radar.io\/dashboard(\/quickstart)?\?project=[0-9a-z]+&live=.*/;

    return url_regex.test(url);
}

/*                               */
/* Entry - Run on extension load */
/*                               */

chrome.tabs.query({active:true, currentWindow: true}, function(tabs){

    var intent = null;

    //Get Tab Info
    var activeTab = tabs[0];
    var activeTabId = activeTab.id;
    var url = activeTab.url;

    //Decision - API Key or Geofence
    if( checkGeofenceTabUrl(url)){
        //Update Status Message
        document.getElementById("status").innerHTML = "Geofence";
        
        intent = scrapeGeofenceData;
    }else if( checkHomeTabUrl(url)){
        //Update Status Message
        document.getElementById("status").innerHTML = "API Key";
        
        intent = scrapeAPIKey;
    }

    if( intent == null ){
        openErrorModal();
        return;
    }

    //Get page data
    chrome.scripting.executeScript({
        target: {tabId: activeTabId},
        function: intent
    }, (injectionResults) => {
        var scrape_results = injectionResults[0].result;

        //Results found for page?
        if( scrape_results == null){
            openErrorModal();
        }else{
            generateQRCode(scrape_results);
        }
    });
});