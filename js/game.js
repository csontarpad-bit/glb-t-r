// ==========================================
// 1. THREE.JS ALAPOK ÉS KÖRNYEZET
// ==========================================
scene = new THREE.Scene();
scene.background = new THREE.Color(0x051a05); // Radioaktív zöldes fekete
scene.fog = new THREE.FogExp2(0x051a05, 0.035);

camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 1.6, 0); // <-- JAVÍTÁS: Már a menüben is szemmagasságban lesz!
clock = new THREE.Clock();

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.physicallyCorrectLights = true; // VISSZAÁLLÍTVA a régi, működő verzióra
document.body.appendChild(renderer.domElement);

// Fények
scene.add(new THREE.AmbientLight(0x55ff55, 0.3)); 
playerLight = new THREE.PointLight(0xaaffaa, 0.8, 20);
scene.add(playerLight);

const flashlight = new THREE.SpotLight(0xaaffaa, 20, 50, Math.PI / 6, 0.5);
camera.add(flashlight);
flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -1);
camera.add(flashlight.target);

muzzleFlash = new THREE.PointLight(0xffaa00, 0, 100);
muzzleFlash.position.set(0.8, -0.6, -3.0);
camera.add(muzzleFlash);
scene.add(camera);

// ==========================================
// Radioaktív por (Részecskék) - FELÚJÍTVA!
// ==========================================
// 1. Létrehozunk egy ragyogó, kerek textúrát (külső kép nélkül, memóriában)
const particleCanvas = document.createElement('canvas');
particleCanvas.width = 32; particleCanvas.height = 32;
const pContext = particleCanvas.getContext('2d');
const gradient = pContext.createRadialGradient(16, 16, 0, 16, 16, 16);
gradient.addColorStop(0, 'rgba(200, 255, 200, 1)'); // Fehéres-zöld mag
gradient.addColorStop(0.4, 'rgba(0, 255, 0, 0.6)'); // Élénkzöld perem
gradient.addColorStop(1, 'rgba(0, 50, 0, 0)');      // Átlátszó szél
pContext.fillStyle = gradient;
pContext.fillRect(0, 0, 32, 32);
const particleTexture = new THREE.CanvasTexture(particleCanvas);

// 2. Részecskék legenerálása
const radGeo = new THREE.BufferGeometry();
const radVerts = [];
for (let i = 0; i < 400; i++) { // Kicsit több részecske
    radVerts.push((Math.random() - 0.5) * 50, Math.random() * 10, (Math.random() - 0.5) * 50);
}
radGeo.setAttribute('position', new THREE.Float32BufferAttribute(radVerts, 3));

// 3. Izzó, textúrázott anyag
const radMat = new THREE.PointsMaterial({ 
    color: 0x55ff55, 
    size: 0.6, // Nagyobb részecskék
    map: particleTexture, 
    transparent: true, 
    blending: THREE.AdditiveBlending, // Gyönyörűen világítanak, ha fedik egymást
    depthWrite: false // Ne takarják ki a mögöttük lévő dolgokat hibásan
});
const radSystem = new THREE.Points(radGeo, radMat);
scene.add(radSystem);


// ==========================================
// 2. HANGRENDSZER
// ==========================================
listener = new THREE.AudioListener();
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
loadSound('bossAttack', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7881058577cd484c3ba7beba64556801e1704209/boss%20screem.mp3', 1.0);
loadSound('cry', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/40bf509427fc680fb017d8e5c47594250ad9ae93/cry.mp3', 1.0);
loadSound('glitch', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/102a0d507c37ef59b9aeb075e1b30110c95f3b3f/noice02.mp3', 1.0);
loadSound('music', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/f162302b83992b9adfe75b1c3ade387a25e2478d/music.mp3', 0.3, true); 
loadSound('menuMusic', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/212958c21ddceb0db80820c1d91b06b7d9a5a950/main.m4a', 0.5, true); 
loadSound('ammo', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/ammo%20box.mp3', 1.0);
loadSound('shoot', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/gun%20shoot.mp3', 0.7);
loadSound('heal', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/heal.mp3', 1.0);
loadSound('hurt', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/me%20get%20hit.mp3', 1.0);
loadSound('reload', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/reload.mp3', 1.0);
loadSound('zombieHit', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/zombie%20get%20hit.mp3', 1.0);
loadSound('zombieDie', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/1f5b9cfe04d0b19f99fdb0b263ba582b429f4f92/zombie%20die.mp3', 1.0);

window.unlockAudio = function() {
    if (listener.context.state === 'suspended') listener.context.resume();
    if (sounds['music'] && sounds['music'].buffer && !sounds['music'].isPlaying) sounds['music'].play();
}

window.playSound = function(name, offset = 0) {
    if (sounds[name] && sounds[name].buffer) {
        if (sounds[name].isPlaying) sounds[name].stop();
        sounds[name].offset = offset;
        sounds[name].play();
    }
}

window.playHitmarkerSound = function() {
    if (!listener.context) return;
    try {
        const now = listener.context.currentTime;
        const osc = listener.context.createOscillator();
        const gain = listener.context.createGain();
        osc.connect(gain); gain.connect(listener.context.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(2000, now); osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } catch(e) {}
}


// ==========================================
// 3. PÁLYA ÉS MODELLEK BETÖLTÉSE
// ==========================================
const textureLoader = new THREE.TextureLoader(); 
// VISSZAÁLLÍTVA A RÉGI MŰKÖDŐ BETÖLTÉSRE
const floorTex = textureLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6ff430b224fb8cd358b83fade1e06710d708d094/1783431196560.png'); 
floorTex.wrapS = THREE.RepeatWrapping; floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10); 
const wallTex = textureLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6ff430b224fb8cd358b83fade1e06710d708d094/1783431502863.png'); 
wallTex.wrapS = THREE.RepeatWrapping; wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(4, 1); 

const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0.1 }); 
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.2 });

const arenaSize = 50, wallHeight = 4, wallThickness = 2;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(arenaSize, arenaSize), floorMat); 
floor.rotation.x = -Math.PI / 2; 
scene.add(floor);

function createWall(w, h, d, x, z) { 
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat); 
    mesh.position.set(x, h / 2, z); 
    scene.add(mesh); 
    wallHitboxes.push(new THREE.Box3().setFromObject(mesh)); 
}

createWall(arenaSize + 4, wallHeight, 2, 0, -26); 
createWall(arenaSize + 4, wallHeight, 2, 0, 26); 
createWall(2, wallHeight, arenaSize, -26, 0); 
createWall(2, wallHeight, arenaSize, 26, 0);  

const pillars = [{x:-10,z:-10}, {x:10,z:-10}, {x:-10,z:10}, {x:10,z:10}];
pillars.forEach(p => createWall(4, wallHeight, 4, p.x, p.z));

window.checkWallCollision = function(x, z, r) { 
    const box = new THREE.Box3(new THREE.Vector3(x-r, 0, z-r), new THREE.Vector3(x+r, 2, z+r)); 
    for(let i=0; i<wallHitboxes.length; i++) { 
        if(box.intersectsBox(wallHitboxes[i])) return true; 
    } 
    return false; 
}

const gltfLoader = new THREE.GLTFLoader();

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6100b7a688723ad1b3a67403b99e8dbaf82fc040/three-head.glb', (gltf) => { 
    bossModel = gltf.scene; bossAnimations = gltf.animations; 
    bossModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
});

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7e6d7e06a66a6c9df5665f7df2a92cdfb14846d7/tankv2.glb', (gltf) => { 
    tankModel = gltf.scene; tankAnimations = gltf.animations; 
    tankModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
});

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/3530b5fab56eb32e0fe925babfef2db89bd2b1ac/crying_head_2.glb', (gltf) => { 
    crawlerModel = gltf.scene; 
    crawlerAnimations = gltf.animations; 
    crawlerModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
});

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/8c7271b0135d22428617169177fe45e31e6aecf7/ultrakill_alternate_revolver.glb', (gltf) => { 
    const gunMesh = gltf.scene; 
    gunMesh.scale.set(3, 3, 3); 
    gunMesh.position.set(0.8, -1.2, -1.5); 
    gunMesh.rotation.set(0, -Math.PI/2, 0); 
    camera.add(gunMesh); 
    if (gltf.animations.length > 0) { 
        gunMixer = new THREE.AnimationMixer(gunMesh); 
        gunShootAction = gunMixer.clipAction(gltf.animations[0]); 
        gunShootAction.setLoop(THREE.LoopOnce); 
        gunShootAction.clampWhenFinished = true; 
    } 
});

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/main/zombie.glb', (gltf) => { 
    zombieModel = gltf.scene; 
    zombieAnimations = gltf.animations; 
    zombieModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
});

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/0214d22fe4ca2284df78cbf1eb8f820834651f9a/runerv2.glb', (gltf) => { 
    fastZombieModel = gltf.scene; 
    fastZombieAnimations = gltf.animations; 
    fastZombieModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
});

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6aa130a4c148ae5e16855905c4a15b9978e974ee/hider%20zombie.glb', (gltf) => { 
    hiderZombieModel = gltf.scene; 
    hiderZombieAnimations = gltf.animations; 
    hiderZombieModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
});

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/db069dbbe97f2d9cd71985c37eb64dad31848434/ammo.glb', (gltf) => { ammoModel = gltf.scene; });
gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/db069dbbe97f2d9cd71985c37eb64dad31848434/health.glb', (gltf) => { healthModel = gltf.scene; });

