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
  let noiseChangeSpeed = 0.02; // Speed at which the terrain changes

  function generateTerrain() {
    scl = 10; // Adjust scale if needed
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

    // Draw the terrain
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
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    generateTerrain();
  };
});