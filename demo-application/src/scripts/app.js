import $ from 'jquery';
import raw from 'raw.macro';
import AppDefPage from '../AppDefPage';
import ReactDOM from 'react-dom';
import React from 'react';
import App from '../App';
import AppQuizPage from '../AppQuizPage';

var DOMstrings = {
    pageNumber: '.page-number',
    pageLeft: '.page-left',
    pageRight: '.page-right'
};

var jsFileLocation;
var readFile;
var RespType;
var FileType;
var chapterKeys = [];
var pageTrack;
var pageTrack_deserialized;

export function AppStartUp() {
    //On launch, we stall loading the page until the JQuery is loaded
    awaitJQuery(loadApp);
}

function awaitJQuery(callback) {
    var waitForLoad = function () {
        if (typeof jQuery != "undefined") {
            //executes passed in function
            callback()
            // invoke any methods defined in your JS files to begin execution
        } else {
            console.log("jquery not loaded..");
            window.setTimeout(waitForLoad, 500);
        }
    };
    window.setTimeout(waitForLoad, 500);
}

function loadApp(){
    //console.log("Finished jQuery");

    /**The following are event listeners that handle page navigation
     * These are necessary to include in any function that refreshes the page
     * Otherwise the page navigation functionality will break
     */
    document.getElementById("nextpage").addEventListener("click", nextPage);
    document.getElementById("backpage").addEventListener("click", backPage);
    document.getElementById("nextChapter").addEventListener("click", nextChapter);
    document.getElementById("backChapter").addEventListener("click", backChapter);
    document.addEventListener("DOMContentLoaded", runPageGet);
    document.getElementById('currpage').addEventListener('blur', function() {
        var currpg = document.getElementById('currpage').textContent
        console.log(currpg);
        try {
            currpg = parseInt(currpg, 10);
            var cookiePg = document.cookie;
            console.log(cookiePg);
            cookiePg = cookiePg.split("=");
            cookiePg = parseInt(cookiePg[1], 10);
            console.log(cookiePg);
            if (currpg <= 0) {
                document.querySelector(DOMstrings.pageNumber).textContent = cookiePg + "-" + (cookiePg + 1);
                return;
            }
            document.cookie = 'pagenum=' + currpg;
            let pageTrack = JSON.stringify(document.cookie);
            localStorage.setItem("Key", pageTrack);

            pageReturn(cookiePg);
        } catch (error) {
            console.log(error);
            currpg = document.cookie;
            currpg = currpg.split("=");
            currpg = parseInt(currpg[1], 10);
            console.log(currpg);
            var newpg = currpg + 1;
            document.querySelector(DOMstrings.pageNumber).textContent = currpg + "-" + newpg;
            //TODO: Raise dialog box explaining issue
        }
    }, false);

    pageTrack_deserialized = JSON.parse(localStorage.getItem("Key"));
    document.cookie = pageTrack_deserialized;

    readFile = [];
    RespType = "blob";
    FileType = "text/plain";
    //make importFile wait until JQuery is loaded
    importFileStage(importFile);
}

//This function is somewhat redundant since it just passes the importFile method to awaitJQuery
function importFileStage(callback) {
    console.log("importing file...")
    awaitJQuery(callback);
}

/**
 * This file has the current way of reading the file using raw.macro
 * @param {*} X file that is read by importFile
 * @param {*} fileloc location of the file read (likely deprecated with current functionality)
 */
function handleFile(X, fileloc){
    //var blobUri = URL.createObjectURL(new Blob([X], {type: "text/plain"}));
    const fileReader = new FileReader();
    fileReader.readAsText(new Blob([X], {type: "text/plain"}));
    fileReader.onload = function(e) {
        var rawText = raw('../scripts/73.txt');
        //detach newline characters from words
        rawText = rawText.replaceAll("\n", " \n ");
        //detach register return from words
        rawText = rawText.replaceAll("\r", " \r ");
        //create array of text using space as the delimiting token
        readFile = rawText.split(" ");
        //break points will be used to condense file to specifically the book content
        var firstbreak = 0;
        var secondbreak = 0;
        for (let index = 0; index < readFile.length; index++) {
            //finds chapter indices for chapter navigation
            if (readFile[index] == "Chapter") {
                chapterKeys.push(index);
            }
            //finds start of book
            if (readFile[index] + " " + readFile[index+1] == "Chapter 1"){
                firstbreak = index;
            }
            //finds end of book
            if (readFile[index] + " " + readFile[index+1] == "THE END."){
                secondbreak = index + 2;
            }
        }
        // console.log(firstbreak);
        // console.log(secondbreak);
        //take only the part of the array that contains the book
        readFile = readFile.slice(firstbreak, secondbreak);
        //update chapter indices so they are accurate after the previous operation
        for (let index = 0; index < chapterKeys.length; index++) {
            chapterKeys[index] -= firstbreak;
        }
        //console.log("File Read.  First word: " + readFile[0]);
        //loads pages
        runPageGet();
        pageReturn();
    };
}