function createToxicPuddle(x, z) {
    const baseRadius = 0.7 + Math.random() * 0.4;
    // 1. Felvisszük 32 szegmensre, hogy szép íves lehessen a széle
    const geo = new THREE.CircleGeometry(baseRadius, 32); 

    const posAttribute = geo.attributes.position;
    
    // Generálunk két véletlenszerű kezdőértéket, hogy minden pocsolya más alakú legyen
    const phase1 = Math.random() * Math.PI * 2;
    const phase2 = Math.random() * Math.PI * 2;

    for (let i = 1; i < posAttribute.count; i++) {
        let vx = posAttribute.getX(i);
        let vy = posAttribute.getY(i);

        // Kiszámoljuk az adott pont szögét a körön belül
        let angle = Math.atan2(vy, vx);

        // 2. ORGANIKUS FORMA: Szinusz hullámokkal lágyan torzítjuk
        // Ez 3 és 5 "hullámot" rak a kör köré, ami teljesen sima paca formát ad
        let distort = 1.0 
                    + 0.15 * Math.sin(angle * 3 + phase1) 
                    + 0.10 * Math.cos(angle * 5 + phase2);

        posAttribute.setX(i, vx * distort);
        posAttribute.setY(i, vy * distort);
    }
    
    geo.computeVertexNormals(); // Frissíti a felületet a fényekhez

    const mesh = new THREE.Mesh(geo, globalToxicMat); 
    mesh.rotation.x = -Math.PI / 2;
    // Forgatás, hogy még változatosabb legyen
    mesh.rotation.z = Math.random() * Math.PI; 
    mesh.position.set(x, 0.02, z);
    
    scene.add(mesh);
    toxicPuddles.push(mesh);
}


// ==========================================
// 4. LÖVÉS ÉS IRÁNYÍTÁS LOGIKA
// ==========================================

window.handleShoot = function(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (gameState !== 'PLAYING' || isReloading) return;
    
    let wpn = weapons[currentWeaponId];

    if (wpn.ammo <= 0) { 
        if (wpn.reserve > 0) { 
            isReloading = true; 
            playSound('reload'); 
            document.getElementById('reload-text').classList.remove('hidden'); 
            setTimeout(() => { 
                const load = Math.min(wpn.maxAmmo - wpn.ammo, wpn.reserve); 
                wpn.ammo += load; 
                wpn.reserve -= load; 
                isReloading = false; 
                if (typeof updateUI === 'function') updateUI(); 
                document.getElementById('reload-text').classList.add('hidden'); 
            }, wpn.reloadTime); 
        } 
        return; 
    }
    
    wpn.ammo--; 
    if (typeof updateUI === 'function') updateUI(); 
    playSound('shoot', 0.4);
    
    muzzleFlash.intensity = 8.0; 
    recoilPitch += 0.08 + (wpn.spread * 0.5); 
    if (gunShootAction) { gunShootAction.stop(); gunShootAction.play(); }

    const raycaster = new THREE.Raycaster(); 
    
    const isSuper = currentWeaponId === 'super';
    
    for (let p = 0; p < wpn.pellets; p++) {
        const spreadX = (Math.random() - 0.5) * wpn.spread;
        const spreadY = (Math.random() - 0.5) * wpn.spread;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);
        
        const intersects = raycaster.intersectObjects(enemyHitboxes, false);
        const startPoint = new THREE.Vector3(0.5, -0.5, -1).applyMatrix4(camera.matrixWorld);
        
        // A szuper fegyver lézere átmegy mindenen (max távig), a sima megáll az első találatnál
        const endPoint = (isSuper || intersects.length === 0) ? raycaster.ray.at(50, new THREE.Vector3()) : intersects[0].point;
        
        // --- LÁTVÁNY ---
        if (isSuper) {
            // Vastag 3D lézerhenger a szuper fegyverhez
            const distance = startPoint.distanceTo(endPoint);
            const cylinderGeo = new THREE.CylinderGeometry(0.2, 0.2, distance, 8);
            const cylinderMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
            const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
            cylinder.position.copy(startPoint).lerp(endPoint, 0.5);
            cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(endPoint, startPoint).normalize());
scene.add(cylinder);
            setTimeout(() => { scene.remove(cylinder); cylinderGeo.dispose(); cylinderMat.dispose(); }, 150);
        } else {
            // Sima sárga lézer a többihez
            const laserMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
const laserGeo = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
            const laser = new THREE.Line(laserGeo, laserMat);
            scene.add(laser); 
            setTimeout(() => { scene.remove(laser); laserGeo.dispose(); laserMat.dispose(); }, 100);
        }
        
        // --- SEBZÉS ---
        if (intersects.length > 0) { 
            // Ha szuper fegyver, akkor az összes eltalált zombin végigmegyünk, különben csak az elsőn
            let hitTargets = isSuper ? intersects : [intersects[0]];
            let damagedEnemies = new Set(); // Ne sebezzük ugyanazt a zombit kétszer (test + fej)
            
            for (let hit of hitTargets) {
                const hitObj = hit.object;
                const index = enemies.findIndex(e => e.bodyHitbox === hitObj || e.headHitbox === hitObj); 
                
                if (index > -1 && !damagedEnemies.has(index)) { 
                    damagedEnemies.add(index);
                    const en = enemies[index];
                    const isHeadshot = hitObj.userData.type === 'head';
                    
                    if (typeof showHitmarker === 'function') showHitmarker(isHeadshot); 
                    playSound('zombieHit');

                    let dmg = isHeadshot ? wpn.damage * 3 : wpn.damage;
                    en.health -= dmg; 
                    score += isHeadshot ? 50 : 10;
                    if (typeof updateUI === 'function') updateUI();

                    if (en.health <= 0) {
                        // Ha crawler, játssza le a síró hangot, különben a sima zombit
                        playSound(en.type === 'crawler' ? 'cry' : 'zombieDie');
                        
                        // Crawler kill adja az ő 500-as rewardját (és a fejbelövés szorzót is)
                        score += isHeadshot ? en.reward * 1.5 : en.reward; 
                      playSound('zombieDie');
                        if (typeof createToxicPuddle === 'function') createToxicPuddle(en.mesh.position.x, en.mesh.position.z);
                        
                        const particleMat = new THREE.MeshBasicMaterial({ color: 0xaa0000 });
                        for (let i = 0; i < 15; i++) {
                            const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), particleMat);
                            m.position.copy(hit.point);
                            scene.add(m);
                            particles.push({ mesh: m, vx: (Math.random()-0.5)*0.3, vy: Math.random()*0.3, vz: (Math.random()-0.5)*0.3, life: 1.0 });
                        }
                        
                        const radarContainer = document.getElementById('radar');
                        if (radarContainer && en.blip && en.blip.parentNode === radarContainer) {
                            radarContainer.removeChild(en.blip);
                        }
                        scene.remove(en.mesh); 
                        enemyHitboxes.splice(enemyHitboxes.indexOf(en.bodyHitbox), 1); 
                        enemyHitboxes.splice(enemyHitboxes.indexOf(en.headHitbox), 1);
                        enemies.splice(index, 1); 
                    } 
                }
            } 
        } 
    }
}

