const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

const rows = 20;
const cols = 30;
const cellSize = 30;

let grid = [];
let startCell = null;
let endCell = null;
let mode = "obstacle";

function createGrid() {
  grid = [];
  for (let r = 0; r < rows; r++) {
    let row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ row: r, col: c, isObstacle: false });
    }
    grid.push(row);
  }
}

function drawGrid(path = [], visited = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      let color = "white";
      if (cell.isObstacle) color = "black";
      else if (startCell && startCell.row === r && startCell.col === c) color = "green";
      else if (endCell && endCell.row === r && endCell.col === c) color = "red";
      ctx.fillStyle = color;
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }

  for (let [r, c] of visited) {
    ctx.fillStyle = "#d3d3d3"; // light gray for visited
    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
  }

  for (let [r, c] of path) {
    ctx.fillStyle = "yellow"; // final path
    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
    ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
  }
}

canvas.addEventListener("click", (e) => {
  const col = Math.floor(e.offsetX / cellSize);
  const row = Math.floor(e.offsetY / cellSize);
  const cell = grid[row][col];

  if (mode === "obstacle") {
    if (startCell && startCell.row === row && startCell.col === col) return;
    if (endCell && endCell.row === row && endCell.col === col) return;
    cell.isObstacle = !cell.isObstacle;
  } else if (mode === "start") {
    startCell = { row, col };
  } else if (mode === "end") {
    endCell = { row, col };
  }

  drawGrid();
});

function setMode(newMode) {
  mode = newMode;
}

function clearGrid() {
  createGrid();
  startCell = null;
  endCell = null;
  drawGrid();
}

async function findPath() {
  if (!startCell || !endCell) {
    alert("Please set both start and end points.");
    return;
  }

  const obstacles = [];
  for (let row of grid) {
    for (let cell of row) {
      if (cell.isObstacle) obstacles.push([cell.row, cell.col]);
    }
  }

  const response = await fetch("/find_path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start: [startCell.row, startCell.col],
      end: [endCell.row, endCell.col],
      obstacles: obstacles
    })
  });

  const data = await response.json();
  const path = data.path;

  if (path.length === 0) {
    alert("No path found!");
    return;
  }

  let i = 0;
  const interval = setInterval(() => {
    if (i < path.length) {
      const [r, c] = path[i];
      ctx.fillStyle = "yellow";
      ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      i++;
    } else {
      clearInterval(interval);
    }
  }, 50);
}

createGrid();
drawGrid();
