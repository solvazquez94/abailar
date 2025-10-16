let video;
let poseNet;
let poses = [];
let hearts = [];
let fallingHearts = [];
let score = 0;
let modelLoaded = false;
let cameraReady = false;
let music;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Iniciar captura de video
    video = createCapture(VIDEO, videoReady);
    video.size(width, height);
    video.hide();
    
    // Cargar música romántica
    music = createAudio('https://www.bensound.com/bensound-music/bensound-romantic.mp3');
    music.loop();
    
    document.getElementById('status').textContent = 'Iniciando cámara...';
}

function videoReady() {
    console.log('Video listo');
    cameraReady = true;
    document.getElementById('status').textContent = 'Cargando modelo de detección...';
    
    // Cargar modelo PoseNet después de que el video esté listo
    poseNet = ml5.poseNet(video, {
        architecture: 'MobileNetV1',
        imageScaleFactor: 0.3,
        outputStride: 16,
        flipHorizontal: true,
        minConfidence: 0.5,
        maxPoseDetections: 1,
        scoreThreshold: 0.5,
        nmsRadius: 20,
        detectionType: 'single',
        inputResolution: 513,
        multiplier: 0.75,
        quantBytes: 2
    }, modelReady);
    
    poseNet.on('pose', function(results) {
        poses = results;
    });
}

function modelReady() {
    console.log('Modelo listo');
    modelLoaded = true;
    document.getElementById('status').textContent = '✅ ¡Listo!';
    document.getElementById('instructions').innerHTML = '✋ Mueve las manos para crear corazones 💕<br>🖤 Atrapa corazones negros con tu cabeza!';
    
    // Reproducir música
    music.play();
    
    // Ocultar overlay de carga
    setTimeout(() => {
        document.getElementById('loading-overlay').classList.add('hidden');
    }, 500);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    // Dibujar video (espejado)
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
    
    // Dibujar pose
    drawKeypoints();
    drawSkeleton();
    
    // Crear corazones desde las manos
    createHeartsFromHands();
    
    // Actualizar y dibujar corazones
    updateHearts();
    drawHearts();
    
    // Juego de corazones que caen
    createFallingHearts();
    updateFallingHearts();
    drawFallingHearts();
    
    // Mostrar puntuación
    displayScore();
}

function drawKeypoints() {
    for (let i = 0; i < poses.length; i++) {
        let pose = poses[i].pose;
        // Solo dibujar las manos
        let hands = ['leftWrist', 'rightWrist'];
        for (let j = 0; j < pose.keypoints.length; j++) {
            let keypoint = pose.keypoints[j];
            if (keypoint.score > 0.2 && hands.includes(keypoint.part)) {
                fill(255, 100, 150);
                noStroke();
                ellipse(width - keypoint.position.x, keypoint.position.y, 20, 20);
            }
        }
    }
}

function drawSkeleton() {
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 150);
            strokeWeight(2);
            line(
                width - partA.position.x, partA.position.y,
                width - partB.position.x, partB.position.y
            );
        }
    }
}

function createHeartsFromHands() {
    if (poses.length > 0) {
        let pose = poses[0].pose;
        
        // Obtener posiciones de las manos
        let leftWrist = pose.keypoints.find(kp => kp.part === 'leftWrist');
        let rightWrist = pose.keypoints.find(kp => kp.part === 'rightWrist');
        
        // Crear corazones desde la mano izquierda con más frecuencia y fuerza
        if (leftWrist && leftWrist.score > 0.3 && random(1) < 0.3) {
            // Crear múltiples corazones para efecto propulsor
            for (let i = 0; i < 2; i++) {
                let angle = random(-PI/3, PI/3); // Ángulo de dispersión
                let speed = random(5, 10); // Velocidad más alta
                hearts.push({
                    x: width - leftWrist.position.x,
                    y: leftWrist.position.y,
                    size: random(20, 40),
                    speedX: sin(angle) * speed,
                    speedY: -cos(angle) * speed, // Negativo para ir hacia arriba
                    opacity: 255,
                    rotation: random(TWO_PI),
                    rotationSpeed: random(-0.2, 0.2)
                });
            }
        }
        
        // Crear corazones desde la mano derecha con más frecuencia y fuerza
        if (rightWrist && rightWrist.score > 0.3 && random(1) < 0.3) {
            // Crear múltiples corazones para efecto propulsor
            for (let i = 0; i < 2; i++) {
                let angle = random(-PI/3, PI/3); // Ángulo de dispersión
                let speed = random(5, 10); // Velocidad más alta
                hearts.push({
                    x: width - rightWrist.position.x,
                    y: rightWrist.position.y,
                    size: random(20, 40),
                    speedX: sin(angle) * speed,
                    speedY: -cos(angle) * speed, // Negativo para ir hacia arriba
                    opacity: 255,
                    rotation: random(TWO_PI),
                    rotationSpeed: random(-0.2, 0.2)
                });
            }
        }
    }
}