// ÚJ, FINOMÍTOTT ANALÓG MOBIL IRÁNYÍTÁS (Joystickkal)
const zoneLeft = document.getElementById('zone-left'), zoneRight = document.getElementById('zone-right');
const joyBase = document.getElementById('joy-base'), joyStick = document.getElementById('joy-stick');
let leftTouchId = null, rightTouchId = null, joyStartX = 0, joyStartY = 0, lastLookX = 0, lastLookY = 0;

zoneLeft.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    leftTouchId = e.changedTouches[0].identifier; 
    joyStartX = e.changedTouches[0].clientX; 
    joyStartY = e.changedTouches[0].clientY; 
    if(joyBase) {
        joyBase.classList.remove('hidden');
        joyBase.style.left = joyStartX + 'px';
        joyBase.style.top = joyStartY + 'px';
        if(joyStick) joyStick.style.transform = `translate(-50%, -50%)`;
    }
});

zoneLeft.addEventListener('touchmove', (e) => { 
    e.preventDefault(); 
    for (let touch of e.changedTouches) { 
        if (touch.identifier === leftTouchId) { 
            const dx = touch.clientX - joyStartX; 
            const dy = touch.clientY - joyStartY; 
            const angle = Math.atan2(dy, dx); 
            
            let distance = Math.min(Math.hypot(dx, dy), 40);
            let speedMultiplier = distance / 40; 
            
            moveX = Math.cos(angle) * speedMultiplier; 
            moveZ = Math.sin(angle) * speedMultiplier; 
            
            if(joyStick) {
                let stickX = Math.cos(angle) * distance;
                let stickY = Math.sin(angle) * distance;
                joyStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
            }
        } 
    } 
});

zoneLeft.addEventListener('touchend', (e) => { 
    if (e.changedTouches[0].identifier === leftTouchId) { 
        leftTouchId = null; moveX = moveZ = 0; 
        if(joyBase) joyBase.classList.add('hidden'); 
    } 
});

zoneRight.addEventListener('touchstart', (e) => { e.preventDefault(); rightTouchId = e.changedTouches[0].identifier; lastLookX = e.changedTouches[0].clientX; lastLookY = e.changedTouches[0].clientY; });
zoneRight.addEventListener('touchmove', (e) => { 
    e.preventDefault(); 
    for (let touch of e.changedTouches) { 
        if (touch.identifier === rightTouchId) { 
            yaw -= (touch.clientX - lastLookX) * 0.005; 
            pitch -= (touch.clientY - lastLookY) * 0.005; 
            pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch)); 
            lastLookX = touch.clientX; lastLookY = touch.clientY; 
        } 
    } 
});
zoneRight.addEventListener('touchend', (e) => { if (e.changedTouches[0].identifier === rightTouchId) rightTouchId = null; });

// ==========================================
// ÚJ, IGAZI PC-S FPS IRÁNYÍTÁS ÉS BIZTONSÁG
// ==========================================
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => { let key = e.key.toLowerCase(); if (key in keys) keys[key] = true; });
window.addEventListener('keyup', (e) => { let key = e.key.toLowerCase(); if (key in keys) keys[key] = false; });

setInterval(() => {
    if (gameState === 'PLAYING') {
        let kmX = 0, kmZ = 0;
        if (keys.w) kmZ = -1; 
        if (keys.s) kmZ = 1;  
        if (keys.a) kmX = -1; 
        if (keys.d) kmX = 1;  
        
        if (kmX !== 0 || kmZ !== 0) { moveX = kmX; moveZ = kmZ; } 
        else if (leftTouchId === null) { moveX = 0; moveZ = 0; }
    }
}, 16);

// EGÉR RÖGZÍTÉSE
document.body.addEventListener('click', (e) => {
    if (gameState === 'PLAYING' && document.pointerLockElement !== document.body) {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
            document.body.requestPointerLock();
        }
    }
});

// NÉZELŐDÉS
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body && gameState === 'PLAYING') {
        yaw -= (e.movementX || 0) * 0.003;
        pitch -= (e.movementY || 0) * 0.003;
        pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
    }
});

// GOMBOK: LÖVÉS ÉS VÁLTÁS
window.addEventListener('mousedown', (e) => {
    if (gameState !== 'PLAYING' || document.pointerLockElement !== document.body) return;
    if (e.button === 0) {
        isShootingBtnPressed = true; 
        if(weapons[currentWeaponId].auto) autoShootTimer = weapons[currentWeaponId].fireRate;
        handleShoot(); 
    } else if (e.button === 2) {
        if (typeof handleWeaponSwitch === 'function') handleWeaponSwitch(e);
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) isShootingBtnPressed = false;
});
window.addEventListener('contextmenu', (e) => e.preventDefault());

