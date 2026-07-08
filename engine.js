// --- 1. GLOBÁLIS VÁLTOZÓK ÉS BETÖLTŐK ---
let playerHealth = 100, isGameOver = false, score = 0, difficultyMultiplier = 1.0, currentWave = 1, isWaveActive = false, enemiesToSpawn = 5, ammo = 10, reserveAmmo = 30, isReloading = false;
const playerRadius = 0.5; 
const enemyRadius = 0.8; 
let wallHitboxes = []; 
const gltfLoader = new THREE.GLTFLoader(); 
const textureLoader = new THREE.TextureLoader(); 
let frameCounter = 0;

let velocityY = 0; 
const gravity = 0.02;
let canJump = true;

// ÚJ VÁLTOZÓK AZ ÉLMÉNYHEZ
let recoilPitch = 0; // Visszarúgás
let bobTime = 0;     // Kamera lépkedés
let baseCamY = 1.6;  // Alap kameramagasság
let bloodOpacity = 0; // Vérfröccsenés mértéke

// RADAR
let radarAngle = 0;
const radarScanner = document.querySelector('.radar-scanner');

// --- 2. THREE.JS ALAPOK ÉS JELENET ---
const scene = new THREE.Scene();
const fogColor = new THREE.Color(0x050505); 
scene.background = fogColor;
scene.fog = new THREE.FogExp2(fogColor, 0.04);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, baseCamY, 0); 
const clock = new THREE.Clock(); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.physicallyCorrectLights = true; 
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5)); 
const flashlight = new THREE.SpotLight(0xaaffaa, 20, 50, Math.PI / 6, 0.5);
camera.add(flashlight);
flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -1);
camera.add(flashlight.target);
scene.add(camera);

const playerLight = new THREE.PointLight(0xaaffaa, 0.8, 20);
scene.add(playerLight);

const muzzleFlash = new THREE.PointLight(0xffaa00, 0, 100);
muzzleFlash.position.set(0.8, -0.6, -3.0); 
camera.add(muzzleFlash);

// --- 3. UI ELEMEK ---
const healthFill = document.getElementById('health-fill'), 
      damageFlash = document.getElementById('damage-flash'), 
      healFlash = document.getElementById('heal-flash'), 
      scoreDisplay = document.getElementById('score-display'), 
      ammoDisplay = document.getElementById('ammo-display'), 
      reloadText = document.getElementById('reload-text'), 
      waveDisplay = document.getElementById('wave-display'),
      radarContainer = document.getElementById('radar'),
      screenBlood = document.getElementById('screen-blood'); // ÚJ

function updateUI() {
    healthFill.style.width = Math.max(0, playerHealth) + '%';
    healthFill.style.backgroundColor = playerHealth > 60 ? '#00ff00' : playerHealth > 30 ? '#ffaa00' : '#ff0000';
    scoreDisplay.innerText = `PONT: ${score}`;
    ammoDisplay.innerText = `[ ${ammo} / ${reserveAmmo} ]`;
}

// --- 4. HANGRENDSZER ÉS ZENE ---
const listener = new THREE.AudioListener();
camera.add(listener);
const audioLoader = new THREE.AudioLoader();
const sounds = {};

function loadSound(name, url, volume = 1.0, isLoop = false) {
    const sound = new THREE.Audio(listener);
    audioLoader.load(url, (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(volume);
        sound.setLoop(isLoop);
        sounds[name] = sound;
        if (name === 'music' && listener.context.state === 'running') sound.play();
    });
}

