"use strict";

let char; // this will hold the values from the character database
let characterImgs; // this will hold a class from "RoA WebGL Shader.js"
let charNum = 0;
let rgbSliders; // if active, the page will use rgb sliders instead of hsv ones

const charNameText = document.getElementById("charName");

const fullCanvas = document.getElementById("portCanvas");
const animCanvas = document.getElementById("animCanvas");

const animDiv = document.getElementById("animDiv");

const sliderHue = document.getElementById("sliderHue");
const sliderSat = document.getElementById("sliderSat");
const sliderVal = document.getElementById("sliderVal");
const sliderR = document.getElementById("sliderR");
const sliderG = document.getElementById("sliderG");
const sliderB = document.getElementById("sliderB");
const squareR = document.getElementById("squareR");
const squareG = document.getElementById("squareG");
const squareB = document.getElementById("squareB");
const squareRGB = document.getElementById("squareRGB");

const radioHSV = document.getElementById("radioHSV");
const radioRGB = document.getElementById("radioRGB");

/* const loadedImgs = [];

function preloadImgs() {
    
    for (let i = 0; i < db.chars.length; i++) {
        
        
    }

} */

// set up functions for the character parts
class charPart {

    constructor(partDiv) {
        this.partName = partDiv.querySelector(".partName");
        this.colorRect = partDiv.querySelector(".colorRect");
        this.colorValues = partDiv.querySelector(".colorValues");

        this.partDiv = partDiv;

        partDiv.addEventListener("click", partClicked);
    }

    newPart(rgb, name) {
        this.partName.innerText = name;
        this.newColor(rgb);
        this.partDiv.disabled = false;
    }

