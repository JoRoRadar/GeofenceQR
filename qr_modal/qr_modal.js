/*

Author: Joe Ross
Date: October 23, 2021
Email: joe.ross@radar.io

*/

/* Build Modal into page on load. */
function loadModalHTML(){

    //Load Assests
    var modal_resource_url = chrome.runtime.getURL(`qr_modal/qr_modal.html`);
    var modal_image_url = chrome.runtime.getURL(`Icons/radar_qr.png`);

    //Build Entry
    var modal_etry_elem = document.createElement('div');
    modal_etry_elem.classList.add('qr-radar-modal');

    document.body.appendChild(modal_etry_elem);

    /*
        (1) - Retrieve raw HTML from extension web_resource
        (2) - Inject raw HTML into page
        (3) - Update elements
    */
    fetch(modal_resource_url)
        .then(response => response.text())
        .then( data => {
            modal_etry_elem.innerHTML = data;
        })
        .then(() => {
            //Update Image
            document.getElementsByClassName("qr-radar-modal-image")[0].src = modal_image_url;

            //Close Modal with X-Button
            document.getElementsByClassName("qr-radar-close")[0].onclick = function(){
                var modal = document.getElementsByClassName("qr-radar-modal")[0];
                modal.style.display = "none";
            }
        });
}

/* Close Modal by clicking off modal */
window.onclick = function(event) {
    var modal = document.getElementsByClassName("qr-radar-modal")[0];

    if( event.target == modal){
        modal.style.display = "none";
    }
}
loadModalHTML();