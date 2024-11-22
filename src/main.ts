import "./style.css";

const APP_NAME = "my sick and twisted mind if it was a canvas....";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const webTitle = document.createElement("h1");
app.append(webTitle);

const changedEvent = new Event("drawing-changed");

const webCanvas = document.createElement("canvas");
webCanvas.width = 256;
webCanvas.height = 256;
app.append(webCanvas);

const context = <CanvasRenderingContext2D> webCanvas.getContext("2d");

const buttonsContainer = document.createElement("div");
buttonsContainer.style.cssText = `
    maxHeight: 60px;
    display: flex;
    margin: 20px;
    justifyContent: space-between;
    columnGap: 10px
`;
app.append(buttonsContainer);

const stickersContainer = document.createElement("div");
stickersContainer.style.cssText = `
    maxWidth: 60px;
    display: flex;
    margin: 20px;
    justifyContent: space-between;
    columnGap: 10px 
`;
app.append(stickersContainer);

// Clear Button
const clearButton = document.createElement("button");

// Undo/Redo Buttons
const undoButton = document.createElement("button");
undoButton.disabled = true;

const redoButton = document.createElement("button");
redoButton.disabled = true;

// Stroke Thickness Buttons
const thinButton = document.createElement("button");
thinButton.disabled = true;

const thiccButton = document.createElement("button");

// Sticker Button
const customButton = document.createElement("button");

// Export Button
const exportButton = document.createElement("button");

interface buttonItem {
    button: HTMLButtonElement;
    buttonLabel: string;
}

const buttonArray: buttonItem[] = [
    {
        button: clearButton,
        buttonLabel: "Clear",
    },
    {
        button: undoButton,
        buttonLabel: "Undo",
    },
    {
        button: redoButton,
        buttonLabel: "Redo",
    },
    {
        button: thinButton,
        buttonLabel: "Thin",
    },
    {
        button: thiccButton,
        buttonLabel: "Thicc",
    },
    {
        button: customButton,
        buttonLabel: "+",
    },
    {
        button: exportButton,
        buttonLabel: "Export (.PNG)",
    },
];

// Drawing Variables
let isDrawing = false;
let currentStroke: ReturnType<typeof createStroke> | null = null;
let currentWidth: number = 2;

// Sticker Variables
let currentSticker: ReturnType<typeof createSticker> | null = null;
const stickerArray: string[] = ["🐀", "🦇", "🐈‍⬛"];
let lastSticker: string;

// Displayable Variables
let displayArray: Displayable[] = [];
let undoneDisplays: Displayable[] = [];
let activeToolPreview: Displayable | null = null;

// An interface for all objects drawn onto the canvas
interface Displayable {
    display(context: CanvasRenderingContext2D): void;
}

// Draws a transparent circle of the brush size where mouseX, mouseY is
function createToolPreview(mouseX: number, mouseY: number): Displayable {
    return {
        display: (context: CanvasRenderingContext2D) => {
            context.save();
            //context.lineWidth = currentWidth;
            context.beginPath();
            context.arc(mouseX, mouseY, currentWidth, 0, Math.PI * 2);
            context.fillStyle = "rgba(0, 0, 0, 0.3)";
            context.fill();
            context.restore();
        },
    };
}

// Draws the selected sticker where mouseX, mouseY
function createStickerPreview(mouseX: number, mouseY: number, sticker: string): Displayable {
    return {
        display: (context: CanvasRenderingContext2D) => {
            context.save();
            context.font = "40px Arial";
            context.translate(mouseX, mouseY);
            context.rotate(currentRotation);
            context.fillText(sticker, 0, 0);
            context.restore();
        },
    };
}

// Holds all points that make a line, with the ability to display the line  
function createStroke(): Displayable & {addPoint(x: number, y: number): void;} {
    const points: { x: number; y: number }[] = [];
    const width = currentWidth;

    function display(context: CanvasRenderingContext2D) {
        if (points.length < 2) return;

        for (let i = 0; i < points.length - 1; i++) {
            drawLine(
                context,
                points[i].x,
                points[i].y,
                points[i + 1].x,
                points[i + 1].y,
                width,
            );
        }
    }

    return {
        display,
        addPoint: (x: number, y: number): void => {
            points.push({ x, y });
        },
    };
}

// Draws a sticker onto the canvas
function createSticker(mouseX: number, mouseY: number, sticker: string): Displayable {
    const rotationOffset = currentRotation;

    return {
        display: (context: CanvasRenderingContext2D) => {
            context.save();
            context.font = "40px Arial";
            context.translate(mouseX, mouseY);
            context.rotate(rotationOffset);
            context.fillText(sticker, 0, 0);
            context.restore();
        },
    };
}

// Calls display on all of the displayables in the displayArray
function displayAll(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, 256, 256);
    displayArray.forEach((stroke) => stroke.display(context));
}

// Draws a line form x1,y1 to x2,y2
function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = width;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

// Redraws all lines and checks if the undo/redo buttons should be enabled or not
webCanvas.addEventListener("drawing-changed", () => {
    displayAll(context);
    activeToolPreview?.display(context);

    if (displayArray.length != 0) {
        undoButton.disabled = false;
    } else {
        undoButton.disabled = true;
    }

    if (undoneDisplays.length != 0) {
        redoButton.disabled = false;
    } else {
        redoButton.disabled = true;
    }
});

// Redraws the canvas along with the tool preview being drawn as well
webCanvas.addEventListener("tool-moved", (event) => {
    const detail = (event as CustomEvent).detail;
    const { x, y, sticker } = detail;

    if (sticker) {
        lastSticker = sticker;
        console.log(sticker);
    }

    if (!isDrawing) {
        if (!lastSticker) {
            activeToolPreview = createToolPreview(x, y);
        } else {
            activeToolPreview = createStickerPreview(x, y, lastSticker);
        }

        displayAll(context);
        webCanvas.style.cursor = "none";
    } else {
        webCanvas.style.cursor = "default";
    }
});

