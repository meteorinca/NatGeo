"""
Map Polygon & Point Editor v2.0
================================
A web-based tool for drawing polygons on map images and exporting 
metadata as JSON files for the Geography Quiz system.

Features:
- Draw polygons for countries/regions
- Place points for capitals/cities
- Export as JSON file for quiz app
- Support for multiple maps

Usage:
    python map_editor.py [image_file.png]
    
    If no image specified, it will list available PNGs in the maps/ folder.

Output: JSON file saved to maps/{name}_data.json
"""

import os
import sys
import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import urllib.parse
from datetime import datetime

# Configuration
PORT = 5000
MAPS_DIR = "maps"

# Ensure maps directory exists
os.makedirs(MAPS_DIR, exist_ok=True)


def get_editor_html(image_file, map_name):
    """Generate the editor HTML with the specified image."""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Map Editor - """ + map_name + """</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a2e;
            color: #eee;
            min-height: 100vh;
            display: flex;
        }
        
        .sidebar {
            width: 380px;
            background: #16213e;
            padding: 20px;
            overflow-y: auto;
            max-height: 100vh;
            border-right: 1px solid #0f3460;
            display: flex;
            flex-direction: column;
        }
        
        h1 {
            font-size: 1.3rem;
            margin-bottom: 5px;
            color: #00d9ff;
        }
        
        .map-name {
            color: #22c55e;
            font-size: 0.9rem;
            margin-bottom: 15px;
            padding: 8px;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .instructions {
            background: #0f3460;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 0.8rem;
            line-height: 1.5;
        }
        
        .instructions h3 {
            color: #00d9ff;
            margin-bottom: 6px;
            font-size: 0.9rem;
        }
        
        .instructions kbd {
            background: #1a1a2e;
            padding: 1px 5px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.85em;
        }
        
        .form-group {
            margin-bottom: 12px;
        }
        
        label {
            display: block;
            margin-bottom: 4px;
            font-weight: 600;
            color: #94a3b8;
            font-size: 0.85rem;
        }
        
        input, select {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #0f3460;
            border-radius: 6px;
            background: #1a1a2e;
            color: #eee;
            font-size: 0.95rem;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #00d9ff;
        }
        
        .btn {
            padding: 8px 14px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.2s;
            margin-right: 6px;
            margin-bottom: 6px;
        }
        
        .btn-primary { background: #00d9ff; color: #1a1a2e; }
        .btn-primary:hover { background: #00b8d9; }
        .btn-success { background: #22c55e; color: white; }
        .btn-success:hover { background: #16a34a; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .btn-secondary { background: #4b5563; color: white; }
        .btn-secondary:hover { background: #374151; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-warning:hover { background: #d97706; }
        
        .btn-large {
            padding: 12px 24px;
            font-size: 1rem;
        }
        
        .shapes-list {
            flex: 1;
            overflow-y: auto;
            margin: 15px 0;
        }
        
        .shapes-list h3 {
            margin-bottom: 8px;
            color: #00d9ff;
            font-size: 0.95rem;
            position: sticky;
            top: 0;
            background: #16213e;
            padding: 5px 0;
        }
        
        .shape-item {
            background: #0f3460;
            padding: 8px 10px;
            border-radius: 6px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.85rem;
        }
        
        .shape-item:hover { background: #1a4a7a; }
        .shape-item.selected { border: 2px solid #00d9ff; }
        
        .shape-info { flex: 1; }
        .shape-name { font-weight: 600; }
        .shape-type { font-size: 0.75rem; color: #94a3b8; }
        
        .shape-delete {
            background: #ef4444;
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .canvas-container {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 20px;
            overflow: auto;
            background: #0d1117;
        }
        
        #canvas {
            border: 2px solid #0f3460;
            border-radius: 8px;
            cursor: crosshair;
            max-width: 100%;
            height: auto;
        }
        
        .export-section {
            padding-top: 15px;
            border-top: 1px solid #0f3460;
        }
        
        .export-section h3 {
            color: #22c55e;
            margin-bottom: 10px;
            font-size: 0.95rem;
        }
        
        .status-bar {
            background: #0f3460;
            padding: 8px 10px;
            border-radius: 6px;
            margin-bottom: 12px;
            font-size: 0.85rem;
        }
        
        .status-bar .mode { color: #00d9ff; font-weight: 600; }
        .current-points { margin-top: 4px; font-size: 0.8rem; color: #94a3b8; }
        
        .success-message {
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.5);
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            font-size: 0.85rem;
            display: none;
        }
        
        .success-message.visible { display: block; }
        
        .file-path {
            font-family: monospace;
            background: #1a1a2e;
            padding: 2px 6px;
            border-radius: 3px;
            word-break: break-all;
        }
        
        .load-section {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #0f3460;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h1>🗺️ Map Region Editor</h1>
        <div class="map-name">📍 Editing: <strong>""" + map_name + """</strong></div>
        
        <div class="load-section">
            <button class="btn btn-warning" id="loadExistingBtn">📂 Load Existing Data</button>
        </div>
        
        <div class="instructions">
            <h3>Controls</h3>
            <p><strong>Left Click:</strong> Add polygon point</p>
            <p><strong>Right Click:</strong> Place capital/city point</p>
            <p><kbd>Enter</kbd> Finish polygon | <kbd>Esc</kbd> Cancel | <kbd>Del</kbd> Delete selected</p>
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
                <option value="region">🏴 Country/Region</option>
                <option value="capital">🏛️ Capital/City</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="regionId">Region ID (links capital to country)</label>
            <input type="text" id="regionId" placeholder="e.g., venezuela">
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
            <h3>💾 Save & Export</h3>
            <button class="btn btn-success btn-large" id="saveJsonBtn">💾 Save JSON File</button>
            <button class="btn btn-danger" id="clearAllBtn">🗑️ Clear All</button>
            
            <div class="success-message" id="successMessage">
                ✅ Saved successfully to:<br>
                <span class="file-path" id="savedPath"></span>
            </div>
        </div>
    </div>
    
    <div class="canvas-container">
        <canvas id="canvas"></canvas>
    </div>
    
    <script>
        const MAP_NAME = '""" + map_name + """';
        const IMAGE_FILE = '""" + image_file + """';
        
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
        img.src = '/image/' + IMAGE_FILE;
        
        // Elements
        const modeEl = document.getElementById('mode');
        const currentPointsEl = document.getElementById('currentPoints');
        const shapeNameEl = document.getElementById('shapeName');
        const shapeTypeEl = document.getElementById('shapeType');
        const regionIdEl = document.getElementById('regionId');
        const shapesListEl = document.getElementById('shapesList');
        const shapeCountEl = document.getElementById('shapeCount');
        
        // Auto-generate ID from name
        shapeNameEl.addEventListener('input', () => {
            const name = shapeNameEl.value;
            regionIdEl.value = name.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        });
        
        // Canvas click - add polygon point
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.round((e.clientX - rect.left) * scaleX);
            const y = Math.round((e.clientY - rect.top) * scaleY);
            
            currentPolygon.push({ x, y });
            isDrawing = true;
            updateStatus();
            redraw();
        });
        
        // Right-click - place capital point
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.round((e.clientX - rect.left) * scaleX);
            const y = Math.round((e.clientY - rect.top) * scaleY);
            
            const name = shapeNameEl.value || 'Unnamed';
            const id = regionIdEl.value || name.toLowerCase().replace(/\\s+/g, '-');
            
            shapes.push({
                type: 'capital',
                name: name,
                id: id,
                points: [{ x, y }]
            });
            
            shapeNameEl.value = '';
            regionIdEl.value = '';
            updateShapesList();
            redraw();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'Enter') finishPolygon();
            else if (e.key === 'Escape') cancelPolygon();
            else if (e.key === 'Delete' && selectedShapeIndex >= 0) deleteShape(selectedShapeIndex);
        });
        
        // Button handlers
        document.getElementById('finishPolygon').addEventListener('click', finishPolygon);
        document.getElementById('cancelPolygon').addEventListener('click', cancelPolygon);
        document.getElementById('saveJsonBtn').addEventListener('click', saveJson);
        document.getElementById('clearAllBtn').addEventListener('click', clearAll);
        document.getElementById('loadExistingBtn').addEventListener('click', loadExisting);
        
        function finishPolygon() {
            if (currentPolygon.length < 3) {
                alert('A polygon needs at least 3 points!');
                return;
            }
            
            const name = shapeNameEl.value || 'Unnamed';
            const type = shapeTypeEl.value;
            const id = regionIdEl.value || name.toLowerCase().replace(/\\s+/g, '-');
            
            shapes.push({
                type: type,
                name: name,
                id: id,
                points: [...currentPolygon]
            });
            
            currentPolygon = [];
            isDrawing = false;
            shapeNameEl.value = '';
            regionIdEl.value = '';
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
            if (confirm('Clear all shapes?')) {
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
                currentPointsEl.textContent = 'Enter to finish, Escape to cancel';
            } else {
                modeEl.textContent = 'Ready';
                currentPointsEl.textContent = 'Click to start drawing';
            }
        }
        
        function updateShapesList() {
            shapeCountEl.textContent = shapes.length;
            shapesListEl.innerHTML = '';
            
            shapes.forEach((shape, index) => {
                const div = document.createElement('div');
                div.className = 'shape-item' + (index === selectedShapeIndex ? ' selected' : '');
                const icon = shape.type === 'capital' ? '🏛️' : '🏴';
                div.innerHTML = `
                    <div class="shape-info">
                        <div class="shape-name">${icon} ${shape.name}</div>
                        <div class="shape-type">${shape.type} | ${shape.points.length} pts | id: ${shape.id}</div>
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
                    // Capital point
                    const pt = shape.points[0];
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, isSelected ? 12 : 8, 0, Math.PI * 2);
                    ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.8)' : 'rgba(249, 115, 22, 0.8)';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Label
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.strokeText(shape.name, pt.x + 12, pt.y + 4);
                    ctx.fillText(shape.name, pt.x + 12, pt.y + 4);
                } else {
                    // Polygon
                    ctx.beginPath();
                    ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    shape.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
                    ctx.closePath();
                    
                    ctx.fillStyle = isSelected ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.3)';
                    ctx.fill();
                    ctx.strokeStyle = isSelected ? '#22c55e' : '#3b82f6';
                    ctx.lineWidth = isSelected ? 3 : 2;
                    ctx.stroke();
                    
                    // Vertices
                    shape.points.forEach(pt => {
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
                        ctx.fillStyle = '#fff';
                        ctx.fill();
                    });
                    
                    // Centroid label
                    const cx = shape.points.reduce((s, p) => s + p.x, 0) / shape.points.length;
                    const cy = shape.points.reduce((s, p) => s + p.y, 0) / shape.points.length;
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.textAlign = 'center';
                    ctx.strokeText(shape.name, cx, cy);
                    ctx.fillText(shape.name, cx, cy);
                    ctx.textAlign = 'left';
                }
            });
            
            // Draw current polygon
            if (currentPolygon.length > 0) {
                ctx.beginPath();
                ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
                currentPolygon.forEach(pt => ctx.lineTo(pt.x, pt.y));
                ctx.strokeStyle = '#00d9ff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                currentPolygon.forEach((pt, i) => {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = i === 0 ? '#22c55e' : '#00d9ff';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
            }
        }
        
        function saveJson() {
            // Build export data
            const regions = {};
            
            shapes.forEach(shape => {
                if (!regions[shape.id]) {
                    regions[shape.id] = {
                        id: shape.id,
                        name: '',
                        capital: '',
                        polygon: [],
                        capitalPoint: null
                    };
                }
                
                if (shape.type === 'region') {
                    regions[shape.id].name = shape.name;
                    regions[shape.id].polygon = shape.points;
                } else if (shape.type === 'capital') {
                    regions[shape.id].capital = shape.name;
                    regions[shape.id].capitalPoint = shape.points[0];
                }
            });
            
            const exportData = {
                mapName: MAP_NAME,
                imageFile: IMAGE_FILE,
                imageWidth: canvas.width,
                imageHeight: canvas.height,
                createdAt: new Date().toISOString(),
                regions: Object.values(regions)
            };
            
            // Send to server to save
            fetch('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportData)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('savedPath').textContent = data.path;
                    document.getElementById('successMessage').classList.add('visible');
                    setTimeout(() => {
                        document.getElementById('successMessage').classList.remove('visible');
                    }, 5000);
                } else {
                    alert('Error saving: ' + data.error);
                }
            })
            .catch(err => alert('Error: ' + err));
        }
        
        function loadExisting() {
            fetch('/load/' + MAP_NAME)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert('No existing data found for this map.');
                    return;
                }
                
                shapes = [];
                data.regions.forEach(region => {
                    if (region.polygon && region.polygon.length > 0) {
                        shapes.push({
                            type: 'region',
                            name: region.name,
                            id: region.id,
                            points: region.polygon
                        });
                    }
                    if (region.capitalPoint) {
                        shapes.push({
                            type: 'capital',
                            name: region.capital,
                            id: region.id,
                            points: [region.capitalPoint]
                        });
                    }
                });
                
                updateShapesList();
                redraw();
                alert('Loaded ' + shapes.length + ' shapes!');
            })
            .catch(err => alert('Error loading: ' + err));
        }
        
        // Init
        updateStatus();
        updateShapesList();
    </script>
</body>
</html>
"""


class EditorHandler(SimpleHTTPRequestHandler):
    """Custom handler for the map editor."""
    
    image_file = None
    map_name = None
    
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_html(get_editor_html(self.image_file, self.map_name))
        elif self.path.startswith('/image/'):
            self.serve_image(self.path[7:])
        elif self.path.startswith('/load/'):
            self.load_json(self.path[6:])
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path == '/save':
            self.save_json()
        else:
            self.send_error(404)
    
    def send_html(self, content):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(content.encode())
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def serve_image(self, filename):
        # Try maps folder first, then current directory
        paths = [
            os.path.join(MAPS_DIR, filename),
            filename
        ]
        
        for path in paths:
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'image/png')
                self.send_header('Content-Length', len(content))
                self.end_headers()
                self.wfile.write(content)
                return
        
        self.send_error(404, f'Image not found: {filename}')
    
    def save_json(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode())
        
        # Save to maps folder
        filename = f"{data['mapName']}_data.json"
        filepath = os.path.join(MAPS_DIR, filename)
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        self.send_json({'success': True, 'path': filepath})
    
    def load_json(self, map_name):
        filename = f"{map_name}_data.json"
        filepath = os.path.join(MAPS_DIR, filename)
        
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data = json.load(f)
            self.send_json(data)
        else:
            self.send_json({'error': 'Not found'})
    
    def log_message(self, format, *args):
        pass


def find_maps():
    """Find all PNG files that could be maps."""
    maps = []
    
    # Check maps folder
    if os.path.exists(MAPS_DIR):
        for f in os.listdir(MAPS_DIR):
            if f.lower().endswith('.png'):
                maps.append((os.path.join(MAPS_DIR, f), f))
    
    # Check current directory
    for f in os.listdir('.'):
        if f.lower().endswith('.png') and 'labeled' not in f.lower():
            maps.append((f, f))
    
    return maps


def main():
    print("=" * 60)
    print("🗺️  MAP REGION EDITOR v2.0")
    print("=" * 60)
    
    # Determine which image to use
    if len(sys.argv) > 1:
        image_file = sys.argv[1]
        if not os.path.exists(image_file):
            print(f"❌ Error: Image file '{image_file}' not found!")
            return
    else:
        # List available maps
        maps = find_maps()
        
        if not maps:
            print("❌ No PNG files found!")
            print(f"   Place map images in the '{MAPS_DIR}/' folder or current directory.")
            return
        
        print("\n📍 Available maps:")
        for i, (path, name) in enumerate(maps, 1):
            # Check if data file exists
            map_name = Path(name).stem
            data_file = os.path.join(MAPS_DIR, f"{map_name}_data.json")
            status = "✅ has data" if os.path.exists(data_file) else "📝 no data yet"
            print(f"   {i}. {name} ({status})")
        
        print(f"\n   Enter number (1-{len(maps)}), or image path:")
        
        try:
            choice = input("   > ").strip()
            if choice.isdigit():
                idx = int(choice) - 1
                if 0 <= idx < len(maps):
                    image_file = maps[idx][0]
                else:
                    print("Invalid choice!")
                    return
            else:
                image_file = choice
                if not os.path.exists(image_file):
                    print(f"❌ File not found: {image_file}")
                    return
        except KeyboardInterrupt:
            print("\n\n👋 Cancelled.")
            return
    
    # Extract map name from filename
    map_name = Path(image_file).stem
    
    # Set handler class variables
    EditorHandler.image_file = os.path.basename(image_file)
    EditorHandler.map_name = map_name
    
    # Copy image to maps folder if not already there
    maps_path = os.path.join(MAPS_DIR, os.path.basename(image_file))
    if not os.path.exists(maps_path) and os.path.exists(image_file):
        import shutil
        shutil.copy(image_file, maps_path)
        print(f"\n📁 Copied image to: {maps_path}")
    
    print(f"\n📍 Editing: {map_name}")
    print(f"🖼️  Image: {image_file}")
    print(f"🌐 Server: http://localhost:{PORT}")
    print(f"\n💾 Data will be saved to: {MAPS_DIR}/{map_name}_data.json")
    print("\n🛑 Press Ctrl+C to stop\n")
    
    # Open browser
    threading.Timer(1.0, lambda: webbrowser.open(f'http://localhost:{PORT}')).start()
    
    # Start server
    server = HTTPServer(('localhost', PORT), EditorHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped.")
        server.shutdown()


if __name__ == '__main__':
    main()