// --- ÚJ BIZTONSÁGI VÉDELEM AZ AUTOMATA LÖVÉS BUG ELLEN ---
document.addEventListener('pointerlockchange', () => {
    // Ha az egér szabaddá válik (pl. ESC megnyomása, vagy menü kinyílása), azonnal álljon le a lövés!
    if (document.pointerLockElement !== document.body) {
        isShootingBtnPressed = false;
    }
});
window.addEventListener('blur', () => { isShootingBtnPressed = false; }); // Ha ablakot vált a játékos

const shootBtn = document.getElementById('shoot-btn');
if(shootBtn) {
    shootBtn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); isShootingBtnPressed = true; 
        if(weapons[currentWeaponId].auto) autoShootTimer = weapons[currentWeaponId].fireRate;
        handleShoot(e); 
    });
    shootBtn.addEventListener('touchend', (e) => { e.preventDefault(); isShootingBtnPressed = false; });
    shootBtn.addEventListener('mousedown', () => { 
        isShootingBtnPressed = true; 
        if(weapons[currentWeaponId].auto) autoShootTimer = weapons[currentWeaponId].fireRate;
        handleShoot(); 
    });
    shootBtn.addEventListener('mouseup', () => { isShootingBtnPressed = false; });
    shootBtn.addEventListener('mouseleave', () => { isShootingBtnPressed = false; }); // JAVÍTÁS: Ha lehúzod róla az egeret, leáll
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// --- ÚJ: FAGYASZTÁS KÉPESSÉG AKTIVÁLÁSA ---
function triggerFreeze() {
    if (skills.freeze.level > 0 && freezeCooldown <= 0 && gameState === 'PLAYING') {
        activeFreezeTimer = skills.freeze.level * 2; // Szintenként 2 másodperc
        freezeCooldown = 30; // 30 mp újratöltés
        
        playSound('heal'); // Egyelőre a gyógyulás hangját használjuk jéghangnak
        const iceOverlay = document.getElementById('ice-overlay');
        if(iceOverlay) iceOverlay.style.opacity = 1;
        
        const fBtn = document.getElementById('freeze-btn');
        if(fBtn) { fBtn.disabled = true; fBtn.innerText = `⏳ ${Math.ceil(freezeCooldown)}s`; }
    }
}

// Mobilos gomb kattintás (Védett verzió)
const freezeBtnEl = document.getElementById('freeze-btn');
if (freezeBtnEl) {
    freezeBtnEl.addEventListener('click', triggerFreeze);
    freezeBtnEl.addEventListener('touchstart', (e) => { e.preventDefault(); triggerFreeze(); });
}

// PC gomb (F betű)
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f') triggerFreeze();
});



// Alapértelmezett jobbklikk menü (böngésző menü) letiltása
window.addEventListener('contextmenu', (e) => e.preventDefault());


// ==========================================
// 5. JÁTÉK CIKLUS ÉS FRISSÍTÉS
// ==========================================

window.startWaveCountdown = function(isFirstWave = false) {
    // 1. Biztonság: Leállítjuk a korábbi, esetleg beragadt időzítőket!
    if (window.waveTimeout) clearTimeout(window.waveTimeout);
    if (window.glitchShakeInterval) clearInterval(window.glitchShakeInterval);

    if (!isFirstWave) {
        currentWave++; 
        enemiesToSpawn += 2; 
    }
    let bossSpawning = (currentWave % 5 === 0); 
    
    playSound('glitch');
    
    const glitchOverlay = document.getElementById('glitch-overlay');
    const waveDisplay = document.getElementById('wave-display');
    
    if (glitchOverlay) {
        glitchOverlay.classList.remove('hidden');
        glitchOverlay.classList.add('glitch-active');
    }
    
    if (waveDisplay) {
        waveDisplay.innerText = "⚠️ TÉRBELI ANOMÁLIA ÉSZLELVE... ⚠️";
        waveDisplay.style.color = "#ff0000"; 
        waveDisplay.classList.remove('hidden');
    }

    // 2. Eltároljuk az interval-t, hogy később le tudjuk állítani
    window.glitchShakeInterval = setInterval(() => {
        cameraShake = 0.2;
    }, 100);

    // 3. Eltároljuk a timeout-ot is!
    window.waveTimeout = setTimeout(() => {
        clearInterval(window.glitchShakeInterval); 
        
        if (glitchOverlay) {
            glitchOverlay.classList.remove('glitch-active');
            glitchOverlay.classList.add('hidden');
        }
        
        if (waveDisplay) {
            waveDisplay.innerText = `${currentWave}. HULLÁM`;
            waveDisplay.style.color = "#fff"; 
            setTimeout(() => waveDisplay.classList.add('hidden'), 2000);
        }
        
        if (typeof spawnEnemy === 'function') {
            for(let i = 0; i < enemiesToSpawn; i++) {
                spawnEnemy(getSafeSpawnPosition(enemyRadius, 15).x, getSafeSpawnPosition(enemyRadius, 15).z, bossSpawning && i===0);
            }
        }
        
        isWaveActive = true; 
        waveStartTime = clock.getElapsedTime(); 

    }, 7000);
}