// Places a sticker if selected, or start drawing a line
webCanvas.addEventListener("mousedown", (event) => {
    if (lastSticker) {
        currentSticker = createSticker(
            event.offsetX,
            event.offsetY,
            lastSticker,
        );
        displayArray.push(currentSticker);
        lastSticker = "";
    } else {
        currentStroke = createStroke();
        currentStroke.addPoint(event.offsetX, event.offsetY);
        displayArray.push(currentStroke);
    }

    isDrawing = true;
    undoneDisplays = [];
    activeToolPreview = null;
});

// Continues drawing a line
webCanvas.addEventListener("mousemove", (event) => {
    const rect = webCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const toolMovedEvent = new CustomEvent("tool-moved", {
        detail: { x: mouseX, y: mouseY },
    });

    webCanvas.dispatchEvent(toolMovedEvent);

    if (isDrawing && currentStroke) {
        currentStroke.addPoint(event.offsetX, event.offsetY);
    }

    webCanvas.dispatchEvent(changedEvent);
});

// Stops drawing the line
globalThis.addEventListener("mouseup", () => {
    if (isDrawing) {
        isDrawing = false;
        currentStroke = null;
    }
});

// ----- Clear Button -----
// Clears the canvas, displayArray, and undoneDisplays
clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, 256, 256);
    displayArray = [];
    undoneDisplays = [];
});

// ----- Undo Button -----
// Pops the most recent display object from DisplayArray
// to undoneDisplay and refreshes the canvas
undoButton.addEventListener("click", () => {
    if (displayArray.length != 0) {
        undoneDisplays.push(displayArray.pop()!);
        webCanvas.dispatchEvent(changedEvent);
    }
});

// ----- Redo Button -----
// Pops the most recent display object from undoneDisplay
// back to DisplayArray and refreshes the canvas
redoButton.addEventListener("click", () => {
    if (undoneDisplays.length != 0) {
        displayArray.push(undoneDisplays.pop()!);
        webCanvas.dispatchEvent(changedEvent);
    }
});

// ----- Thin Button -----
// Sets the player brush size to a preset thin brush
thinButton.addEventListener("click", () => {
    currentWidth = 2;
    thinButton.disabled = true;
    thiccButton.disabled = false;
});

// ----- Thicc Button -----
// Sets the player brush size to a preset thicc brush
thiccButton.addEventListener("click", () => {
    currentWidth = 4;
    thiccButton.disabled = true;
    thinButton.disabled = false;
});

// ----- Create Sticker -----
// Creates a button with the user input (Emojis or text)
customButton.addEventListener("click", () => {
    const customPrompt = String(
        window.prompt(
            "Create a custom sticker:",
            "insert text or emoji here... if you dare",
        ),
    );

    if (customPrompt) {
        createButton(customPrompt);
        customButton.remove();
        stickersContainer.append(customButton);
    }
});

// ----- Export -----
// Redraws everything onto a larger canvas and downloads
exportButton.addEventListener("click", () => {
    const tempCanvas = document.createElement("canvas");
    const tempContext = <CanvasRenderingContext2D> tempCanvas.getContext("2d");

    tempCanvas.width = 1024;
    tempCanvas.height = 1024;

    tempContext.scale(4, 4);
    displayAll(tempContext);

    const anchor = document.createElement("a");
    anchor.href = tempCanvas.toDataURL("image/png");
    anchor.download = "twistedpad.png";
    anchor.click();
});

// ------------------------------
// ----- Append UI -----
// ------------------------------
// Append and display all interactible user items
// Append all buttons
for (let i = 0; i < buttonArray.length; i++) {
    buttonArray[i].button.style.fontSize = "18px";
    buttonArray[i].button.innerHTML = buttonArray[i].buttonLabel;
    buttonsContainer.append(buttonArray[i].button);
}

// -- Stickers --
// Append all of the stickers
for (let i = 0; i < stickerArray.length; i++) {
    createButton(stickerArray[i]);
}

// Creates a new sticker button with provided text
function createButton(sticker: string) {
    const newButton = document.createElement("button");

    newButton.style.fontSize = "20px";
    newButton.innerHTML = sticker;
    stickersContainer.append(newButton);

    newButton.addEventListener("click", function () {
        const toolMovedEvent = new CustomEvent("tool-moved", {
            detail: { sticker: sticker },
        });

        webCanvas.dispatchEvent(toolMovedEvent);
    });

    for (let i = 0; i < stickerArray.length; i++) {
        if (stickerArray[i] == sticker) {
            customButton.remove();
            stickersContainer.append(customButton);
            return;
        }
    }

    stickerArray.push(sticker);
}

// -- Slider --
let currentRotation = 0;

const rotateLabel = document.createElement("label");
rotateLabel.innerHTML = "rotate";
app.append(rotateLabel);

const rotateSlider = document.createElement("input");
rotateSlider.type = "range";
rotateSlider.name = "rotation";
rotateSlider.min = "0";
rotateSlider.max = "360";
app.append(rotateSlider);

const rotateSliderLabel = document.createElement("label");
rotateSlider.valueAsNumber = currentRotation;
rotateSliderLabel.innerHTML = "" + rotateSlider.valueAsNumber;
app.append(rotateSliderLabel);

rotateSlider.addEventListener("input", function () {
    currentRotation = rotateSlider.valueAsNumber;
    rotateSliderLabel.innerHTML = "" + rotateSlider.valueAsNumber;
});