loadSound('music', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/f162302b83992b9adfe75b1c3ade387a25e2478d/music.mp3', 0.3, true); 
loadSound('ammo', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/ammo%20box.mp3', 1.0);
loadSound('shoot', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/gun%20shoot.mp3', 0.7);
loadSound('heal', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/heal.mp3', 1.0);
loadSound('hurt', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/me%20get%20hit.mp3', 1.0);
loadSound('reload', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/reload.mp3', 1.0);
loadSound('zombieHit', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/zombie%20get%20hit.mp3', 1.0);

function unlockAudio() {
    if (listener.context.state === 'suspended') listener.context.resume();
    if (sounds['music'] && !sounds['music'].isPlaying && sounds['music'].buffer) sounds['music'].play();
}
window.addEventListener('touchstart', unlockAudio, { once: true });
window.addEventListener('mousedown', unlockAudio, { once: true });

function playSound(name) {
    if (sounds[name] && sounds[name].buffer) {
        if (sounds[name].isPlaying) sounds[name].stop();
        if (name === 'shoot') sounds[name].offset = 0.4; else sounds[name].offset = 0;
        sounds[name].play();
    }
}

// ÚJ: Szintetikus Hitmarker (Cöcc hang) külső fájl nélkül!
function playHitmarkerSound() {
    if (!listener.context) return;
    try {
        const now = listener.context.currentTime;
        const osc = listener.context.createOscillator();
        const gain = listener.context.createGain();
        osc.connect(gain); gain.connect(listener.context.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } catch(e) {}
}

// --- 5. SAJÁT PÁLYA GENERÁLÁSA ÉS FIZIKA ---
const floorTexUrl = 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6ff430b224fb8cd358b83fade1e06710d708d094/1783431196560.png';
const wallTexUrl = 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6ff430b224fb8cd358b83fade1e06710d708d094/1783431502863.png';

const floorTex = textureLoader.load(floorTexUrl);
floorTex.wrapS = THREE.RepeatWrapping; floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10); 
const wallTex = textureLoader.load(wallTexUrl);
wallTex.wrapS = THREE.RepeatWrapping; wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(4, 1); 

const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0.1 });
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.2 });

const arenaSize = 50; 
const wallHeight = 4;
const wallThickness = 2;

const floorGeo = new THREE.PlaneGeometry(arenaSize, arenaSize);
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 0); scene.add(floor);

function createWall(w, h, d, x, z) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(x, h / 2, z); scene.add(mesh);
    wallHitboxes.push(new THREE.Box3().setFromObject(mesh));
}

createWall(arenaSize + wallThickness * 2, wallHeight, wallThickness, 0, -arenaSize / 2 - wallThickness / 2); 
createWall(arenaSize + wallThickness * 2, wallHeight, wallThickness, 0, arenaSize / 2 + wallThickness / 2);  
createWall(wallThickness, wallHeight, arenaSize, -arenaSize / 2 - wallThickness / 2, 0); 
createWall(wallThickness, wallHeight, arenaSize, arenaSize / 2 + wallThickness / 2, 0);  

const pillars = [ { x: -10, z: -10 }, { x: 10, z: -10 }, { x: -10, z: 10 }, { x: 10, z: 10 } ];
pillars.forEach(p => createWall(4, wallHeight, 4, p.x, p.z));

function checkWallCollision(x, z, radius) {
    const playerBox = new THREE.Box3(
        new THREE.Vector3(x - radius, 0, z - radius),
        new THREE.Vector3(x + radius, 2, z + radius)
    );
    for (let i = 0; i < wallHitboxes.length; i++) {
        if (playerBox.intersectsBox(wallHitboxes[i])) return true;
    }
    return false;
}

function getSafeSpawnPosition(radius, minDist = 0) {
    let x, z; let isSafe = false; let attempts = 0;
    while (!isSafe && attempts < 50) {
        x = (Math.random() - 0.5) * (arenaSize - 4); z = (Math.random() - 0.5) * (arenaSize - 4);
        if (Math.hypot(camera.position.x - x, camera.position.z - z) >= minDist) {
            if(!checkWallCollision(x, z, radius)) isSafe = true; 
        }
        attempts++;
    }
    return { x: x || 0, z: z || 0 };
}

// --- 6. FEGYVER BETÖLTÉSE ---
let gunMixer = null;
let gunShootAction = null;
const gunUrl = 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/8c7271b0135d22428617169177fe45e31e6aecf7/ultrakill_alternate_revolver.glb';

gltfLoader.load(gunUrl, (gltf) => {
    const gunMesh = gltf.scene;
    gunMesh.scale.set(3.0, 3.0, 3.0); 
    gunMesh.position.set(0.8, -1.2, -1.5); 
    gunMesh.rotation.set(0, Math.PI / -2, 0); 
    camera.add(gunMesh); 

    if (gltf.animations && gltf.animations.length > 0) {
        gunMixer = new THREE.AnimationMixer(gunMesh);
        gunShootAction = gunMixer.clipAction(gltf.animations[0]); 
        gunShootAction.setLoop(THREE.LoopOnce);
        gunShootAction.clampWhenFinished = true; 
    }
});

function resetGame() {
    playerHealth = 100; score = 0; currentWave = 1; enemiesToSpawn = 5; ammo = 10; reserveAmmo = 30; difficultyMultiplier = 1.0; isGameOver = false;
    updateUI();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('ui-layer').style.display = 'flex';
    for (let i = 0; i < enemies.length; i++) { scene.remove(enemies[i].mesh); radarContainer.removeChild(enemies[i].blip); }
    enemies.length = 0; enemyHitboxes.length = 0;
    camera.position.set(0, baseCamY, 0); isWaveActive = true; 
    bloodOpacity = 0; screenBlood.style.opacity = 0;
}
document.getElementById('restart-btn').addEventListener('touchstart', resetGame);
document.getElementById('restart-btn').addEventListener('click', resetGame);

const particles = [];
const particleGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2); 
const particleMat = new THREE.MeshBasicMaterial({ color: 0xaa0000 }); 

