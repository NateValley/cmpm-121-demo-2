import "./style.css";

const APP_NAME = "Bello!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const webTitle = document.createElement("h1");
app.append(webTitle);

let isDrawing = false;

const changedEvent = new Event("drawing-changed");

const webCanvas = document.createElement("canvas");
webCanvas.width = 256;
webCanvas.height = 256;
app.append(webCanvas);

const context = <CanvasRenderingContext2D>webCanvas.getContext("2d");

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);
undoButton.disabled = true;

const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);
redoButton.disabled = true;

const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
app.append(thinButton);
thinButton.disabled = true;

const thiccButton = document.createElement("button");
thiccButton.innerHTML = "Thicc";
app.append(thiccButton);

let currentStroke: ReturnType<typeof createStroke> | null = null;
let currentWidth: number = 1;

let displayArray: Displayable[] = [];
let undoneDisplays: Displayable[] = [];


interface Displayable {
    display (context: CanvasRenderingContext2D): void;
}

function createToolPreview(mouseX: number, mouseY: number): Displayable {
    return {
        display: (context: CanvasRenderingContext2D) => {
            context.save();
            context.beginPath();
            context.arc(mouseX, mouseY, 10 ,0, Math.PI * 2);
            context.fillStyle = "rgba(0, 0, 0, 0.3)";
            context.fill();
            context.restore();
        }
    };
}

function createStroke(): Displayable & { addPoint (x: number, y: number): void } {
    const points: { x: number; y: number }[] = [];
    const width = currentWidth;

    function display(context: CanvasRenderingContext2D) {
        if (points.length < 2) return;

        for (let i = 0; i < points.length - 1; i++) {
            drawLine(context, points[i].x, points[i].y, points[i+1].x, points[i+1].y, width);
        }
    }

    return {
        display,
        addPoint: (x: number, y: number): void => {
            points.push({ x, y });
        }
    };
}

function displayAll(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, 256, 256);
    displayArray.forEach(stroke => stroke.display(context));
}

function drawLine (context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = width;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

let activeToolPreview: Displayable | null = null;

webCanvas.addEventListener("drawing-changed", (event) => {
    displayAll(context);
    activeToolPreview?.display(context);
    
    if (displayArray.length != 0) {
        undoButton.disabled = false;
    }
    else
    {
        undoButton.disabled = true;
    }

    if (undoneDisplays.length != 0) {
        redoButton.disabled = false;
    }
    else
    {
        redoButton.disabled = true;
    }
});

webCanvas.addEventListener("tool-moved", (event) => {
    const detail = (event as CustomEvent).detail;
    const { x, y } = detail;

    if (!isDrawing) {
        activeToolPreview = createToolPreview(x, y);
        displayAll(context);
        webCanvas.style.cursor = "none";
    }
    else
    {
        webCanvas.style.cursor = "default";
    }
});

webCanvas.addEventListener("mousedown", (event) => {
    currentStroke = createStroke();
    currentStroke.addPoint(event.offsetX, event.offsetY);
    displayArray.push(currentStroke);
    isDrawing = true;
    undoneDisplays = [];
    activeToolPreview = null;
});

webCanvas.addEventListener("mousemove", (event) => {
    const rect = webCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const toolMovedEvent = new CustomEvent("tool-moved", {
        detail: { x: mouseX, y: mouseY }
    });
    
    webCanvas.dispatchEvent(toolMovedEvent);

    if (!isDrawing) {
        activeToolPreview = createToolPreview(mouseX, mouseY);
    }

    if (isDrawing && currentStroke) {
        currentStroke.addPoint(event.offsetX, event.offsetY);
    }

    webCanvas.dispatchEvent(changedEvent);
});

globalThis.addEventListener("mouseup", (event) => {
    if (isDrawing) {
        isDrawing = false;
        currentStroke = null;
    }
});

clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, 256, 256);
    displayArray = [];
    undoneDisplays = [];
});

undoButton.addEventListener("click", () => {
    if (displayArray.length != 0)
    {
        undoneDisplays.push(displayArray.pop()!);
        webCanvas.dispatchEvent(changedEvent);
    }
});

redoButton.addEventListener("click", () => {
    if (undoneDisplays.length != 0)
    {
        displayArray.push(undoneDisplays.pop()!);
        webCanvas.dispatchEvent(changedEvent);
    }
});

thinButton.addEventListener("click", () => {
    currentWidth = 1;
    thinButton.disabled = true;
    thiccButton.disabled = false;
});

thiccButton.addEventListener("click", () => {
    currentWidth = 4;
    thiccButton.disabled = true;
    thinButton.disabled = false;
});