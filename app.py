from flask import Flask, render_template, request, jsonify
import heapq

app = Flask(__name__)

ROWS, COLS = 20, 30

class Cell:
    def __init__(self, row, col):
        self.row = row
        self.col = col
        self.is_obstacle = False
        self.g = float('inf')
        self.h = 0
        self.f = float('inf')
        self.parent = None

    def __lt__(self, other):
        return self.f < other.f

def heuristic(a, b):
    return abs(a.row - b.row) + abs(a.col - b.col)

def get_neighbors(grid, cell):
    directions = [(-1,0),(1,0),(0,-1),(0,1)]
    neighbors = []
    for dr, dc in directions:
        r, c = cell.row + dr, cell.col + dc
        if 0 <= r < ROWS and 0 <= c < COLS:
            neighbor = grid[r][c]
            if not neighbor.is_obstacle:
                neighbors.append(neighbor)
    return neighbors

def reconstruct_path(end):
    path = []
    current = end
    while current.parent:
        path.append((current.row, current.col))
        current = current.parent
    path.reverse()
    return path

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/find_path', methods=['POST'])
def find_path():
    data = request.json
    start = tuple(data['start'])
    end = tuple(data['end'])
    obstacles = set(tuple(ob) for ob in data['obstacles'])

    grid = [[Cell(r, c) for c in range(COLS)] for r in range(ROWS)]
    for r, c in obstacles:
        grid[r][c].is_obstacle = True

    start_cell = grid[start[0]][start[1]]
    end_cell = grid[end[0]][end[1]]

    open_set = []
    visited = []
    start_cell.g = 0
    start_cell.h = heuristic(start_cell, end_cell)
    start_cell.f = start_cell.h
    heapq.heappush(open_set, start_cell)

    while open_set:
        current = heapq.heappop(open_set)
        visited.append((current.row, current.col))

        if current == end_cell:
            path = reconstruct_path(current)
            return jsonify(path=path, visited=visited)

        for neighbor in get_neighbors(grid, current):
            tentative_g = current.g + 1
            if tentative_g < neighbor.g:
                neighbor.parent = current
                neighbor.g = tentative_g
                neighbor.h = heuristic(neighbor, end_cell)
                neighbor.f = neighbor.g + neighbor.h
                if neighbor not in open_set:
                    heapq.heappush(open_set, neighbor)

    return jsonify(path=[], visited=visited)

if __name__ == '__main__':
    app.run(debug=True)