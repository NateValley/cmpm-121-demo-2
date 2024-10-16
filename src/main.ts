import "./style.css";

const APP_NAME = "Bello!";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

const webTitle = document.createElement("h1");
app.append(webTitle);

let isDrawing = false;
let x = 0;
let y = 0;

const webCanvas = document.createElement("canvas");
webCanvas.width = 256;
webCanvas.height = 256;
app.append(webCanvas);

const context = <CanvasRenderingContext2D>webCanvas.getContext("2d");

const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

webCanvas.addEventListener("mousedown", (event) => {
    x = event.offsetX;
    y = event.offsetY;
    isDrawing = true;
});

webCanvas.addEventListener("mousemove", (event) => {
    if (isDrawing) {
        drawLine(context, x, y, event.offsetX, event.offsetY);
        x = event.offsetX;
        y = event.offsetY;
    }
});

globalThis.addEventListener("mouseup", (event) => {
    if (isDrawing) {
        drawLine(context, x, y, event.offsetX, event.offsetY);
        x = 0;
        y = 0;
        isDrawing = false;
    }
});

clearButton.addEventListener("click", () => {
    context.clearRect(x, y, 256, 256);
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