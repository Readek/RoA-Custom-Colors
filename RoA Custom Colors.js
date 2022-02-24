"use strict";

let char; // this will hold the values from the character database
let characterImgs; // this will hold a class from "RoA WebGL Shader.js"
let charNum = 0;
let rgbSliders; // if active, the page will use rgb sliders instead of hsv ones
let direction; // will tell which animations to play when switching chars

const codeReg = "^([A-Fa-f0-9]+\-)+([A-Fa-f0-9])+$";

const charNameText = document.getElementById("charName");

const fullCanvas = document.getElementById("portCanvas");
const animCanvas = document.getElementById("animCanvas");
const extraCanvas = document.getElementById("extraCanvas");

const animDiv = document.getElementById("animDiv");

const colorCode = document.getElementById("colorCode");
const cCodeError = document.getElementById("cCodeError");
const cCodeButCopy = document.getElementById("cColorButCopy");
const cCodeButApply = document.getElementById("cColorButApply");

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

const loadedImgs = [];


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

// we preload all images so the app can feel as snappy as possible
const preloadImgs = new Promise((resolve, reject) => {

    let charCount = 0;
    
    // character imgs
    for (let i = 0; i < db.chars.length; i++) {

        loadedImgs.push(newImg(`Characters/${db.chars[i].name}/Portrait.png`))
        db.chars[i].portraitImg = loadedImgs[i+charCount];

        loadedImgs.push(newImg(`Characters/${db.chars[i].name}/Anim.png`))
        db.chars[i].idleImg = loadedImgs[i+charCount+1];

        if (db.chars[i].extra) {
            loadedImgs.push(newImg(`Characters/${db.chars[i].name}/Extra.png`));
            db.chars[i].extraImg = loadedImgs[i+charCount+2];
            charCount++;
        }

        charCount++;
        
    }

    // everything else
    loadedImgs.push(newImg("Resources/CCode Bot.png"));
    loadedImgs.push(newImg("Resources/CCode Top.png"));
    loadedImgs.push(newImg("Resources/Buttons/BlueHover.png"));
    loadedImgs.push(newImg("Resources/Buttons/BluePress.png"));
    loadedImgs.push(newImg("Resources/Buttons/CCode But.png"));
    loadedImgs.push(newImg("Resources/Buttons/GenericHover.png"));
    loadedImgs.push(newImg("Resources/Buttons/Next Pressed.png"));
    loadedImgs.push(newImg("Resources/Buttons/RedHover.png"));
    loadedImgs.push(newImg("Resources/Buttons/RedPress.png"));
    loadedImgs.push(newImg("Resources/Buttons/RGB.png"));
    loadedImgs.push(newImg("Resources/Buttons/YellowHover.png"));
    loadedImgs.push(newImg("Resources/Buttons/YellowPress.png"));
    loadedImgs.push(newImg("Resources/Parts/PartBG Hover.png"));
    loadedImgs.push(newImg("Resources/Parts/PartBG Press.png"));
    loadedImgs.push(newImg("Resources/Parts/PartBG Disabled.png"));

    // set up loading message
    document.getElementById("loadImgsTotal").innerText = loadedImgs.length;
    const loadImgsLeft = document.getElementById("loadImgsLeft");

    const imgPromises = [];
    let imgCount = 0;

    // for all images to load, decode them
    for (let i = 0; i < loadedImgs.length; i++) {
        const imgLoad = new Promise ((resolve, reject) => {
            loadedImgs[i].decode().then( () => {
                imgCount++;
                loadImgsLeft.innerText = imgCount; // if loaded, add to the counter
                resolve();
            }).catch(() => {
                reject(); // in case for any reason something fails to load
            })
        })
        imgPromises.push(imgLoad)
    }

    // when everything has finished loading
    Promise.all(imgPromises).then( () => {
        resolve();
    }).catch( () => { // if even one image failed to load
        reject();
    })

})


// first things first, test if the user can run WebGL2
if (testGL()) {

    // show loading screen
    displayMessage("loadMessage")

    // when the page loads, preload all images
    preloadImgs.then( () => {
        // if loaded, hide loading message
        document.getElementById("loadMessage").style.display = "none";
        // then hide the black background
        document.getElementById("loadMessage").parentElement.style.display = "none";
        changeChar();

        if (!localStorage.getItem("hideHelp")) {
            displayMessage("helpMessage")
        }

    }).catch( () => { // if any image failed to load
        document.getElementById("loadError").style.display = "inherit";
    });
} else {
    // display an error message
    displayMessage("noWebGL");
}