window.startGame = function() {
    // ÚJ: Kiegészítve a Crawler, Boss és Tank ellenőrzésével!
    if (!zombieModel || !ammoModel || !healthModel || !fastZombieModel || !hiderZombieModel || !crawlerModel || !bossModel || !tankModel) { 
        setTimeout(window.startGame, 500); 
        return; 
    }

    // --- A HIBA JAVÍTÁSA: Azonnal leállítjuk a hullámot, hogy ne nyíljon ki a bolt! ---
    isWaveActive = false; 

    // Háttérfolyamatok és effektek leállítása
    if (window.waveTimeout) clearTimeout(window.waveTimeout);
    if (window.glitchShakeInterval) clearInterval(window.glitchShakeInterval);
    
    // Minden felugró ablak kényszerített bezárása
    const glitchOverlay = document.getElementById('glitch-overlay');
    if (glitchOverlay) {
        glitchOverlay.classList.remove('glitch-active');
        glitchOverlay.classList.add('hidden');
    }
    const waveDisplay = document.getElementById('wave-display');
    if (waveDisplay) waveDisplay.classList.add('hidden');
    
    const shopMenu = document.getElementById('shop-menu');
    if (shopMenu) shopMenu.classList.add('hidden');
    // -------------------------------------------------------------
    
    // Zene beállítása
    if (sounds['menuMusic'] && sounds['menuMusic'].isPlaying) sounds['menuMusic'].stop();
    if (sounds['music'] && sounds['music'].buffer && !sounds['music'].isPlaying) sounds['music'].play();
    
    gameState = 'PLAYING'; 
    playerHealth = 100; playerArmor = 0; score = 0; 
    currentWave = 1; enemiesToSpawn = 5; currentWeaponId = 'pistol'; // VISSZAÁLL 1-RE!
    weapons.pistol.ammo = weapons.pistol.maxAmmo; weapons.pistol.reserve = weapons.pistol.maxReserve;
    
    if (typeof updateUI === 'function') updateUI(); 
    camera.position.set(0, 1.6, 0); 
    
    const radarContainer = document.getElementById('radar');
    
    // Zombik teljes törlése a pályáról és a memóriából
    for (let i = 0; i < enemies.length; i++) {
        // Biztos ami biztos, eltávolítjuk a 3D térből
        scene.remove(enemies[i].mesh); 
        
        // Felszabadítjuk a memóriát
        enemies[i].mesh.traverse((child) => {
            if (child.isMesh && child.geometry) child.geometry.dispose();
        });
        
        // Levesszük a radarról
        if (radarContainer && enemies[i].blip && enemies[i].blip.parentNode) {
            radarContainer.removeChild(enemies[i].blip); 
        }
    }
    // Tömbök nullázása
    enemies.length = 0; 
    enemyHitboxes.length = 0; 
    
    toxicPuddles.forEach(p => { scene.remove(p); p.geometry.dispose(); }); 
    toxicPuddles.length = 0;
    
    medkits.forEach(mk => { scene.remove(mk.mesh); }); 
    medkits.length = 0; 
    
    ammoBoxes.forEach(ab => { scene.remove(ab.mesh); }); 
    ammoBoxes.length = 0;
    
    // Újra kezdjük a meccset
    if(typeof spawnMedkit === 'function') {
        for (let i = 0; i < 4; i++) spawnMedkit(getSafeSpawnPosition(0.5, 5).x, getSafeSpawnPosition(0.5, 5).z);
        for (let i = 0; i < 4; i++) spawnAmmoBox(getSafeSpawnPosition(0.4, 5).x, getSafeSpawnPosition(0.4, 5).z);
    }
    
    // Indítjuk az 1. hullámot a 7 másodperces glitch-el
    startWaveCountdown(true); 
}

let currentBob = 0;

function animate() {
    requestAnimationFrame(animate); 
    const delta = clock.getDelta();
    
// Ha menüben vagyunk, a kamera lassan körbeforog a pályán
    if (gameState === 'MENU') {
        yaw -= delta * 0.15; // Lassú, balra tartó forgás
        
        // ÚJ: Finom filmes lebegés és enyhe lefelé nézés
        camera.position.y = 1.6 + Math.sin(clock.getElapsedTime() * 0.8) * 0.15; 
        camera.quaternion.setFromEuler(new THREE.Euler(-0.05, yaw, 0, 'YXZ')); 
        
        radSystem.rotation.y += delta * 0.05; // A por is lassan örvénylik
        renderer.render(scene, camera);
        return;
    }

    if (gameState !== 'PLAYING') { 
        renderer.render(scene, camera); return; 
    }

    // JAVÍTOTT Automata tüzelés logikája
    let wpn = weapons[currentWeaponId];
    if (autoShootTimer > 0) autoShootTimer -= delta;
    if (isShootingBtnPressed && wpn.auto && autoShootTimer <= 0) {
        handleShoot();
        autoShootTimer = wpn.fireRate;
    }

// --- ÚJ: TOXIKUS POCSOLYA LOGIKA (Tick-alapú, 1mp) ---
    if (typeof toxicTickTimer !== 'undefined') {
        toxicTickTimer += delta;
        if (toxicTickTimer >= 1.0) {
            toxicTickTimer = 0; // Tick nullázása
            let playerPuddleCount = 0;
            
            // Biztos koordináták lekérése a játékoshoz
            let px = camera.position.x;
            let pz = camera.position.z;
            
            // 1. Játékos sebzése
            for (let p of toxicPuddles) {
                let distSq = Math.pow(px - p.position.x, 2) + Math.pow(pz - p.position.z, 2);
                // Kisebb távolság: mivel a pocsolya kisebb (sugár kb 1.0), a distSq határ most 1.2
                if (distSq <= 1.2) {
                    playerPuddleCount++;
                }
            }
            
            if (playerPuddleCount > 0) {
                playerHealth -= (playerPuddleCount * 2); // 2 HP / pocsolya / másodperc
                if (typeof updateUI === 'function') updateUI();
                playSound('hurt');
                
                const damageFlash = document.getElementById('damage-flash');
                if (damageFlash) { damageFlash.style.opacity = 0.5; setTimeout(() => damageFlash.style.opacity = 0, 200); }
                
                // Halál ellenőrzés a savtól
                if (playerHealth <= 0) {
                    if (skills.revive.level > 0) {
                        skills.revive.level--;
                        playerHealth = 100 + (skills.maxHealth.level * 20);
                        invincibilityTimer = 2.0;
                        playSound('heal');
                        if (typeof updateShopButtons === 'function') updateShopButtons();
                    } else if (gameState !== 'GAMEOVER') {
                        gameState = 'GAMEOVER'; 
                        document.exitPointerLock(); 
                        document.getElementById('final-score').innerText = `PÉNZ: ${score}`; 
                        document.getElementById('final-wave').innerText = `TÚLÉLT HULLÁMOK: ${currentWave}`; 
                        document.getElementById('game-over').classList.remove('hidden');
                    }
                }
            }
            
            // 2. Zombik gyógyítása
            for (let en of enemies) {
                let enemyPuddleCount = 0;
                for (let p of toxicPuddles) {
                    let distSq = Math.pow(en.mesh.position.x - p.position.x, 2) + Math.pow(en.mesh.position.z - p.position.z, 2);
                    if (distSq <= 1.2) enemyPuddleCount++; // Nekik is kisebb rádiusz kell
                }
                if (enemyPuddleCount > 0) {
                    let baseStats = difficultySettings[currentDifficulty];
                    let maxEnemyHP = baseStats.health * en.damageMult;
                    en.health = Math.min(maxEnemyHP, en.health + (enemyPuddleCount * 1.0));
                }
            }
        }
    }
    // --- TOXIKUS LOGIKA VÉGE ---

    if (damageCooldown > 0) damageCooldown -= delta;
    if (muzzleFlash.intensity > 0) muzzleFlash.intensity = Math.max(0, muzzleFlash.intensity - delta * 30);
    if (gunMixer) gunMixer.update(delta);
    
    const screenBlood = document.getElementById('screen-blood');
    if (screenBlood && parseFloat(screenBlood.style.opacity || 0) > 0) {
        screenBlood.style.opacity = Math.max(0, parseFloat(screenBlood.style.opacity) - delta * 0.4);
    }
    
 // Részecskék organikus lebegése
    const positions = radSystem.geometry.attributes.position.array;
    const time = clock.getElapsedTime();
    for (let i = 0; i < positions.length; i += 3) { 
        positions[i + 1] += delta * 0.3; // Lassú emelkedés (Y tengely)
        positions[i] += Math.sin(time * 1.5 + positions[i+1]) * delta * 0.5; // Hullámzás (X)
        positions[i + 2] += Math.cos(time * 1.5 + positions[i+1]) * delta * 0.5; // Hullámzás (Z)
        
        if (positions[i + 1] > 10) positions[i + 1] = 0; 
    }
    radSystem.geometry.attributes.position.needsUpdate = true;

    playerLight.intensity = Math.random() < 0.1 ? Math.random() * 0.6 : 0.6 + Math.random() * 0.2;
    playerLight.position.copy(camera.position);

    radarAngle -= delta * 3.5; 
    let displayAngle = radarAngle % (Math.PI * 2); 
    if (displayAngle < 0) displayAngle += Math.PI * 2;
    const radarScanner = document.querySelector('.radar-scanner');
    if (radarScanner) radarScanner.style.transform = `translate(0, -50%) rotate(${displayAngle}rad)`;

    // Bolt nyitása és EGÉR VISSZAADÁSA
    // A hullám véget ér, ha már csak a menekülő szörnyek élnek (vagy senki)
    if (isWaveActive && enemies.filter(e => e.type !== 'crawler').length === 0) {
        isWaveActive = false; 
        let waveDuration = clock.getElapsedTime() - waveStartTime;
        let parTime = enemiesToSpawn * 4; 
        lastWaveBonus = 0;
        if (waveDuration < parTime) {
            let savedSeconds = Math.floor(parTime - waveDuration);
            lastWaveBonus = savedSeconds * 10;
            score += lastWaveBonus;
            if (typeof updateUI === 'function') updateUI();
        }
        document.exitPointerLock(); // <-- Visszaadjuk az egeret a bolthoz!
        if (typeof openShop === 'function') openShop(); 

        if (isWaveActive && enemies.filter(e => e.type !== 'crawler').length === 0) {
        isWaveActive = false; 
        
        let waveDuration = clock.getElapsedTime() - waveStartTime;
        let parTime = enemiesToSpawn * 4; 
        lastWaveBonus = 0;
        if (waveDuration < parTime) {
            let savedSeconds = Math.floor(parTime - waveDuration);
            lastWaveBonus = savedSeconds * 10;
            score += lastWaveBonus;
            if (typeof updateUI === 'function') updateUI();
        }

        // --- ÚJ TAKARÍTÁS: A túlélő Crawlerek (Loot Goblinok) eltüntetése ---
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].type === 'crawler') {
                let survivor = enemies[i];
                
                // 3D modell és hitbox eltávolítása a térből
                scene.remove(survivor.mesh);
                let bIdx = enemyHitboxes.indexOf(survivor.bodyHitbox);
                if (bIdx > -1) enemyHitboxes.splice(bIdx, 1);
                let hIdx = enemyHitboxes.indexOf(survivor.headHitbox);
                if (hIdx > -1) enemyHitboxes.splice(hIdx, 1);
                
                // Pötty törlése a radarról
                if (survivor.blip && survivor.blip.parentNode) {
                    survivor.blip.parentNode.removeChild(survivor.blip);
                }
                
                // Törlés a logikai tömbből
                enemies.splice(i, 1);
            }
        }
        // --------------------------------------------------------------------

        document.exitPointerLock(); 
        if (typeof openShop === 'function') openShop(); 
    }
    }

    // Kamera Rázkódás, Visszarúgás és Lépkedés
    if (isNaN(pitch)) pitch = 0; if (isNaN(yaw)) yaw = 0;
    recoilPitch = Math.max(0, recoilPitch - delta * 1.5);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch + recoilPitch, yaw, 0, 'YXZ'));
    
    let shakeX = 0, shakeY = 0;
    if (cameraShake > 0) {
        shakeX = (Math.random() - 0.5) * cameraShake; shakeY = (Math.random() - 0.5) * cameraShake;
        cameraShake -= delta;
    }
    
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); 
    forward.y = 0; 
    if (forward.lengthSq() > 0.001) forward.normalize(); else forward.set(0,0,-1);
    
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
    
  // Sebesség növelése a képesség alapján (+20% szintenként)
    let speedMult = 0.15 * (1 + (skills.speed.level * 0.2));
    let nextX = camera.position.x + forward.x*(moveZ*-speedMult) + right.x*(moveX*speedMult);
    let nextZ = camera.position.z + forward.z*(moveZ*-speedMult) + right.z*(moveX*speedMult);
    
    if (!checkWallCollision(nextX, camera.position.z, playerRadius)) camera.position.x = nextX;
    if (!checkWallCollision(camera.position.x, nextZ, playerRadius)) camera.position.z = nextZ;

    velocityY -= gravity; baseCamY += velocityY; 
    if (baseCamY < 1.6) { baseCamY = 1.6; velocityY = 0; }
    
    const speed = Math.hypot(moveX, moveZ); 
    if (speed > 0.05) { bobTime += delta * 12; currentBob = Math.sin(bobTime) * 0.06; } 
    else { currentBob += (0 - currentBob) * delta * 10; }
    
    // --- JAVÍTÁS: A rázkódás csak ideiglenes eltolás (rendereléshez), nem módosítja a fizikai pozíciót! ---
    let savedCamX = camera.position.x;
    camera.position.x += shakeX;
    camera.position.y = baseCamY + currentBob + shakeY;