/**
 * This function handles the file import functionality
 * This uses AJAXFileReadder and will pass the read file to the handleFile method
 * This is likely deprecated with current functionality in the handleFile method
 * It is currently important that the AJAXFileReadder loads as that is how handleFile is called
 * but this can be reworked at a future date to avoid AJAX
 */
function importFile(){
    var AJAXFileReadder = new XMLHttpRequest();

    AJAXFileReadder.addEventListener("load", function Finished(){
        if ((this.readyState==4)&&(this.status==200)){
            handleFile(this.response, jsFileLocation);
        }
    }, false);

    jsFileLocation = $('script[src*=app]').attr('src');
    jsFileLocation = jsFileLocation.replace("app.js", "");
    jsFileLocation = jsFileLocation + "73.txt";
    RespType = "blob";
    FileType = "text/plain";
    console.log("File Location: " + jsFileLocation)
    console.log("FileType: " + FileType);
    console.log("RespType: " + RespType);
    AJAXFileReadder.open("GET", jsFileLocation, true);
    AJAXFileReadder.overrideMimeType(FileType);
    AJAXFileReadder.responseType=RespType;
    AJAXFileReadder.timeout=10000;

    AJAXFileReadder.send();
}

var text1 = '';
var text2 = '';
var startidx;
var endidx;
var stdDiff = 350;
/**
 * Runs the initial page set up loading pages 1 and 2
 */
function runPageGet(){
    startidx = 0;
    endidx = 350;
    //sets the text for the first page
    text1 = pageSet(startidx, endidx, readFile);
    //loads the text for page 1 onto the page
    document.querySelector(DOMstrings.pageLeft).textContent = text1;
    //sets the page numbers at bottom of the page
    document.querySelector(DOMstrings.pageNumber).textContent = "1-2"
    
    //updates the indices for page 2
    startidx = endidx;
    endidx = endidx + stdDiff;
    
    //sets the text for the second page
    text2 = pageSet(startidx, endidx, readFile);
    //loads the text for page 2 onto the page
    document.querySelector(DOMstrings.pageRight).textContent = text2;
}

/**
 * Takes the specified indices and creates a string of the words between them
 * @param {int} startidx start index for the page
 * @param {int} endidx end index for the page
 * @param {array} source array for the book
 * @returns text value for the page as a single string
 */
function pageSet(startidx, endidx, source) {
    let pageTrack = JSON.stringify(document.cookie);
    localStorage.setItem("Key", pageTrack);
    var outtext = '';
    for (let index = startidx; index < endidx; index++){
        if (index >= source.length) {
            return outtext;
        }
        outtext = outtext + " " + source[index];
    }
    return outtext;
}