// if the user clicks on the ok button once, don't display again
document.getElementById("okHelp").addEventListener("click", () => {
    localStorage.setItem("hideHelp", "y");
})

// add event listeners to the back and forward character buttons
document.getElementById("backBut").addEventListener("click", () => {
    cssAnimate(document.getElementById("backBut"), "backBut .1s ease-out both");
    checkNextPrev(true);
});
document.getElementById("forwardBut").addEventListener("click", () => {
    cssAnimate(document.getElementById("forwardBut").parentElement, "forwardBut .1s ease-out both");
    checkNextPrev()
});
document.getElementById("confirmDiscardBut").addEventListener("click", () => {nextPrevChar()})
function checkNextPrev(dir) {
    direction = dir;
    if (char.actualColor) {
        if (char.currentRGB.toString() !== char.actualColor.toString()) {
            displayMessage("discardMessage");
        } else {
            nextPrevChar();
        }
    } else {
        if (char.currentRGB.toString() !== char.ogColor.toString()) {
            displayMessage("discardMessage");
        } else {
            nextPrevChar();
        }
    }
}
function nextPrevChar() {
    if (direction) {
        charNum == 0 ? charNum = db.chars.length - 1 : charNum--;
    } else {
        charNum == db.chars.length - 1 ? charNum = 0 : charNum++;
    }
    changeChar();
}

// whenever the character changes
function changeChar() {

    // look at the database to see whats up
    char = db.chars[charNum];
    // create a new recolor character with this info
    characterImgs = new RoaRecolor(char.ogColor, char.colorRange, char.blend);
    // add in new images to be recolored
    characterImgs.addImage(fullCanvas, char.portraitImg, "Portrait");
    characterImgs.addImage(animCanvas, char.idleImg, "Animated Sprite");
    // if the character has an extra sprite, add it
    if (char.extra) {
        extraCanvas.style.display = "inherit";
        characterImgs.addImage(extraCanvas, char.extraImg, "Extra")
    } else {
        extraCanvas.style.display = "none";
    }

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

    // used to scale the characters with css
    const r = document.querySelector(':root');
    r.style.setProperty("--portraitWidth", fullCanvas.width + "px");
    r.style.setProperty("--spriteWidth", animCanvas.width + "px");
    r.style.setProperty("--spriteCount", char.idleFC); // frame count
    // formula for this one is: 1000 is a second, then divided by 60 gets us an
    // in-game frame, then we multiply by 6 because thats the average frame
    // wait between sprite changes, and then we multiply by the character frame
    // count to know how long the animation is going to take, finally, we divide
    // by 1000 to get the value in seconds for the css variable
    r.style.setProperty("--spriteTime", 1000/60*6*char.idleFC/1000 + "s");

    if (char.extra) {
        r.style.setProperty("--extraWidth", extraCanvas.width + "px");
    }

    // set the animation for the char switch
    cssAnimate(charNameText, "charName .1s ease-out both")
    if (direction) {
        cssAnimate(document.getElementById("midLeft"), "forwardChar .4s ease-out both");
    } else {
        cssAnimate(document.getElementById("midLeft"), "backChar .4s ease-out both");
    }

    // animate color parts
    let delay = 0;
    for (let i = parts.length - 1; i > -1; i--) {
        parts[i].partDiv.parentElement.style.animation = "";
        parts[i].partDiv.parentElement.style.opacity = 0;
        setTimeout(() => {
            parts[i].partDiv.parentElement.style.opacity = 1;
            cssAnimate(parts[i].partDiv.parentElement, "colPart .05s ease-out both");
        }, delay);
        delay += 25;
    }
    
}