// --- FAGYASZTÁS COOLDOWN ÉS EFFEKT ---
    if (activeFreezeTimer > 0) {
        activeFreezeTimer -= delta;
        if (activeFreezeTimer <= 0 && document.getElementById('ice-overlay')) document.getElementById('ice-overlay').style.opacity = 0;
    }
    if (freezeCooldown > 0) {
        freezeCooldown -= delta;
        const fBtn = document.getElementById('freeze-btn');
        if (fBtn && activeFreezeTimer <= 0) {
            fBtn.innerText = freezeCooldown > 0 ? `⏳ ${Math.ceil(freezeCooldown)}s` : `❄️ FAGYASZTÁS`;
            if (freezeCooldown <= 0) fBtn.disabled = false;
        }
    }
    
    // --- Sérthetetlenség (Revive után) ---
    if (invincibilityTimer > 0) invincibilityTimer -= delta;

    // --- Zombik AI ---
    for (let i = 0; i < enemies.length; i++) {
        const en = enemies[i]; 
        
        en.lifeTime -= delta;
        if (en.lifeTime <= 0) {
            // Letelt az idő, a szörny elmenekült! Töröljük nyom nélkül.
            scene.remove(en.mesh); 
            let bIdx = enemyHitboxes.indexOf(en.bodyHitbox);
            if (bIdx > -1) enemyHitboxes.splice(bIdx, 1); 
            let hIdx = enemyHitboxes.indexOf(en.headHitbox);
            if (hIdx > -1) enemyHitboxes.splice(hIdx, 1);
            if (en.blip && en.blip.parentNode) en.blip.parentNode.removeChild(en.blip);
            
            enemies.splice(i, 1);
            i--; // Visszaléptetjük az indexet, mivel töröltünk egyet a tömbből
            continue; 
        }

        // Ha fagyasztás van, a zombi nem mozog és az animáció is megáll!
        if (activeFreezeTimer > 0) {
            if (en.mixer) en.mixer.timeScale = 0; 
            continue; // Ugrás a következő zombira (nem támad, nem mozog)
        } else {
            if (en.mixer) { en.mixer.timeScale = 1; en.mixer.update(delta); }
        }

        const distToPlayer = Math.hypot(savedCamX - en.mesh.position.x, camera.position.z - en.mesh.position.z);
 
       // --- ÚJ: MENEKÜLŐ (CRAWLER) LOGIKA (PATTOGÓ/KAOTIKUS) ---
        if (en.type === 'crawler') {
            if (en.mixer) { en.mixer.timeScale = 2.0; en.mixer.update(delta); } 
            
            // Ha még nincs saját iránya (velocity), adunk neki egy random irányt
            if (!en.velocity) {
                let angle = Math.random() * Math.PI * 2;
                en.velocity = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
            }

            // Kiszámítjuk, hova lépne
            let mX = en.velocity.x * en.speed;
            let mZ = en.velocity.z * en.speed;

            // FONTOS: Visszapattanás a falakról (Biliárd logika)
            let hitWallX = checkWallCollision(en.mesh.position.x + mX, en.mesh.position.z, enemyRadius);
            let hitWallZ = checkWallCollision(en.mesh.position.x, en.mesh.position.z + mZ, enemyRadius);

            if (hitWallX) {
                en.velocity.x *= -1; // Visszapattan X tengelyen
                mX = en.velocity.x * en.speed;
            }
            if (hitWallZ) {
                en.velocity.z *= -1; // Visszapattan Z tengelyen
                mZ = en.velocity.z * en.speed;
            }

            // A játékos is elijeszti (Ha túl közel mész, megváltoztatja az irányát)
            if (distToPlayer < 8.0) {
                // Menekülés a játékos elől, de lágyan belekeverve a jelenlegi irányába
                let flee = new THREE.Vector3().subVectors(en.mesh.position, new THREE.Vector3(savedCamX, 0, camera.position.z)).normalize();
                en.velocity.lerp(flee, 0.05).normalize(); 
            }

            // Mozgás alkalmazása
            en.mesh.position.x += mX;
            en.mesh.position.z += mZ;

            // A fej forgatása a mozgás irányába (hogy ne oldalazva fusson)
            en.mesh.lookAt(en.mesh.position.x + en.velocity.x, 0, en.mesh.position.z + en.velocity.z);

            // Radar frissítése kékkel
            if (en.blip) {
                const localPos = en.mesh.position.clone(); camera.worldToLocal(localPos);
                en.blip.style.left = (50 + localPos.x * 1.2) + '%'; en.blip.style.top = (50 + localPos.z * 1.2) + '%';
                en.blip.style.backgroundColor = '#00ffff'; 
                en.blip.style.boxShadow = '0 0 8px #00ffff'; // Kicsit világítson a radaron
                en.blip.classList.add('visible');
            }
            continue; // Kihagyja a normál zombi támadást
        }
       
        // 1. Egyedi támadási távolság: A Boss-nak sokkal hosszabb a keze (6.0), a többinek marad a 3.0
        let attackRange = (en.type === 'boss') ? 6.0 : 3.0;
        
        if (distToPlayer <= attackRange) {
            // TÁMADÁS ANIMÁCIÓ BEKAPCSOLÁSA (Ha van)
            if (en.attackAction && en.currentAction !== en.attackAction) {
                en.runAction.fadeOut(0.2);
                en.attackAction.reset().fadeIn(0.2).play();
                en.currentAction = en.attackAction;
            }

            const stats = difficultySettings[currentDifficulty];
            let rawDamage = stats.damage * en.damageMult; 
            if (playerArmor > 0) {
                let block = Math.min(playerArmor, rawDamage * 2); 
                playerArmor -= block; rawDamage -= block / 2;
            }
            if (rawDamage > 0) playerHealth -= rawDamage;
            
            if (typeof updateUI === 'function') updateUI(); 
            const screenBlood = document.getElementById('screen-blood');
            if (screenBlood) screenBlood.style.opacity = 1.0;
            
            // Ha épp letelt a sebzés-késleltetés, akkor játsszuk le a fájdalom/ijesztés hangokat
            if (damageCooldown <= 0) { 
                damageCooldown = 1.0; 
                cameraShake = 0.5; 
                
                // --- ÚJ: BOSS EFFEKTEK ---
                if (en.type === 'boss') {
                    playSound('bossAttack'); // Őrjöngő üvöltés
                    // Képernyő glitch
                    const glitchOverlay = document.getElementById('glitch-overlay');
                    if (glitchOverlay) {
                        glitchOverlay.classList.remove('hidden');
                        glitchOverlay.classList.add('glitch-active');
                        // Fél másodperc után elmúlik a zavar
                        setTimeout(() => {
                            glitchOverlay.classList.remove('glitch-active');
                            glitchOverlay.classList.add('hidden');
                        }, 500);
                    }
                } else {
                    playSound('hurt'); // Normál zombinál csak te kiáltasz fel
                }
            } 
            
            // ... (Itt folytatódik a meglévő Halál/Újraéledés (Revive) kódod)
            
// Halál ÉS Újraéledés (Revive) mechanika
            if (playerHealth <= 0) {
                if (skills.revive.level > 0 && gameState === 'PLAYING') {
                    // FELÉLEDÉS!
                    skills.revive.level--;
                    playerHealth = 100 + (skills.maxHealth.level * 20); // Max életre gyógyul
                    invincibilityTimer = 2.0; // 2 másodperc I-Frame
                    playSound('heal'); // Használjuk a gyógyulás hangját éledéskor
                    
                    // Képernyő villanás
                    const healFlash = document.getElementById('heal-flash');
                    if (healFlash) { healFlash.style.opacity = 1; setTimeout(() => healFlash.style.opacity = 0, 500); }
                    if (typeof updateUI === 'function') updateShopButtons(); // Frissítjük a bolt gombot is
                } 
                else if (gameState !== 'GAMEOVER') {
                    // VÉGLEGES HALÁL
                    gameState = 'GAMEOVER'; 
                    document.exitPointerLock(); 
                    document.getElementById('final-score').innerText = `PÉNZ: ${score}`; 
                    document.getElementById('final-wave').innerText = `TÚLÉLT HULLÁMOK: ${currentWave}`; 
                    document.getElementById('game-over').classList.remove('hidden');
                }
            }
        } else {
            const enemyDir = new THREE.Vector3().subVectors(new THREE.Vector3(savedCamX, 0, camera.position.z), en.mesh.position).normalize(); 

            // FUTÁS ANIMÁCIÓ VISSZAKAPCSOLÁSA
            if (en.attackAction && en.currentAction !== en.runAction) {
                en.attackAction.fadeOut(0.2);
                en.runAction.reset().fadeIn(0.2).play();
                en.currentAction = en.runAction;
            }

            enemyDir.y = 0; en.mesh.lookAt(savedCamX, 0, camera.position.z); 
            
            let sep = new THREE.Vector3();
            for (let j = 0; j < enemies.length; j++) {
                if (i !== j) {
                    let d = Math.hypot(en.mesh.position.x - enemies[j].mesh.position.x, en.mesh.position.z - enemies[j].mesh.position.z);
                    if (d < enemyRadius * 1.5 && d > 0.01) {
                        sep.add(new THREE.Vector3().subVectors(en.mesh.position, enemies[j].mesh.position).normalize().multiplyScalar((enemyRadius * 1.5 - d) * 0.05));
                    }
                }
            }
            
            let mX = (enemyDir.x * en.speed) + sep.x; let mZ = (enemyDir.z * en.speed) + sep.z;
            if (!checkWallCollision(en.mesh.position.x + mX, en.mesh.position.z, enemyRadius)) en.mesh.position.x += mX;
            if (!checkWallCollision(en.mesh.position.x, en.mesh.position.z + mZ, enemyRadius)) en.mesh.position.z += mZ;
        }

        if (en.blip) {
            const localPos = en.mesh.position.clone(); camera.worldToLocal(localPos);
            en.blip.style.left = (50 + localPos.x * 1.2) + '%'; en.blip.style.top = (50 + localPos.z * 1.2) + '%';
            
            let targetAngle = Math.atan2(localPos.z, localPos.x); if (targetAngle < 0) targetAngle += Math.PI * 2;
            let diff = Math.abs(targetAngle - displayAngle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < 0.3) en.blip.classList.add('visible'); else en.blip.classList.remove('visible');
        }
    }

    for (let i = medkits.length - 1; i >= 0; i--) { 
        const mk = medkits[i]; mk.floatTime += 0.05; mk.mesh.position.y = mk.startY + Math.sin(mk.floatTime) * 0.3; 
if (Math.hypot(savedCamX - mk.mesh.position.x, camera.position.z - mk.mesh.position.z) < 1.5) { 
            playSound('heal'); 
            const healFlash = document.getElementById('heal-flash');
            if (healFlash) { healFlash.style.opacity = 1; setTimeout(() => healFlash.style.opacity = 0, 200); }
            
            // ÉLET LOOT FEJLESZTÉS:
            let maxHP = 100 + (skills.maxHealth.level * 20);
            let healAmount = 40 * (1 + (skills.healthLoot.level * 0.2));
            playerHealth = Math.min(maxHP, playerHealth + healAmount); 
            
            if (typeof updateUI === 'function') updateUI(); 
            scene.remove(mk.mesh); medkits.splice(i, 1); 
          setTimeout(() => { if(gameState !== 'MENU' && gameState !== 'GAMEOVER' && typeof spawnMedkit === 'function') spawnMedkit(getSafeSpawnPosition(0.5, 5).x, getSafeSpawnPosition(0.5, 5).z); }, 5000); 
        }
    }
    
    for (let i = ammoBoxes.length - 1; i >= 0; i--) { 
        const ab = ammoBoxes[i]; ab.floatTime += 0.05; ab.mesh.position.y = ab.startY + Math.sin(ab.floatTime) * 0.2; 
        if (Math.hypot(savedCamX - ab.mesh.position.x, camera.position.z - ab.mesh.position.z) < 1.5) { 
            playSound('ammo'); 
            const ammoFlash = document.getElementById('ammo-flash'); 
            if(ammoFlash) { ammoFlash.style.opacity = 1; setTimeout(() => ammoFlash.style.opacity = 0, 200); }
           // LŐSZER LOOT FEJLESZTÉS:
            let w = weapons[currentWeaponId]; 
            let ammoAmount = w.maxAmmo * 2 * (1 + (skills.ammoLoot.level * 0.2));
            w.reserve = Math.min(w.maxReserve, Math.floor(w.reserve + ammoAmount));
            if (typeof updateUI === 'function') updateUI(); 
            scene.remove(ab.mesh); ammoBoxes.splice(i, 1); 
            setTimeout(() => { if(gameState !== 'MENU' && gameState !== 'GAMEOVER' && typeof spawnAmmoBox === 'function') spawnAmmoBox(getSafeSpawnPosition(0.4, 5).x, getSafeSpawnPosition(0.4, 5).z); }, 5000);
        } 
    }
    