function updateHearts() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        hearts[i].x += hearts[i].speedX;
        hearts[i].y += hearts[i].speedY;
        
        // Aplicar gravedad suave
        hearts[i].speedY += 0.1;
        
        // Desvanecimiento más lento
        hearts[i].opacity -= 1.5;
        hearts[i].rotation += hearts[i].rotationSpeed;
        
        // Eliminar corazones que se desvanecieron o salieron de la pantalla
        if (hearts[i].opacity <= 0 || hearts[i].y < -100 || hearts[i].y > height + 100 || 
            hearts[i].x < -100 || hearts[i].x > width + 100) {
            hearts.splice(i, 1);
        }
    }
}

function drawHearts() {
    for (let heart of hearts) {
        drawHeart(heart.x, heart.y, heart.size, heart.opacity, heart.rotation);
    }
}

function drawHeart(x, y, size, opacity, rotation) {
    push();
    translate(x, y);
    rotate(rotation);
    fill(255, 20, 100, opacity);
    noStroke();
    
    // Dibujar corazón
    beginShape();
    vertex(0, size * 0.3);
    bezierVertex(-size * 0.5, -size * 0.3, -size * 0.5, -size * 0.7, 0, -size * 0.3);
    bezierVertex(size * 0.5, -size * 0.7, size * 0.5, -size * 0.3, 0, size * 0.3);
    endShape(CLOSE);
    
    // Brillo
    fill(255, 100, 150, opacity * 0.6);
    ellipse(-size * 0.15, -size * 0.2, size * 0.2, size * 0.2);
    
    pop();
}

// Funciones del juego de corazones que caen
function createFallingHearts() {
    // Crear corazones negros que caen con cierta probabilidad
    if (random(1) < 0.02 && modelLoaded) {
        fallingHearts.push({
            x: random(width),
            y: -50,
            size: random(30, 50),
            speed: random(3, 6),
            rotation: random(TWO_PI),
            rotationSpeed: random(-0.1, 0.1)
        });
    }
}

function updateFallingHearts() {
    for (let i = fallingHearts.length - 1; i >= 0; i--) {
        let heart = fallingHearts[i];
        heart.y += heart.speed;
        heart.rotation += heart.rotationSpeed;
        
        // Verificar colisión con la cabeza
        if (poses.length > 0) {
            let pose = poses[0].pose;
            let nose = pose.keypoints.find(kp => kp.part === 'nose');
            
            if (nose && nose.score > 0.3) {
                let headX = width - nose.position.x;
                let headY = nose.position.y;
                let d = dist(heart.x, heart.y, headX, headY);
                
                // Si el corazón toca la cabeza
                if (d < heart.size + 30) {
                    score += 10;
                    fallingHearts.splice(i, 1);
                    // Crear efecto de explosión de corazones
                    createHeartExplosion(heart.x, heart.y);
                    continue;
                }
            }
        }
        
        // Eliminar corazones que salieron de la pantalla
        if (heart.y > height + 100) {
            fallingHearts.splice(i, 1);
        }
    }
}

function drawFallingHearts() {
    for (let heart of fallingHearts) {
        push();
        translate(heart.x, heart.y);
        rotate(heart.rotation);
        fill(0); // Negro
        noStroke();
        
        // Dibujar corazón negro
        beginShape();
        vertex(0, heart.size * 0.3);
        bezierVertex(-heart.size * 0.5, -heart.size * 0.3, -heart.size * 0.5, -heart.size * 0.7, 0, -heart.size * 0.3);
        bezierVertex(heart.size * 0.5, -heart.size * 0.7, heart.size * 0.5, -heart.size * 0.3, 0, heart.size * 0.3);
        endShape(CLOSE);
        
        // Brillo blanco
        fill(255, 255, 255, 150);
        ellipse(-heart.size * 0.15, -heart.size * 0.2, heart.size * 0.15, heart.size * 0.15);
        
        pop();
    }
}

function createHeartExplosion(x, y) {
    // Crear varios corazones pequeños que explotan hacia afuera
    for (let i = 0; i < 8; i++) {
        let angle = (TWO_PI / 8) * i;
        let speed = random(3, 6);
        hearts.push({
            x: x,
            y: y,
            size: random(15, 25),
            speedX: cos(angle) * speed,
            speedY: sin(angle) * speed,
            opacity: 255,
            rotation: random(TWO_PI),
            rotationSpeed: random(-0.3, 0.3)
        });
    }
}

function displayScore() {
    push();
    fill(0);
    textSize(32);
    textAlign(RIGHT, TOP);
    textStyle(BOLD);
    text('Puntos: ' + score, width - 30, 30);
    pop();
}
