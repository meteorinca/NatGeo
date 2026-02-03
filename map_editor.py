"""
Map Polygon & Point Editor
===========================
A web-based tool for drawing polygons on a map image and exporting 
coordinates in a format compatible with the South America Geography Quiz.

Usage:
    python map_editor.py

Then open http://localhost:5000 in your browser.

Controls:
- Click to add polygon points
- Press 'Enter' or click 'Finish Polygon' to complete a polygon
- Right-click to place a capital point
- Press 'Escape' to cancel current polygon
- Click on a shape to select/delete it

Output: JavaScript code ready to paste into app.js
"""

import os
import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import urllib.parse

# Configuration
PORT = 5000
IMAGE_FILE = "unlabeledReliefMap.png"  # The map image to annotate

# HTML/JS for the editor interface
EDITOR_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Map Region Editor</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a2e;
            color: #eee;
            min-height: 100vh;
            display: flex;
        }
        
        .sidebar {
            width: 350px;
            background: #16213e;
            padding: 20px;
            overflow-y: auto;
            max-height: 100vh;
            border-right: 1px solid #0f3460;
        }
        
        h1 {
            font-size: 1.4rem;
            margin-bottom: 10px;
            color: #00d9ff;
        }
        
        .instructions {
            background: #0f3460;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.85rem;
            line-height: 1.6;
        }
        
        .instructions h3 {
            color: #00d9ff;
            margin-bottom: 8px;
        }
        
        .instructions kbd {
            background: #1a1a2e;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #94a3b8;
        }
        
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #0f3460;
            border-radius: 6px;
            background: #1a1a2e;
            color: #eee;
            font-size: 1rem;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #00d9ff;
        }
        
        .btn {
            padding: 10px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.2s;
            margin-right: 8px;
            margin-bottom: 8px;
        }
        
        .btn-primary {
            background: #00d9ff;
            color: #1a1a2e;
        }
        
        .btn-primary:hover {
            background: #00b8d9;
        }
        
        .btn-success {
            background: #22c55e;
            color: white;
        }
        
        .btn-success:hover {
            background: #16a34a;
        }
        
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        
        .btn-danger:hover {
            background: #dc2626;
        }
        
        .btn-secondary {
            background: #4b5563;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #374151;
        }
        
        .shapes-list {
            margin-top: 20px;
        }
        
        .shapes-list h3 {
            margin-bottom: 10px;
            color: #00d9ff;
        }
        
        .shape-item {
            background: #0f3460;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .shape-item:hover {
            background: #1a4a7a;
        }
        
        .shape-item.selected {
            border: 2px solid #00d9ff;
        }
        
        .shape-info {
            flex: 1;
        }
        
        .shape-name {
            font-weight: 600;
        }
        
        .shape-type {
            font-size: 0.8rem;
            color: #94a3b8;
        }
        
        .shape-delete {
            background: #ef4444;
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .canvas-container {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
            overflow: auto;
        }
        
        #canvas {
            border: 2px solid #0f3460;
            border-radius: 8px;
            cursor: crosshair;
        }
        
        .export-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #0f3460;
        }
        
        .export-output {
            width: 100%;
            height: 200px;
            background: #1a1a2e;
            border: 1px solid #0f3460;
            border-radius: 6px;
            padding: 10px;
            color: #22c55e;
            font-family: monospace;
            font-size: 0.8rem;
            resize: vertical;
        }
        
        .status-bar {
            background: #0f3460;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-size: 0.9rem;
        }
        
        .status-bar .mode {
            color: #00d9ff;
            font-weight: 600;
        }
        
        .current-points {
            margin-top: 5px;
            font-size: 0.8rem;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h1>🗺️ Map Region Editor</h1>
        
        <div class="instructions">
            <h3>Controls</h3>
            <p><strong>Left Click:</strong> Add polygon point</p>
            <p><strong>Right Click:</strong> Place capital point</p>
            <p><kbd>Enter</kbd> Finish current polygon</p>
            <p><kbd>Escape</kbd> Cancel current polygon</p>
            <p><kbd>Delete</kbd> Remove selected shape</p>
        </div>
        
        <div class="status-bar">
            <div>Mode: <span class="mode" id="mode">Ready</span></div>
            <div class="current-points" id="currentPoints">Click to start drawing</div>
        </div>
        
        <div class="form-group">
            <label for="shapeName">Name (e.g., "Venezuela" or "Caracas")</label>
            <input type="text" id="shapeName" placeholder="Enter name...">
        </div>
        
        <div class="form-group">
            <label for="shapeType">Type</label>
            <select id="shapeType">
                <option value="country">🏴 Country</option>
                <option value="capital">🏛️ Capital</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="countryId">Country ID (lowercase, e.g., "venezuela")</label>
            <input type="text" id="countryId" placeholder="country-id">
        </div>
        
        <div>
            <button class="btn btn-primary" id="finishPolygon">✓ Finish Polygon</button>
            <button class="btn btn-secondary" id="cancelPolygon">✕ Cancel</button>
        </div>
        
        <div class="shapes-list">
            <h3>Shapes (<span id="shapeCount">0</span>)</h3>
            <div id="shapesList"></div>
        </div>
        
        <div class="export-section">
            <h3 style="color: #22c55e; margin-bottom: 10px;">Export</h3>
            <button class="btn btn-success" id="exportBtn">📋 Generate Code</button>
            <button class="btn btn-secondary" id="copyBtn">Copy to Clipboard</button>
            <button class="btn btn-danger" id="clearAllBtn">🗑️ Clear All</button>
            <textarea class="export-output" id="exportOutput" readonly placeholder="Click 'Generate Code' to see output..."></textarea>
        </div>
    </div>
    
    <div class="canvas-container">
        <canvas id="canvas"></canvas>
    </div>
    
    <script>
        // State
        let shapes = [];
        let currentPolygon = [];
        let selectedShapeIndex = -1;
        let isDrawing = false;
        
        // Canvas setup
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            redraw();
        };
        img.src = '""" + IMAGE_FILE + """';
        
        // Elements
        const modeEl = document.getElementById('mode');
        const currentPointsEl = document.getElementById('currentPoints');
        const shapeNameEl = document.getElementById('shapeName');
        const shapeTypeEl = document.getElementById('shapeType');
        const countryIdEl = document.getElementById('countryId');
        const shapesListEl = document.getElementById('shapesList');
        const shapeCountEl = document.getElementById('shapeCount');
        const exportOutput = document.getElementById('exportOutput');
        
        // Auto-generate ID from name
        shapeNameEl.addEventListener('input', () => {
            const name = shapeNameEl.value;
            countryIdEl.value = name.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z-]/g, '');
        });
        
        // Canvas click handler
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.round((e.clientX - rect.left) * scaleX);
            const y = Math.round((e.clientY - rect.top) * scaleY);
            
            // Add point to current polygon
            currentPolygon.push({ x, y });
            isDrawing = true;
            updateStatus();
            redraw();
        });
        
        // Right-click for capital points
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.round((e.clientX - rect.left) * scaleX);
            const y = Math.round((e.clientY - rect.top) * scaleY);
            
            // Create a single-point "polygon" for capital
            const name = shapeNameEl.value || 'Unnamed Capital';
            const id = countryIdEl.value || 'unnamed';
            
            shapes.push({
                type: 'capital',
                name: name,
                id: id,
                points: [{ x, y }]
            });
            
            shapeNameEl.value = '';
            countryIdEl.value = '';
            updateShapesList();
            redraw();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishPolygon();
            } else if (e.key === 'Escape') {
                cancelPolygon();
            } else if (e.key === 'Delete' && selectedShapeIndex >= 0) {
                deleteShape(selectedShapeIndex);
            }
        });
        
        // Buttons
        document.getElementById('finishPolygon').addEventListener('click', finishPolygon);
        document.getElementById('cancelPolygon').addEventListener('click', cancelPolygon);
        document.getElementById('exportBtn').addEventListener('click', generateExport);
        document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
        document.getElementById('clearAllBtn').addEventListener('click', clearAll);
        
        function finishPolygon() {
            if (currentPolygon.length < 3) {
                alert('A polygon needs at least 3 points!');
                return;
            }
            
            const name = shapeNameEl.value || 'Unnamed';
            const type = shapeTypeEl.value;
            const id = countryIdEl.value || name.toLowerCase().replace(/\\s+/g, '-');
            
            shapes.push({
                type: type,
                name: name,
                id: id,
                points: [...currentPolygon]
            });
            
            currentPolygon = [];
            isDrawing = false;
            shapeNameEl.value = '';
            countryIdEl.value = '';
            updateStatus();
            updateShapesList();
            redraw();
        }
        
        function cancelPolygon() {
            currentPolygon = [];
            isDrawing = false;
            updateStatus();
            redraw();
        }
        
        function deleteShape(index) {
            shapes.splice(index, 1);
            selectedShapeIndex = -1;
            updateShapesList();
            redraw();
        }
        
        function clearAll() {
            if (confirm('Are you sure you want to clear all shapes?')) {
                shapes = [];
                currentPolygon = [];
                selectedShapeIndex = -1;
                isDrawing = false;
                updateStatus();
                updateShapesList();
                redraw();
            }
        }
        
        function updateStatus() {
            if (isDrawing) {
                modeEl.textContent = `Drawing (${currentPolygon.length} points)`;
                currentPointsEl.textContent = 'Press Enter to finish, Escape to cancel';
            } else {
                modeEl.textContent = 'Ready';
                currentPointsEl.textContent = 'Click to start drawing a polygon';
            }
        }
        
        function updateShapesList() {
            shapeCountEl.textContent = shapes.length;
            shapesListEl.innerHTML = '';
            
            shapes.forEach((shape, index) => {
                const div = document.createElement('div');
                div.className = 'shape-item' + (index === selectedShapeIndex ? ' selected' : '');
                div.innerHTML = `
                    <div class="shape-info">
                        <div class="shape-name">${shape.type === 'capital' ? '🏛️' : '🏴'} ${shape.name}</div>
                        <div class="shape-type">${shape.type} | ${shape.points.length} points | id: ${shape.id}</div>
                    </div>
                    <button class="shape-delete" data-index="${index}">×</button>
                `;
                
                div.addEventListener('click', (e) => {
                    if (e.target.classList.contains('shape-delete')) {
                        deleteShape(parseInt(e.target.dataset.index));
                    } else {
                        selectedShapeIndex = index;
                        updateShapesList();
                        redraw();
                    }
                });
                
                shapesListEl.appendChild(div);
            });
        }
        
        function redraw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Draw completed shapes
            shapes.forEach((shape, index) => {
                const isSelected = index === selectedShapeIndex;
                
                if (shape.type === 'capital' || shape.points.length === 1) {
                    // Draw capital as a circle
                    const pt = shape.points[0];
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, isSelected ? 12 : 8, 0, Math.PI * 2);
                    ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.8)' : 'rgba(249, 115, 22, 0.8)';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Label
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.strokeText(shape.name, pt.x + 15, pt.y + 5);
                    ctx.fillText(shape.name, pt.x + 15, pt.y + 5);
                } else {
                    // Draw polygon
                    ctx.beginPath();
                    ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    shape.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
                    ctx.closePath();
                    
                    ctx.fillStyle = isSelected ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.3)';
                    ctx.fill();
                    ctx.strokeStyle = isSelected ? '#22c55e' : '#3b82f6';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    ctx.stroke();
                    
                    // Draw vertices
                    shape.points.forEach(pt => {
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                        ctx.fillStyle = '#fff';
                        ctx.fill();
                    });
                    
                    // Centroid label
                    const cx = shape.points.reduce((s, p) => s + p.x, 0) / shape.points.length;
                    const cy = shape.points.reduce((s, p) => s + p.y, 0) / shape.points.length;
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.textAlign = 'center';
                    ctx.strokeText(shape.name, cx, cy);
                    ctx.fillText(shape.name, cx, cy);
                    ctx.textAlign = 'left';
                }
            });
            
            // Draw current polygon in progress
            if (currentPolygon.length > 0) {
                ctx.beginPath();
                ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
                currentPolygon.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.strokeStyle = '#00d9ff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw vertices
                currentPolygon.forEach((pt, i) => {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
                    ctx.fillStyle = i === 0 ? '#22c55e' : '#00d9ff';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
            }
        }
        
        function generateExport() {
            // Group shapes by country ID
            const countries = {};
            
            shapes.forEach(shape => {
                if (!countries[shape.id]) {
                    countries[shape.id] = {
                        id: shape.id,
                        name: '',
                        capital: '',
                        polygon: '',
                        capitalPoint: null
                    };
                }
                
                if (shape.type === 'country') {
                    countries[shape.id].name = shape.name;
                    countries[shape.id].polygon = shape.points.map(p => `${p.x},${p.y}`).join(' ');
                } else if (shape.type === 'capital') {
                    countries[shape.id].capital = shape.name;
                    countries[shape.id].capitalPoint = shape.points[0];
                }
            });
            
            // Generate JavaScript array
            let output = 'const geographyData = [\\n';
            
            Object.values(countries).forEach(country => {
                output += '    {\\n';
                output += `        id: '${country.id}',\\n`;
                output += `        name: '${country.name}',\\n`;
                output += `        capital: '${country.capital}',\\n`;
                output += `        polygon: '${country.polygon}'`;
                if (country.capitalPoint) {
                    output += `,\\n        capitalPoint: { x: ${country.capitalPoint.x}, y: ${country.capitalPoint.y} }`;
                }
                output += '\\n    },\\n';
            });
            
            output += '];';
            
            exportOutput.value = output;
        }
        
        function copyToClipboard() {
            exportOutput.select();
            document.execCommand('copy');
            alert('Copied to clipboard!');
        }
        
        // Initial update
        updateStatus();
        updateShapesList();
    </script>
</body>
</html>
"""

class EditorHandler(SimpleHTTPRequestHandler):
    """Custom handler to serve the editor and map image."""
    
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            # Serve the editor HTML
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(EDITOR_HTML.encode())
        elif self.path == '/' + IMAGE_FILE or self.path == '/' + urllib.parse.quote(IMAGE_FILE):
            # Serve the map image
            self.serve_image()
        else:
            # Try to serve other files
            super().do_GET()
    
    def serve_image(self):
        """Serve the map image file."""
        try:
            with open(IMAGE_FILE, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-type', 'image/png')
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, f'Image file not found: {IMAGE_FILE}')
    
    def log_message(self, format, *args):
        """Suppress logging for cleaner output."""
        pass


def main():
    """Start the map editor server."""
    # Check if image exists
    if not os.path.exists(IMAGE_FILE):
        print(f"❌ Error: Image file '{IMAGE_FILE}' not found!")
        print(f"   Make sure you're running this from the same directory as the map image.")
        return
    
    print("=" * 60)
    print("🗺️  MAP REGION EDITOR")
    print("=" * 60)
    print(f"\n📍 Image file: {IMAGE_FILE}")
    print(f"🌐 Starting server at: http://localhost:{PORT}")
    print("\n📝 Instructions:")
    print("   1. Left-click to add polygon points")
    print("   2. Press Enter to finish a polygon")
    print("   3. Right-click to place a capital point")
    print("   4. Click 'Generate Code' to get JavaScript output")
    print("\n🛑 Press Ctrl+C to stop the server\n")
    
    # Open browser
    def open_browser():
        webbrowser.open(f'http://localhost:{PORT}')
    
    threading.Timer(1.0, open_browser).start()
    
    # Start server
    server = HTTPServer(('localhost', PORT), EditorHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Goodbye!")
        server.shutdown()


if __name__ == '__main__':
    main()