//the recolor function!
function mainRecolor(rgb, dl) {

    const newRGB = [...rgb];

    if (char.name == "Olympia") { // Olympia's pants colors affect all whites
        newRGB.push(char.ogColor[24], char.ogColor[25], char.ogColor[26], char.ogColor[27])
    } else if (char.name == "Orcane") { // orcane has a greenish hidden part
        for (let i = 0; i < 8; i++) { // add the 1st colors as the 3rd colors
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

    rgb[num*4] = Number(sliderR.value);
    rgb[num*4+1] = Number(sliderG.value);
    rgb[num*4+2] = Number(sliderB.value);

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
        displayMessage("undoMessage");
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
    genColorCode();
    displayMessage("colorCodeRegion");
});
function genColorCode() {
    // code modified from https://github.com/ErrorThreeOThree/ROAColorCodeBot

    const colorNum = char.actualParts ? char.actualParts : char.ogColor.length / 4;

    // separate rgb values
    let r = [], g = [], b = [];
    for (let i = 0; i < colorNum; i++) {
        r.push(char.currentRGB[i*4]);
        g.push(char.currentRGB[i*4+1]);
        b.push(char.currentRGB[i*4+2]);
    }
    
    // generate a valid checksum (this is only for the game, the webpage doesn't need this)
	let checksum = 0;
	for (let i = 0; i < colorNum; i++) {
		checksum += (i + 101) * r[i];
		checksum += (i + 102) * g[i];
		checksum += (i + 103) * b[i];
	}
    checksum = checksum % 256;
    
    // convert the rgb values to hex, add those and the checksum to a single string
    let code = "";
    let i = 0;
	for (i; i < colorNum; i++) {
		code += r[i].toString(16).toUpperCase().padStart(2, '0');
		code += g[i].toString(16).toUpperCase().padStart(2, '0');
		code += b[i].toString(16).toUpperCase().padStart(2, '0');
	}
	code += checksum.toString(16).toUpperCase().padStart(2, '0');
	if (i % 2 == 0)	{
		code += "00";
    }

    //put the code in the code input, separating the full color code with "-" every 4 characters    
    colorCode.value = code.match(/.{1,4}/g).join("-");

}
// color code input control
colorCode.addEventListener("input", () => {

    //look if the code length is correct
    if (colorCode.value.length == char.placeholder.length &&
        colorCode.value.match(codeReg)) {

       //if correct, set everything to normal
       cCodeError.innerText = "";

       // allow apply button
       cCodeButApply.disabled = false;

   } else {

       //prevent the user from interacting with the copy button
       cCodeButApply.disabled = true;

       if (!colorCode.value) { // if theres no code

           // just remove the warning text
           codeWarning.innerHTML = "";
   
       } else { // check if its above or below the limit
           if (colorCode.value.length < char.placeholder.length) {
   
               //if its below the limit, warn the user
               cCodeError.innerText = char.placeholder.length - colorCode.value.length;
       
           } else if (colorCode.value.length > char.placeholder.length) {
       
               //if its above the limit, well thats a big no no
               cCodeError.innerText = colorCode.value.length - char.placeholder.length;
       
           } else {

               // if the regex failed
               cCodeError.innerText = "Invalid code";
               
           }
   
       }

   } 
})

// copy button
cCodeButCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(colorCode.value);
    document.getElementById("copiedText").style.display = "inherit";
});
//automatically enable copy animation once current one finishes
document.getElementById("copiedText").addEventListener('animationend', () => {
    document.getElementById("copiedText").style.display = "none";
});

// apply color code button
cCodeButApply.addEventListener("click", () => {

    const rgb = hexDecode(colorCode.value); // translate the color code

    rgb.splice(rgb.length - 4); //remove the checksum at the end of the code

    // Olympia needs some special treatment since the pants colors affect all whites
    if (char.name == "Olympia") {
        rgb.push(char.ogColor[24], char.ogColor[25], char.ogColor[26], char.ogColor[27])
    }

    if (char.name == "Orcane") { // orcane has a greenish hidden part
        for (let i = 0; i < 4; i++) { // add the 1st colors as the 3rd colors
            rgb[i+8] = rgb[i];
        }
    }

    char.currentRGB = rgb;

    mainRecolor(char.currentRGB);
    updateListFull(char.currentRGB);
    parts[0].partDiv.click();

})


// generic message display function
function displayMessage(messageID) {
    document.getElementById("infoRegion").style.display = "flex";
    document.getElementById(messageID).style.display = "block";
}


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

function hexDecode(hex) {

    // delete those "-" from the code
    let newHex = hex.replace(/-/g, "");

    // split each color for every 6 characters
    const charHex = newHex.match(/.{1,6}/g);

    // create an array for the shader with rgba values
    const charRGB = [];
    for (let i = 0; i < charHex.length; i++) {
        const newArr = hex2rgb(charHex[i]);
        charRGB.push(newArr[0], newArr[1], newArr[2], 1); //r, g, b, a
    }
    return charRGB;

}

//just a simple random function
function genRnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}


function testGL() {
    if (!document.createElement("canvas").getContext("webgl2")) {
        return false;
    } else {
        return true;
    }
}


function newImg(url) {
    
    const img = new Image();
    img.src = url;
    return img;

}


function cssAnimate(el, aninfo) {
    
    el.style.animation = aninfo;
    el.getAnimations().forEach((anim) => {
        anim.cancel();
        anim.play();
    });

}