function createExplosion(x, y, z) {
    for(let i=0; i<15; i++) {
        const mesh = new THREE.Mesh(particleGeo, particleMat);
        mesh.position.set(x, y, z); scene.add(mesh);
        particles.push({ mesh, vx: (Math.random() - 0.5) * 0.4, vy: Math.random() * 0.4, vz: (Math.random() - 0.5) * 0.4, life: 1.0 });
    }
}

// --- 8. ZOMBI ÉS LOOT SPAWNOLÁSA ---
const enemies = [];
const enemyHitboxes = []; 
let zombieModel = null, zombieAnimations = null;

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/main/zombie.glb', (gltf) => {
    zombieModel = gltf.scene; zombieAnimations = gltf.animations;
    zombieModel.traverse((child) => { if (child.isMesh && child.material) { child.material.emissive = new THREE.Color(0x003300); child.material.emissiveIntensity = 0.5; } });
    isWaveActive = true;
    for (let i = 0; i < enemiesToSpawn; i++) spawnEnemy(getSafeSpawnPosition(enemyRadius, 10).x, getSafeSpawnPosition(enemyRadius, 10).z);
});

function spawnEnemy(x, z) {
    if (!zombieModel) return;
    const mesh = THREE.SkeletonUtils.clone(zombieModel);
    mesh.scale.set(1.5, 1.5, 1.5); 
    mesh.position.set(x, 0, z); 
    
    // ÚJ: FEJLÖVÉS MECHANIKA - 2 hitbox (Test és Fej)
    const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 0.8), new THREE.MeshBasicMaterial({ visible: false })); 
    bodyHitbox.position.y = 0.65; bodyHitbox.userData = { type: 'body' };
    
    const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
    headHitbox.position.y = 1.6; headHitbox.userData = { type: 'head' }; // Kisebb doboz felül

    mesh.add(bodyHitbox); mesh.add(headHitbox); 
    scene.add(mesh); 
    enemyHitboxes.push(bodyHitbox, headHitbox); 
    
    const mixer = new THREE.AnimationMixer(mesh);
    let walkClip = zombieAnimations && zombieAnimations.length > 0 ? zombieAnimations.find(a => a.name.toLowerCase().includes('walk')) || zombieAnimations[0] : null;
    if (walkClip) { const action = mixer.clipAction(walkClip); action.setLoop(THREE.LoopRepeat); action.play(); }
    
    const blip = document.createElement('div'); blip.className = 'radar-blip'; radarContainer.appendChild(blip);
    
    // A zombinak mostantól 3 élete van (kivéve ha fejlövés)
    enemies.push({ mesh, bodyHitbox, headHitbox, health: 3, mixer, blip, avoidTimer: 0, avoidDir: new THREE.Vector3() });
}