for (let i = particles.length - 1; i >= 0; i--) { 
        let p = particles[i]; p.life -= 0.02; p.vy -= 0.02; 
        p.mesh.position.x += p.vx; p.mesh.position.y += p.vy; p.mesh.position.z += p.vz; 
        if (p.life <= 0) { 
            scene.remove(p.mesh); 
            p.mesh.geometry.dispose(); p.mesh.material.dispose(); // Törlés a VRAM-ból!
            particles.splice(i, 1); 
        } 
    }

    renderer.render(scene, camera);
    
    // VISSZAÁLLÍTJUK A KORÁBBI X POZÍCIÓT (így nem sodródunk bele a falba)
    camera.position.x = savedCamX;
}



// ==========================================
// TÖLTŐKÉPERNYŐ ÉS MENÜ LOGIKA
// ==========================================
let minLoadingTimePassed = false;
let loadingTimer = 0;

const loadInterval = setInterval(() => {
    loadingTimer += 100; // 100ms-enként frissül
    
    const liquid = document.getElementById('radioactive-liquid');
    const statusText = document.getElementById('loading-status');
    const continueBtn = document.getElementById('loading-continue-btn'); // Gomb lekérése
    
    // Folyadék animálása 0-tól 90%-ig a fix idő alatt
    let progress = Math.min((loadingTimer / 5000) * 90, 90);
    if(liquid) liquid.style.width = progress + '%';
    if(statusText) statusText.innerText = "Modellek dekódolása... " + Math.floor(progress) + "%";

    if (loadingTimer >= 5000) minLoadingTimePassed = true;

    // Ha az idő lejárt ÉS a modellek betöltöttek
    if (minLoadingTimePassed && zombieModel && fastZombieModel && hiderZombieModel && ammoModel && healthModel) {
        clearInterval(loadInterval);
        
        // Csík 100%-ra ugrik
        if(liquid) liquid.style.width = '100%';
        if(statusText) statusText.innerText = "RENDSZER ONLINE. KÉSZENLÉT.";

        // ÚJ: Automatikus továbbugrás helyett megjelenítjük a gombot
        if(continueBtn) continueBtn.classList.remove('hidden');
    }
}, 100);

// ÚJ: Kattintás a "Belépés a rendszerbe" gombra
document.getElementById('loading-continue-btn').addEventListener('click', () => {
    // Böngésző hangfeloldása (User Interaction megvolt)
    if (listener.context.state === 'suspended') listener.context.resume();
    
    // Főmenü zene elindítása
    if (sounds['menuMusic'] && sounds['menuMusic'].buffer && !sounds['menuMusic'].isPlaying) {
        sounds['menuMusic'].play();
    }

    // Töltőképernyő eltüntetése CSS áttűnéssel
    const ls = document.getElementById('loading-screen');
    if(ls) ls.style.opacity = '0'; 
    
    setTimeout(() => {
        if(ls) ls.style.display = 'none';
        document.getElementById('main-menu').classList.remove('hidden');
        gameState = 'MENU'; // Elindul a kamera forgás
    }, 1500);
});

animate();