//highlights words on one click
$(window).on("load", function() {

    var point = $('p');
    point.css({ cursor: 'pointer' });

    point.click(function(e) {

        //finds range of selected word
        var selection = window.getSelection() || document.getSelection()
        || document.selection.createRange();
        var range = selection.getRangeAt(0);
        var node = selection.anchorNode;

        //sets start offset of word and catches in there is a -- before the selected character
        while(range.toString().indexOf(' ') != 0) {
            if(range.toString().charAt(1) != 0) {
                if(/^[-]*$/.test(range.toString().charAt(0)) &&
                    /^[-]*$/.test(range.toString().charAt(1))) {
                    break;
                }
            }
            range.setStart(node, (range.startOffset - 1));
        }
        range.setStart(node, range.startOffset + 1);

        //sets end offset and catches if there is a -- after the selected letter
        const countUp = 0;
        while(range.toString().indexOf(' ') == -1 && range.toString().trim() != '' &&
            range.endOffset + 1 < selection.baseNode.wholeText.length) {
            if(range.toString().charAt(range.toString().length - 2 != 0)) {
                if(/^[-]*$/.test(range.toString().charAt(range.toString().length - 1)) &&
                    /^[-]*$/.test(range.toString().charAt(range.toString().length - 2))) {
                    break;
                }
            }
            range.setEnd(node, range.endOffset + 1);
        }

        //No highlighted space after word
        range.setEnd(node, range.endOffset - 1);

        //removes end puncuation from highlighted word
        while (1) {
            const endChar = range.toString().charAt(range.toString().length - 1);
            if (!/^[a-zA-Z0-9']*$/.test(endChar)) {
                range.setEnd(node, range.endOffset - 1);
            } else {
                break;
            }
        }

        //removes quotations at beginning of highlighted word
        const startChar = range.toString().charAt(0);
        if(!/^[a-zA-Z0-9']*$/.test(startChar)) {
            range.setStart(node, range.startOffset + 1);
        }

        var text = $.trim(selection.toString());
        selection.collapse();
    });

    point.dblclick(function(f) {
        console.log("Trying to pull def page");
        pullDefPage();
    });

});

/**
 * Reloads the app using the Definition Page
 */
function pullDefPage() {
    window.defPage = true;
    // console.log(AppDefPage);
    //forces a rerender. NOTE: Event Listeners must be reloaded on return
    ReactDOM.render(
        <React.StrictMode>
          {(!window.defPage) ? <App /> : <AppDefPage />}
        </React.StrictMode>,
        document.getElementById('root')
    );
}


/**
 * Reloads the app using the Quiz Page
 */
function pullQuizPage() {
    window.defPage = false;
    //console.log("Trying to pull Quiz Page")
    //forces a rerender. NOTE: Event Listeners must be reloaded on return
    ReactDOM.render(
        <React.StrictMode>
            <AppQuizPage />
        </React.StrictMode>,
        document.getElementById('root')
    );
}


//button handler needed for other pages, called from HTML
export function btnHandler(btnVal) {
    console.log(btnVal);
    if (btnVal == "Quiz") {
        pullQuizPage();
    } else if (btnVal == "Return to book") {
        backToBook();
        window.location.reload();
    } else if (btnVal == 'wordA' || btnVal == 'wordB' || btnVal =='wordC' || btnVal == 'wordD') {
        backToBook();
        window.location.reload();
    }
}

/**
 * Reloads the app using the Book Page. Occurs asynchronously
 */
async function backToBook() {
    window.defPage = false;
    //forces rerender.  NOTE: Event Listeners must be reloaded
    await ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        document.getElementById('root')
    );
    //resets to last page
    pageReturn();
}

/**
 * Returns to book page from elsewhere
 * @param {int} prevPg optional value for a specific page to return to
 * @returns No return, return used to force exit early from method
 */
function pageReturn(prevPg = null) {
    pageTrack_deserialized = JSON.parse(localStorage.getItem("Key"));
    var currpg = pageTrack_deserialized;
    currpg = currpg.split("=");
    currpg = parseInt(currpg[1], 10);

    startidx = (currpg - 1) * stdDiff;
    if (startidx > readFile.length) {
        //if prevPg specified, load prevPg
        if (prevPg) {
            currpg = prevPg;
            document.querySelector(DOMstrings.pageNumber).textContent = currpg + "-" + (currpg + 1);
            document.cookie = "pagenum=" + currpg;
        }
        return;
    }
    endidx = startidx + stdDiff;
    //set text for left page
    text1 = pageSet(startidx, endidx, readFile);
    //load text onto page
    document.querySelector(DOMstrings.pageLeft).textContent = text1;

    //if page was last page, stop
    if (text1.length < stdDiff) {
        return;
    }
    document.querySelector(DOMstrings.pageNumber).textContent = currpg + "-" + (currpg + 1);

    //update indices
    startidx = endidx;
    endidx = endidx + stdDiff;
    //set text for right page
    text2 = pageSet(startidx, endidx, readFile);
    //load text onto page
    document.querySelector(DOMstrings.pageRight).textContent = text2;
    
    //Reloads all Event Listeners. VERY IMPORTANT
    document.getElementById("nextpage").addEventListener("click", nextPage);
    document.getElementById("backpage").addEventListener("click", backPage);
    document.getElementById("nextChapter").addEventListener("click", nextChapter);
    document.getElementById("backChapter").addEventListener("click", backChapter);
    document.getElementById('currpage').addEventListener('blur', function() {
        var currpg = document.getElementById('currpage').textContent
        try {
            currpg = parseInt(currpg, 10);
            document.cookie = 'pagenum=' + currpg;
            let pageTrack = JSON.stringify(document.cookie);
            localStorage.setItem("Key", pageTrack);
            pageReturn();
        } catch (error) {
            currpg = document.cookie;
            currpg = currpg.split("=");
            currpg = parseInt(currpg[1], 10);
            console.log(currpg);
            var newpg = currpg + 1;
            document.querySelector(DOMstrings.pageNumber).textContent = currpg + "-" + newpg;
            //TODO: Raise dialog box explaining issue
        }
    }, false);
}

//Takes away triple click
document.querySelector('div').addEventListener('click', function (evt) {
    if (evt.detail >= 3) {
        var rem = window.getSelection();
        rem.removeAllRanges();
    }
});

/**
 * Loads next page
 * @returns no return, return is used to exit early
 */
function nextPage(){
    //grabs page stored in document cookie
    var currpg = document.cookie;
    currpg = currpg.split("=");
    currpg = parseInt(currpg[1], 10);
    text1 = '';
    text2 = '';
    //set text 1
    text1 = pageSet(startidx, endidx, readFile);
    //load text 1 onto page
    document.querySelector(DOMstrings.pageLeft).textContent = text1;

    //check if page is last page
    if (text1.length < stdDiff) {
        document.querySelector(DOMstrings.pageNumber).textContent = currpg + 1;
        return;
    }
    var newpg = currpg + 1;
  
    //set page number at bottom of page
    document.cookie = "pagenum=" + newpg;
    document.querySelector(DOMstrings.pageNumber).textContent = newpg + "-" + (newpg + 1);
    
    //update indices
    startidx = endidx;
    endidx = endidx + stdDiff;
    //set text 2
    text2 = pageSet(startidx, endidx, readFile);
    //load text 2 onto page
    document.querySelector(DOMstrings.pageRight).textContent = text2;
}

/**
 * Goes back a page
 * @returns no return, return is used to exit early
 */
function backPage(){
    //grabs current page from document cookie
    var currpg = document.cookie;
    currpg = currpg.split("=");
    currpg = parseInt(currpg[1], 10);
    var newpg = currpg - 1
    //check if out of bound
    if (newpg <= 0){
        return;
    }
    document.cookie = "pagenum=" + newpg;
    text1 = '';
    text2 = '';
    //move left page to right page
    document.querySelector(DOMstrings.pageRight).textContent = document.querySelector(DOMstrings.pageLeft).textContent;
    //set page numbers at bottom of the page
    document.querySelector(DOMstrings.pageNumber).textContent = newpg + "-" + (newpg + 1)
    //update indices
    endidx = startidx - stdDiff;
    startidx = endidx - stdDiff;

    //set text 1
    text1 = pageSet(startidx, endidx, readFile);

    //update indices
    startidx = endidx;
    endidx = endidx + stdDiff;
    //load text 1 onto page
    document.querySelector(DOMstrings.pageLeft).textContent = text1;
}

/**
 * Moves to the next chapter
 * @returns no return, return used to exit early
 */
function nextChapter() {
    //get current page from document cookie
    var currpg = document.cookie;
    currpg = currpg.split("=");
    currpg = parseInt(currpg[1], 10);
    startidx = (currpg - 1) * stdDiff;
    endidx = startidx + stdDiff;
    var target;
    //finds the index for the next chapter
    for (let index = 0; index < chapterKeys.length; index++) {
        if (chapterKeys[index] >= endidx) {
            target = index;
            break;
        }
    }
    //checks if we are in the last chapter
    if (target == null) {
        //TODO: raise error
        return;
    }
    //calculates new page 
    var newpg = Math.floor(chapterKeys[target] / stdDiff) + 1;
    //set document cookie to new page
    document.cookie = "pagenum=" + newpg;
  
    let pageTrack = JSON.stringify(document.cookie);
    localStorage.setItem("Key", pageTrack);
    //loads new page
    pageReturn();
}

/**
 * Moves to the previous chapter
 * @returns no return, return used to exit early
 */
function backChapter() {
    //gets current page from document cookie
    var currpg = document.cookie;
    currpg = currpg.split("=");
    currpg = parseInt(currpg[1], 10);
    startidx = (currpg - 1) * stdDiff;
    var target;
    //finds previous chapter index
    for (let index = 0; index < chapterKeys.length; index++) {
        if (chapterKeys[index] >= startidx) {
            target = index - 1;
            break;
        }
    }
  
    //checks if in the first chapter
    if (target == null || target < 0) {
        //TODO: raise error
        return;
    }
    //calculates new page index
    var newpg = Math.floor(chapterKeys[target] / stdDiff) + 1;
    //sets document cookie to new page
    document.cookie = "pagenum=" + newpg;
  
    let pageTrack = JSON.stringify(document.cookie);
    localStorage.setItem("Key", pageTrack);
    //loads new page
    pageReturn();
}