let ammoModel = null, healthModel = null;
gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/db069dbbe97f2d9cd71985c37eb64dad31848434/ammo.glb', (gltf) => { ammoModel = gltf.scene; for (let i = 0; i < 4; i++) spawnAmmoBox(getSafeSpawnPosition(0.4, 5).x, getSafeSpawnPosition(0.4, 5).z); });
gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/db069dbbe97f2d9cd71985c37eb64dad31848434/health.glb', (gltf) => { healthModel = gltf.scene; for (let i = 0; i < 4; i++) spawnMedkit(getSafeSpawnPosition(0.5, 5).x, getSafeSpawnPosition(0.5, 5).z); });

function spawnMedkit(x, z) {
    if (!healthModel) return; 
    const mesh = THREE.SkeletonUtils.clone(healthModel); mesh.position.set(x, 1, z); 
    mesh.scale.set(0.6, 0.6, 0.6); mesh.add(new THREE.PointLight(0x00aaff, 1, 5)); scene.add(mesh);
    medkits.push({ mesh, startY: 1, floatTime: Math.random() * Math.PI * 2 });
}

function spawnAmmoBox(x, z) {
    if (!ammoModel) return; 
    const mesh = THREE.SkeletonUtils.clone(ammoModel); mesh.position.set(x, 0.8, z); 
    mesh.scale.set(1.8, 1.8, 1.8); mesh.add(new THREE.PointLight(0xffcc00, 1, 5)); scene.add(mesh);
    ammoBoxes.push({ mesh, startY: 0.8, floatTime: Math.random() * Math.PI * 2 });
}
const medkits = [], ammoBoxes = [];

// --- 9. IRÁNYÍTÁS ÉS HARC ---
document.getElementById('shoot-btn').addEventListener('touchstart', handleShoot);
document.getElementById('shoot-btn').addEventListener('mousedown', handleShoot); 

function handleShoot(e) {
    e.preventDefault(); e.stopPropagation(); 
    unlockAudio(); 
    
    if (isGameOver || isReloading) return;
    if (ammo <= 0) { 
        if (reserveAmmo > 0) { 
            isReloading = true; playSound('reload'); reloadText.classList.remove('hidden'); 
            setTimeout(() => { const load = Math.min(10 - ammo, reserveAmmo); ammo += load; reserveAmmo -= load; isReloading = false; updateUI(); reloadText.classList.add('hidden'); }, 1500); 
        } 
        return; 
    }
    
    ammo--; updateUI(); 
    playSound('shoot'); 
    
    // ÚJ: Torkolattűz és VISSZARÚGÁS (Recoil)
    muzzleFlash.intensity = 8.0; 
    recoilPitch += 0.08; // A fegyver ereje feldobja a kamerát
    
    if (gunShootAction) { gunShootAction.stop(); gunShootAction.play(); }

    const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(enemyHitboxes, false);
    const laserMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    const endPoint = intersects.length > 0 ? intersects[0].point : raycaster.ray.at(50, new THREE.Vector3());
    const startPoint = new THREE.Vector3(0.5, -0.5, -1).applyMatrix4(camera.matrixWorld);
    const laser = new THREE.Line(new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]), laserMat);
    scene.add(laser); setTimeout(() => { scene.remove(laser); }, 100);
    
    // ÚJ: HITMARKER ÉS FEJLÖVÉS LOGIKA
    if (intersects.length > 0) { 
        const hitObj = intersects[0].object;
        const index = enemies.findIndex(e => e.bodyHitbox === hitObj || e.headHitbox === hitObj); 
        
        if (index > -1) { 
            const en = enemies[index];
            const isHeadshot = hitObj.userData.type === 'head';

            // Hitmarker megjelenítése és hangja
            const hitmarker = document.getElementById('hitmarker');
            hitmarker.classList.remove('hidden');
            setTimeout(() => hitmarker.classList.add('hidden'), 100);
            playHitmarkerSound();

            if (isHeadshot) {
                en.health = 0; score += 50;
                // Fejlövés felirat
                const hsMsg = document.getElementById('headshot-msg');
                hsMsg.classList.remove('hidden');
                hsMsg.classList.remove('headshot-anim');
                void hsMsg.offsetWidth; // Reflow újraindításhoz
                hsMsg.classList.add('headshot-anim');
            } else {
                en.health -= 1; score += 10;
            }
            updateUI(); 

            if (en.health <= 0) {
                playSound('zombieHit'); 
                createExplosion(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z); 
                radarContainer.removeChild(en.blip); scene.remove(en.mesh); 
                
                // Hitboxok eltávolítása a listából
                enemyHitboxes.splice(enemyHitboxes.indexOf(en.bodyHitbox), 1);
                enemyHitboxes.splice(enemyHitboxes.indexOf(en.headHitbox), 1);
                enemies.splice(index, 1); 
            }
        } 
    }
}

