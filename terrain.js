import p5 from 'p5';
import '/style.css'; 

new p5((p) => {
  let cols, rows;
  let scl; // Scale of each cell in the grid
  let w, h; // Width and height of the terrain
  let buffer; // Buffer percentage
  let terrain = [];
  let noiseOffsetX = 0;
  let noiseOffsetY = 0;
  let noiseChangeSpeed = 0.01; // Speed at which the terrain changes
  let thresh = 15;
  let useCA = false; // false for Perlin noise, true for CA


  function generateTerrain() {
    scl = 18; // Adjust scale if needed
    buffer = 0.05; // 5% buffer
    w = p.windowWidth * (1 - 2 * buffer); // Adjust for buffer
    h = p.windowHeight * (1 - 2 * buffer); // Adjust for buffer
    cols = Math.floor(w / scl);
    rows = Math.floor(h / scl);
    terrain = [];
  
    // Initialize the terrain array
    for (let x = 0; x < cols; x++) {
      terrain[x] = [];
      for (let y = 0; y < rows; y++) {
        // Use Perlin noise or some other initial value
        terrain[x][y] = p.map(p.noise(x * 0.1 + noiseOffsetX, y * 0.1 + noiseOffsetY), 0, 1, -100, 100);
      }
    }
  
    // Apply CA rules only if useCA is true
    if (useCA) {
      for (let x = 1; x < cols - 1; x++) {
        for (let y = 1; y < rows - 1; y++) {
          terrain[x][y] += applyCARules(x, y);
        }
      }
    }
  }
  
  p.keyPressed = () => {
    if (p.key === 'c') {
      useCA = !useCA;
      console.log(useCA)
      generateTerrain(); // Regenerate terrain with the new method
    }
  };


  function applyCARules(x, y) {
    let count = 0;
    let CARthreshold = 50; // Define a threshold for elevation
    let elevDelta = 10; // Define the elevation change value
  
    // Check neighbors within the grid
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let nx = x + i;
        let ny = y + j;
  
        // Skip the current cell and check bounds
        if ((i !== 0 || j !== 0) && nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          if (terrain[nx][ny] > CARthreshold) {
            count++;
          }
        }
      }
    }
  
    // Apply a simple rule based on the count
    if (count > 4) return elevDelta;
    else if (count < 2) return -elevDelta;
    return 0; // No change
  }  


  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
    generateTerrain();
    p.colorMode(p.HSB);
  };

  p.draw = () => {
    p.background(0);

    // Update terrain with new noise offsets
    generateTerrain();
    noiseOffsetX += noiseChangeSpeed;
    noiseOffsetY += noiseChangeSpeed;

    // Centering the terrain on the canvas
    p.translate(-w / 2, -h / 2);

    // Choose one of the methods by uncommenting it:

    // option 1. Draw the terrain using TRIANGLE_STRIP
    drawTerrainTriangles();

    // option 2. Draw the terrain using a grid of lines
    // drawTerrainGrid();

    // option 3. Draw the terrain using contour lines
    // drawTerrainContours();

    // option 4. Draw the grid with fill raster cells
      // drawTerrainGridFill();
  };

  function drawTerrainTriangles() {
    for (let y = 0; y < rows - 1; y++) {
      p.beginShape(p.QUAD_STRIP);
      for (let x = 0; x < cols; x++) {
        let elevation = terrain[x][y];
        p.stroke(p.map(elevation, -100, 100, 0, 360), 100, 100);
        p.noFill();
        p.vertex(x * scl, y * scl, elevation);
        p.vertex(x * scl, (y + 1) * scl, terrain[x][y + 1]);
      }
      p.endShape();
    }
  }

  function drawTerrainGridFill() {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let elevation = terrain[x][y];
        p.fill(p.map(elevation, -100, 100, 0, 360), 100, 100);
        p.stroke(0.5);
        p.rect(x * scl, y * scl, scl, scl); // Rectangle representing elevation
      }
    }
  }

  function drawTerrainGrid() {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let elevation = terrain[x][y];
        // Set the stroke color based on elevation
        p.stroke(p.map(elevation, -100, 100, 0, 360), 100, 100);
        p.strokeWeight(1); // Adjust stroke weight as needed
        // Set the fill to transparent or a solid color
        p.fill(0, 0, 0, 0); // Transparent fill
        // p.fill(255); // Alternatively, a solid fill like white
        p.rect(x * scl, y * scl, scl, scl); // Rectangle representing elevation
      }
    }
  }
  
  function drawTerrainContours() {
    let thresh = 15; // Contour interval
  
    for (let i = 0; i < cols - 1; i++) {
      for (let j = 0; j < rows - 1; j++) {
        // Calculate state of the cell
        let a = (terrain[i][j] >= thresh) ? 1 : 0;
        let b = (terrain[i + 1][j] >= thresh) ? 1 : 0;
        let c = (terrain[i + 1][j + 1] >= thresh) ? 1 : 0;
        let d = (terrain[i][j + 1] >= thresh) ? 1 : 0;
        let state = a * 8 + b * 4 + c * 2 + d * 1;
  
        // Calculate interpolation points
        let points = calculateIntersections(i, j, a, b, c, d);
  
        // Draw lines based on the state
        p.stroke(255);
        p.strokeWeight(2);
        drawStateLines(state, points);
      }
    }
  }
  
  function calculateIntersections(i, j) {
    let points = {
      a: p.createVector(),
      b: p.createVector(),
      c: p.createVector(),
      d: p.createVector()
    };
  
    // Interpolate along edges to find intersection points
    let t; // interpolation factor
  
    // Top edge (between a and b)
    t = (thresh - terrain[i][j]) / (terrain[i + 1][j] - terrain[i][j]);
    points.a.x = p.lerp(i * scl, (i + 1) * scl, t);
    points.a.y = j * scl;
  
    // Right edge (between b and c)
    t = (thresh - terrain[i + 1][j]) / (terrain[i + 1][j + 1] - terrain[i + 1][j]);
    points.b.x = (i + 1) * scl;
    points.b.y = p.lerp(j * scl, (j + 1) * scl, t);
  
    // Bottom edge (between c and d)
    t = (thresh - terrain[i + 1][j + 1]) / (terrain[i][j + 1] - terrain[i + 1][j + 1]);
    points.c.x = p.lerp(i * scl, (i + 1) * scl, t);
    points.c.y = (j + 1) * scl;
  
    // Left edge (between a and d)
    t = (thresh - terrain[i][j + 1]) / (terrain[i][j] - terrain[i][j + 1]);
    points.d.x = i * scl;
    points.d.y = p.lerp(j * scl, (j + 1) * scl, t);
  
    return points;
  }
  
    
  function drawStateLines(state, points) {
    // Draw curves based on the state of the cell
    switch (state) {
      case 1:
        drawCurve(points.c, points.d);
        break;
      case 2:
        drawCurve(points.b, points.c);
        break;
      case 3:
        drawCurve(points.b, points.d);
        break;
      case 4:
        drawCurve(points.a, points.b);
        break;
      case 5:
        drawCurve(points.a, points.d);
        drawCurve(points.b, points.c);
        break;
      case 6:
        drawCurve(points.a, points.c);
        break;
      case 7:
        drawCurve(points.a, points.d);
        break;
      case 8:
        drawCurve(points.a, points.d);
        break;
      case 9:
        drawCurve(points.a, points.c);
        break;
      case 10:
        drawCurve(points.a, points.b);
        drawCurve(points.c, points.d);
        break;
      case 11:
        drawCurve(points.a, points.b);
        break;
      case 12:
        drawCurve(points.b, points.d);
        break;
      case 13:
        drawCurve(points.b, points.c);
        break;
      case 14:
        drawCurve(points.c, points.d);
        break;
      // Cases where no lines are drawn
      case 0:
      case 15:
        break;
    }
  }
  
  function drawCurve(startPoint, endPoint) {
    p.beginShape();
    p.curveVertex(startPoint.x, startPoint.y); // Start control point
    p.curveVertex(startPoint.x, startPoint.y); // Start point
    p.curveVertex(endPoint.x, endPoint.y);     // End point
    p.curveVertex(endPoint.x, endPoint.y);     // End control point
    p.endShape();
  }
  
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    generateTerrain();
  };
});