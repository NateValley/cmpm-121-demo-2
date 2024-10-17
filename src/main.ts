import "./style.css";

const APP_NAME = "Bello!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const webTitle = document.createElement("h1");
app.append(webTitle);

let isDrawing = false;

let pointsArray: number[][][] = []

const webCanvas = document.createElement("canvas");
webCanvas.width = 256;
webCanvas.height = 256;
app.append(webCanvas);

const context = <CanvasRenderingContext2D>webCanvas.getContext("2d");

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

const changedEvent = new Event("drawing-changed");
let strokeIndex = 0;

webCanvas.addEventListener("drawing-changed", (event) => {
    context.clearRect(0, 0, 256, 256);

    for (let i = 0; i < pointsArray.length; i++)
    {
        for (let j = 1; j < pointsArray[i].length; j++)
        {
            drawLine(context, pointsArray[i][j-1][0], pointsArray[i][j-1][1], pointsArray[i][j][0], pointsArray[i][j][1]);
        }
    }
});

webCanvas.addEventListener("mousedown", (event) => {
    pointsArray.push([]);
    pointsArray[strokeIndex].push([event.offsetX, event.offsetY]);
    webCanvas.dispatchEvent(changedEvent)
    isDrawing = true;
});

webCanvas.addEventListener("mousemove", (event) => {
    if (isDrawing) {
        pointsArray[strokeIndex].push([event.offsetX, event.offsetY]);
        webCanvas.dispatchEvent(changedEvent)
    }
});

globalThis.addEventListener("mouseup", (event) => {
    if (isDrawing) {
        strokeIndex++;
        isDrawing = false;
    }
});

clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, 256, 256);
    pointsArray = [];
    strokeIndex = 0;
});

function drawLine (context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}