// Joypad logikája (változatlan)
let moveX = 0, moveZ = 0, pitch = 0, yaw = 0, leftTouchId = null, rightTouchId = null;
const zoneLeft = document.getElementById('zone-left'), zoneRight = document.getElementById('zone-right'), joyBase = document.getElementById('joy-base'), joyStick = document.getElementById('joy-stick');
let joyStartX = 0, joyStartY = 0, lastLookX = 0, lastLookY = 0;
zoneLeft.addEventListener('touchstart', (e) => { e.preventDefault(); const touch = e.changedTouches[0]; leftTouchId = touch.identifier; joyStartX = touch.clientX; joyStartY = touch.clientY; joyBase.style.left = joyStartX + 'px'; joyBase.style.top = joyStartY + 'px'; joyStick.style.left = joyStartX + 'px'; joyStick.style.top = joyStartY + 'px'; joyBase.classList.remove('hidden'); joyStick.classList.remove('hidden'); });
zoneLeft.addEventListener('touchmove', (e) => { e.preventDefault(); for (let i = 0; i < e.changedTouches.length; i++) { if (e.changedTouches[i].identifier === leftTouchId) { const touch = e.changedTouches[i]; const dx = touch.clientX - joyStartX; const dy = touch.clientY - joyStartY; const dist = Math.min(50, Math.hypot(dx, dy)); const angle = Math.atan2(dy, dx); joyStick.style.left = (joyStartX + Math.cos(angle) * dist) + 'px'; joyStick.style.top = (joyStartY + Math.sin(angle) * dist) + 'px'; moveX = (Math.cos(angle) * dist) / 50; moveZ = (Math.sin(angle) * dist) / 50; } } });
zoneLeft.addEventListener('touchend', (e) => { if(e.changedTouches[0].identifier === leftTouchId) { leftTouchId = null; moveX = moveZ = 0; joyBase.classList.add('hidden'); joyStick.classList.add('hidden'); } });
zoneRight.addEventListener('touchstart', (e) => { e.preventDefault(); rightTouchId = e.changedTouches[0].identifier; lastLookX = e.changedTouches[0].clientX; lastLookY = e.changedTouches[0].clientY; });
zoneRight.addEventListener('touchmove', (e) => { e.preventDefault(); for (let i = 0; i < e.changedTouches.length; i++) { if (e.changedTouches[i].identifier === rightTouchId) { yaw -= (e.changedTouches[i].clientX - lastLookX) * 0.005; pitch -= (e.changedTouches[i].clientY - lastLookY) * 0.005; pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); lastLookX = e.changedTouches[i].clientX; lastLookY = e.changedTouches[i].clientY; } } });
zoneRight.addEventListener('touchend', (e) => { if(e.changedTouches[0].identifier === rightTouchId) rightTouchId = null; });

// --- 10. FŐ ANIMÁCIÓS CIKLUS ---
let damageCooldown = 0; 

