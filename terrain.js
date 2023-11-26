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
  let noiseChangeSpeed = 0.001; // Speed at which the terrain changes

  function generateTerrain() {
    scl = 15; // Adjust scale if needed
    buffer = 0.05; // 5% buffer
    w = p.windowWidth * (1 - 2 * buffer); // Adjust for buffer
    h = p.windowHeight * (1 - 2 * buffer); // Adjust for buffer
    cols = Math.floor(w / scl);
    rows = Math.floor(h / scl);
    terrain = [];

    for (let x = 0; x < cols; x++) {
      terrain[x] = [];
      for (let y = 0; y < rows; y++) {
        terrain[x][y] = p.map(p.noise(x * 0.1 + noiseOffsetX, y * 0.1 + noiseOffsetY), 0, 1, -100, 100);
      }
    }
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
    // drawTerrainTriangles();

    // option 2. Draw the terrain using a grid of lines
    // drawTerrainGrid();

    // option 3. Draw the terrain using contour lines
    drawTerrainContours();
  };

  function drawTerrainTriangles() {
    for (let y = 0; y < rows - 1; y++) {
      p.beginShape(p.TRIANGLE_STRIP);
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

  function drawTerrainGrid() {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let elevation = terrain[x][y];
        p.fill(p.map(elevation, -100, 100, 0, 360), 100, 100);
        p.noStroke();
        p.rect(x * scl, y * scl, scl, scl); // Rectangle representing elevation
      }
    }
  }

  function drawTerrainContours() {
    let thresh = 5; // Contour interval
  
    for (let i = 0; i < cols - 1; i++) {
      for (let j = 0; j < rows - 1; j++) {
        let a = p.floor(terrain[i][j] / thresh);
        let b = p.floor(terrain[i + 1][j] / thresh);
        let c = p.floor(terrain[i][j + 1] / thresh);
        let d = p.floor(terrain[i + 1][j + 1] / thresh);
  
        let intersections = [];
  
        // Calculate intersections with cell edges
        if (a != b) {
          let diff = p.abs(terrain[i][j] - terrain[i + 1][j]);
          let add = p.abs(terrain[i][j] - thresh * p.max(a, b));
          intersections.push({ x: i * scl + scl * add / diff, y: j * scl });
        }
  
        if (a != c) {
          let diff = p.abs(terrain[i][j] - terrain[i][j + 1]);
          let add = p.abs(terrain[i][j] - thresh * p.max(a, c));
          intersections.push({ x: i * scl, y: j * scl + scl * add / diff });
        }
  
        if (b != d) {
          let diff = p.abs(terrain[i + 1][j] - terrain[i + 1][j + 1]);
          let add = p.abs(terrain[i + 1][j] - thresh * p.max(b, d));
          intersections.push({ x: (i + 1) * scl, y: j * scl + scl * add / diff });
        }
  
        if (c != d) {
          let diff = p.abs(terrain[i][j + 1] - terrain[i + 1][j + 1]);
          let add = p.abs(terrain[i][j + 1] - thresh * p.max(c, d));
          intersections.push({ x: i * scl + scl * add / diff, y: (j + 1) * scl });
        }
  
        // Draw contour lines
        p.stroke(255);
        p.strokeWeight(0.5);
        if (intersections.length == 2) {
          p.line(intersections[0].x, intersections[0].y, intersections[1].x, intersections[1].y);
        }
      }
    }
  }
  

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    generateTerrain();
  };
});