    newColor(rgb) {
        this.colorRect.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        this.colorValues.innerText = `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
    }

    disable() {
        this.partDiv.disabled = true;
        this.partName.innerText = null;
        this.colorValues.innerText = null;
    }

}
// store all those parts for quick access
const parts = createPartList();
function createPartList() {
    const returnValue = [];
    const partDivs = document.getElementsByClassName("part");
    for (let i = 0; i < partDivs.length; i++) {
        returnValue.push(new charPart(partDivs[i]))        
    }
    return returnValue;
}


// when the page loads, change to a random character
changeChar();

// add event listeners to the back and forward character buttons
document.getElementById("backBut").addEventListener("click", () => {
    if (charNum == 0) {
        charNum = db.chars.length - 1;
    } else {
        charNum--;
    }
    changeChar();
});
document.getElementById("forwardBut").addEventListener("click", () => {
    if (charNum == db.chars.length - 1) {
        charNum = 0;
    } else {
        charNum++;
    }
    changeChar();
});

// whenever the character changes
function changeChar() {

    // look at the database to see whats up
    char = db.chars[charNum];
    // create new character images with this info
    characterImgs = new RoaRecolor(char.ogColor, char.colorRange, char.blend);
    // save all the new images as promises so we know when they are fully loaded
    const imgPromises = [
        characterImgs.addImage(fullCanvas, "Characters/"+char.name+"/Portrait.png", "Portrait"),
        characterImgs.addImage(animCanvas, "Characters/"+char.name+"/Anim.png", "Animated Sprite"),
    ]
    // when the images finish loading
    Promise.all(imgPromises).then( () => {

        // dirty trick to scale the character
        fullCanvas.style.minWidth = fullCanvas.width * 2 + "px";
        fullCanvas.style.minHeight = fullCanvas.height * 2 + "px";

        charNameText.innerText = char.name;

        // ori is the only character that needs an actual recolor
        if (char.name == "Ori and Sein") {
            char.currentRGB = [...char.actualColor];
        } else {
            char.currentRGB = [...char.ogColor];
        }
        // do a first paint 
        mainRecolor(char.currentRGB);

        // create a new color list
        updateListFull(char.currentRGB);

        // set the sliders to the first part by clicking it
        parts[0].partDiv.click();

    })

    // all of this is for the animated idle sprite
    const sprite = new Image();
    sprite.src = "Characters/"+char.name+"/Anim.png";
    sprite.decode().then( () => { // when the image finishes loading

        // change the width of the sprite animation, depending on the character
        animDiv.style.width = (sprite.width / char.idleFC) + "px"; // gets the w of 1 frame
        animDiv.style.height = sprite.height + "px"; // div will have slightly wrong height otherwise
        // now change the variables for the sprite animation
        const r = document.querySelector(':root');
        r.style.setProperty("--spriteMove", -sprite.width + "px"); //end position of the animation
        r.style.setProperty("--spriteCount", char.idleFC); // frame count
        // formula for this one is: 1000 is a second, then divided by 60 gets us an
        // in-game frame, then we multiply by 6 because thats the average frame
        // wait between sprite changes, and then we multiply by the character frame
        // count to know how long the animation is going to take, finally, we divide
        // by 1000 to get the value in seconds for the css variable
        r.style.setProperty("--spriteTime", 1000/60*6*char.idleFC/1000 + "s");

    }) 

}

//the recolor function!
function mainRecolor(rgb, dl) {

    const newRGB = [...rgb];

    if (char.name == "Olympia") { // Olympia's pants colors affect all whites
        newRGB.push(char.ogColor[24], char.ogColor[25], char.ogColor[26], char.ogColor[27])
    } else if (char.name == "Orcane") { // orcane has a greenish hidden part
        for (let i = 0; i < 4; i++) { // add the 1st colors as the 3rd colors
            newRGB[i+8] = newRGB[i];
        }
    }

    if (dl) { // if we want to download the image
        characterImgs.download(newRGB, dl);
    } else {
        characterImgs.recolor(newRGB); // now recolor the images
    }

}

// called when changing character
function updateListFull(rgb) {
    for (let i = 0; i < parts.length; i++) {
        if (i < char.partNames.length) {
            parts[i].newPart([rgb[i*4], rgb[i*4+1], rgb[i*4+2]], char.partNames[i]);
        } else {
            parts[i].disable();
        }        
    }
}

function partClicked() {

    char.currentPart = this.getAttribute("num");

    // just to shorten the names
    const num = char.currentPart;
    const rgb = char.currentRGB; 
    
    // rgb sliders
    sliderR.value = rgb[num * 4];
    sliderG.value = rgb[num * 4 + 1];
    sliderB.value = rgb[num * 4 + 2];

    // hsv sliders
    const hsv = rgb2hsv(rgb[num * 4], rgb[num * 4 + 1], rgb[num * 4 + 2])
    sliderHue.value = hsv[0];
    sliderSat.value = hsv[1];
    sliderVal.value = hsv[2];

    // update the slider text value
    sliderR.parentElement.lastElementChild.innerText = sliderR.value;
    sliderG.parentElement.lastElementChild.innerText = sliderG.value;
    sliderB.parentElement.lastElementChild.innerText = sliderB.value;
    sliderHue.parentElement.lastElementChild.innerText = sliderHue.value;
    sliderSat.parentElement.lastElementChild.innerText = sliderSat.value;
    sliderVal.parentElement.lastElementChild.innerText = sliderVal.value;


    // update the hsv slider color
    const cssRgb = hsv2rgb(hsv[0] / 360, 1, 1);
    cssRgb[0] = cssRgb[0] * 255;
    cssRgb[1] = cssRgb[1] * 255;
    cssRgb[2] = cssRgb[2] * 255;
    sliderSat.style.background = `linear-gradient(to right, white, rgb(${cssRgb[0]}, ${cssRgb[1]}, ${cssRgb[2]})`;
    sliderVal.style.background = `linear-gradient(to right, black, rgb(${cssRgb[0]}, ${cssRgb[1]}, ${cssRgb[2]})`;

    // update the bottom squares
    squareR.style.backgroundColor = `rgb(${rgb[num*4]}, 0, 0)`;
    squareG.style.backgroundColor = `rgb(0, ${rgb[num*4+1]}, 0)`;
    squareB.style.backgroundColor = `rgb(0, 0, ${rgb[num*4+2]})`;
    squareRGB.style.backgroundColor = `rgb(${rgb[num*4]}, ${rgb[num*4+1]}, ${rgb[num*4+2]})`;

}

sliderHue.oninput = sliderMoved;
sliderSat.oninput = sliderMoved;
sliderVal.oninput = sliderMoved;
sliderR.oninput = sliderMoved;
sliderG.oninput = sliderMoved;
sliderB.oninput = sliderMoved;
function sliderMoved() {

    const rgb = char.currentRGB;
    const num = char.currentPart;

    if (radioHSV.checked) { // if hsv sliders are active, translate to rgb
        const rgbFromHsv = hsv2rgb(sliderHue.value / 360, sliderSat.value / 100, sliderVal.value / 100);
        sliderR.value = Math.round(rgbFromHsv[0] * 255);
        sliderG.value = Math.round(rgbFromHsv[1] * 255);
        sliderB.value = Math.round(rgbFromHsv[2] * 255);
    }

    rgb[num*4] = sliderR.value;
    rgb[num*4+1] = sliderG.value;
    rgb[num*4+2] = sliderB.value;

    mainRecolor(rgb);
    parts[num].newColor([rgb[num*4], rgb[num*4+1], rgb[num*4+2]]);

    // if changing the hue, update the colors of the other sliders
    if (this === sliderHue) {
        const cssRgb = hsv2rgb(this.value / 360, 1, 1);
        cssRgb[0] = cssRgb[0] * 255;
        cssRgb[1] = cssRgb[1] * 255;
        cssRgb[2] = cssRgb[2] * 255;
        sliderSat.style.background = "linear-gradient(to right, white, rgb(" + cssRgb[0] + ", " + cssRgb[1] + ", " + cssRgb[2] + ")";
        sliderVal.style.background = "linear-gradient(to right, black, rgb(" + cssRgb[0] + ", " + cssRgb[1] + ", " + cssRgb[2] + ")";
    }

    // update value text
    this.parentElement.lastElementChild.innerText = this.value;

    // update the bottom squares
    squareR.style.backgroundColor = `rgb(${rgb[num*4]}, 0, 0)`;
    squareG.style.backgroundColor = `rgb(0, ${rgb[num*4+1]}, 0)`;
    squareB.style.backgroundColor = `rgb(0, 0, ${rgb[num*4+2]})`;
    squareRGB.style.backgroundColor = `rgb(${rgb[num*4]}, ${rgb[num*4+1]}, ${rgb[num*4+2]})`;

}


// generic cancel button
setupHideMessage();
function setupHideMessage() {
    const cancelButs = document.getElementsByClassName("hideBut");
    for (let i = 0; i < cancelButs.length; i++) {
        cancelButs[i].addEventListener("click", () => {

            // hide the panel belonging to this button
            cancelButs[i].parentElement.parentElement.style.display = "none";
            // then hide the black background
            cancelButs[i].parentElement.parentElement.parentElement.style.display = "none";

        });
    }
}

// default button
document.getElementById("defaultBut").addEventListener("click", () => {

    if (char.currentRGB.toString() !== char.ogColor.toString()) {
        document.getElementById("infoRegion").style.display = "flex";
        document.getElementById("undoMessage").style.display = "block";
    }

});
// confirm default
document.getElementById("confirmDefaultBut").addEventListener("click", () => {
    
    // set the colors to default
    if (char.name == "Ori and Sein") {
        char.currentRGB = [...char.actualColor];
    } else {
        char.currentRGB = [...char.ogColor];
    }

    // and paint it
    mainRecolor(char.currentRGB);

    // update all values
    updateListFull(char.currentRGB);

    // set the sliders to the first part by clicking it
    parts[char.currentPart].partDiv.click();

});

// color code button
document.getElementById("colorCodeBut").addEventListener("click", () => {
    document.getElementById("infoRegion").style.display = "flex";
    document.getElementById("colorCodeRegion").style.display = "block";
});
// buttons inside color code menu


// get image button
document.getElementById("downloadBut").addEventListener("click", () => {
    document.getElementById("downloadBut").setAttribute("download", char.name + " Recolor");
    mainRecolor(char.currentRGB, "Portrait");
});

// rgb & hsv switcher
radioHSV.addEventListener("click", changeSliders);
function changeSliders() {
    const slidersHSV = document.getElementsByClassName("sliderHSV");
    const slidersRGB = document.getElementsByClassName("sliderRGB");
    const imgHSV = document.getElementById("imgHSV");
    if (radioHSV.checked) {
        for (let i = 0; i < slidersHSV.length; i++) {
            slidersHSV[i].style.display = "inherit";
            slidersRGB[i].style.display = "none";
        }
        imgHSV.src = "Resources/Buttons/HSV.png";
    } else {
        for (let i = 0; i < slidersHSV.length; i++) {
            slidersHSV[i].style.display = "none";
            slidersRGB[i].style.display = "inherit";
        }
        imgHSV.src = "Resources/Buttons/RGB.png";
    }
}


function hex2rgb(hex) {
    const rgb = [];
    const bigint = parseInt(hex, 16);
    rgb[0] = (bigint >> 16) & 255;
    rgb[1] = (bigint >> 8) & 255;
    rgb[2] = bigint & 255;
    return rgb;
}
function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function hsv2rgb(H, S, V) {

    // translated from the in-game shader

    let C = V * S;
 
    H *= 6;
    let X = C * (1 - Math.abs( H % 2 - 1 ));
    let m = V - C;
    C += m;
    X += m;
 
    if (H < 1) return [C, X, m];
    if (H < 2) return [X, C, m];
    if (H < 3) return [m, C, X];
    if (H < 4) return [m, X, C];
    if (H < 5) return [X, m, C];
    else       return [C, m, X];

}

function rgb2hsv (r, g, b) {

    r = r/255, g = g/255, b = b/255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;

    const d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    } else {
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = h * 360;
    s = s * 100;
    v = v * 100;

    return [h, s, v];

}

//just a simple random function
function genRnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}