function animate() {
    requestAnimationFrame(animate);
    frameCounter++;

    if (isGameOver) return renderer.render(scene, camera);
    const delta = clock.getDelta();
    if (damageCooldown > 0) damageCooldown -= delta;
    
    // RADAR FORGATÁSA
    radarAngle -= delta * 3.5; 
    let displayAngle = radarAngle % (Math.PI * 2);
    if (displayAngle < 0) displayAngle += Math.PI * 2;
    if (radarScanner) radarScanner.style.transform = `translate(0, -50%) rotate(${displayAngle}rad)`;

    if (muzzleFlash.intensity > 0) { muzzleFlash.intensity -= delta * 30; if (muzzleFlash.intensity < 0) muzzleFlash.intensity = 0; }
    
    if (gunMixer) gunMixer.update(delta);

    // ÚJ: VÉRFOLT ELHALVÁNYÍTÁSA
    if (bloodOpacity > 0) {
        bloodOpacity -= delta * 0.4;
        screenBlood.style.opacity = Math.max(0, bloodOpacity);
    }

    // ÚJ: KAMERA LÉPKEDÉS (Bobbing) ÉS GRAVITÁCIÓ
    velocityY -= gravity;
    baseCamY += velocityY;
    if (baseCamY < 1.6) { baseCamY = 1.6; velocityY = 0; canJump = true; }
    
    const speed = Math.hypot(moveX, moveZ);
    if (speed > 0.05) {
        bobTime += delta * 12; // Csak sétálás közben van bobbing
    } else {
        bobTime += (0 - bobTime) * delta * 5; // Visszaállás
    }
    const bobOffset = Math.sin(bobTime) * 0.06;
    camera.position.y = baseCamY + bobOffset;

    // ÚJ: VISSZARÚGÁS (Recoil)
    recoilPitch = Math.max(0, recoilPitch - delta * 1.5); // Lassan leengedi a fegyvert
    camera.quaternion.setFromEuler(new THREE.Euler(pitch + recoilPitch, yaw, 0, 'YXZ'));
    
    if (isWaveActive && zombieModel && enemies.length === 0) {
        isWaveActive = false; let countdown = 10;
        waveDisplay.innerText = `KÉSZÜLJ...JÖNNEK!: ${countdown}mp`; waveDisplay.classList.remove('hidden');
        const waveInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) { waveDisplay.innerText = `KÉSZÜLJ...JÖNNEK!: ${countdown}mp`; } 
            else {
                clearInterval(waveInterval); currentWave++; enemiesToSpawn += 2; 
                for(let i=0; i<enemiesToSpawn; i++) spawnEnemy(getSafeSpawnPosition(enemyRadius, 10).x, getSafeSpawnPosition(enemyRadius, 10).z);
                isWaveActive = true; waveDisplay.innerText = `${currentWave}. HULLÁM`;
                setTimeout(() => waveDisplay.classList.add('hidden'), 2000);
            }
        }, 1000);
    }

    // ÚJ: PISLÁKOLÓ, HORROR VILÁGÍTÁS
    if (Math.random() < 0.1) {
        playerLight.intensity = Math.random() * 0.6; // Majdnem teljesen kialszik
    } else {
        playerLight.intensity = 0.6 + Math.random() * 0.2; // Rendes pislákolás
    }
    playerLight.position.copy(camera.position);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
    const move = forward.multiplyScalar(moveZ * -0.15).add(right.multiplyScalar(moveX * 0.15));
    
    let nextPlayerX = camera.position.x + move.x;
    let nextPlayerZ = camera.position.z + move.z;

    if (!checkWallCollision(nextPlayerX, camera.position.z, playerRadius)) camera.position.x = nextPlayerX;
    if (!checkWallCollision(camera.position.x, nextPlayerZ, playerRadius)) camera.position.z = nextPlayerZ;
    
    let isTakingDamage = false;

    for (let i = 0; i < enemies.length; i++) {
        const en = enemies[i];
        if (en.mixer) en.mixer.update(delta);

        const distToPlayer = Math.hypot(camera.position.x - en.mesh.position.x, camera.position.z - en.mesh.position.z);
        const attackRange = 2.5; 
        
        if (distToPlayer <= attackRange + 0.5) {
            isTakingDamage = true;
            playerHealth -= 0.4; updateUI(); 
            
            // ÚJ: VÉRFRÖCCSENÉS
            bloodOpacity = 1.0; 
            
            if (damageCooldown <= 0) {
                playSound('hurt');
                damageCooldown = 1.0; 
            }
            
            if (playerHealth <= 0 && !isGameOver) {
                isGameOver = true;
                document.getElementById('final-score').innerText = `PONT: ${score}`;
                document.getElementById('final-wave').innerText = `TÚLÉLT HULLÁMOK: ${currentWave - 1}`;
                document.getElementById('game-over').classList.remove('hidden');
                document.getElementById('ui-layer').style.display = 'none'; 
            }
        }

        if (distToPlayer > attackRange) {
            const enemyDir = new THREE.Vector3().subVectors(camera.position, en.mesh.position).normalize();
            enemyDir.y = 0; en.mesh.lookAt(camera.position.x, 0, camera.position.z); 
            const enemySpeed = 0.04 * difficultyMultiplier; 
            
            if (!checkWallCollision(en.mesh.position.x + enemyDir.x * enemySpeed, en.mesh.position.z + enemyDir.z * enemySpeed, enemyRadius)) {
                en.mesh.position.x += enemyDir.x * enemySpeed;
                en.mesh.position.z += enemyDir.z * enemySpeed;
            }
        }
        
        const localPos = en.mesh.position.clone(); camera.worldToLocal(localPos);
        const radarScale = 0.8;
        en.blip.style.left = (50 + localPos.x * radarScale) + 'px';
        en.blip.style.top = (50 + localPos.z * radarScale) + 'px';

        let targetAngle = Math.atan2(localPos.z, localPos.x); if (targetAngle < 0) targetAngle += Math.PI * 2;
        let diff = Math.abs(targetAngle - displayAngle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < 0.3) en.blip.classList.add('visible'); else en.blip.classList.remove('visible');
    }

    damageFlash.style.opacity = isTakingDamage ? '1' : '0';

    for (let i = medkits.length - 1; i >= 0; i--) {
        const mk = medkits[i];
        mk.floatTime += 0.05; mk.mesh.position.y = mk.startY + Math.sin(mk.floatTime) * 0.3;
        if (Math.hypot(camera.position.x - mk.mesh.position.x, camera.position.z - mk.mesh.position.z) < 1.5) { 
            playSound('heal'); playerHealth = Math.min(100, playerHealth + 40); updateUI();
            scene.remove(mk.mesh); medkits.splice(i, 1);
            setTimeout(() => { if(!isGameOver) spawnMedkit(getSafeSpawnPosition(0.5, 5).x, getSafeSpawnPosition(0.5, 5).z); }, 5000);
        }
    }

    for (let i = ammoBoxes.length - 1; i >= 0; i--) {
        const ab = ammoBoxes[i];
        ab.floatTime += 0.05; ab.mesh.position.y = ab.startY + Math.sin(ab.floatTime) * 0.2;
        if (Math.hypot(camera.position.x - ab.mesh.position.x, camera.position.z - ab.mesh.position.z) < 1.5) {
            playSound('ammo'); reserveAmmo += 20; updateUI();
            scene.remove(ab.mesh); ammoBoxes.splice(i, 1);
            setTimeout(() => { if(!isGameOver) spawnAmmoBox(getSafeSpawnPosition(0.4, 5).x, getSafeSpawnPosition(0.4, 5).z); }, 5000);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.life -= 0.02; p.vy -= 0.02; 
        p.mesh.position.x += p.vx; p.mesh.position.y += p.vy; p.mesh.position.z += p.vz;
        if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
    }
    
    renderer.render(scene, camera);
}

updateUI(); animate();
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });