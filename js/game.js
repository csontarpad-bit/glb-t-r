// ==========================================
// 1. THREE.JS ALAPOK ÉS KÖRNYEZET
// ==========================================
scene = new THREE.Scene();
scene.background = new THREE.Color(0x051a05); // Radioaktív zöldes fekete
scene.fog = new THREE.FogExp2(0x051a05, 0.035);

camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
// ÚJ SOR: Azonnal felemeljük a kamerát szemmagasságba, így látod a pályát amíg töltenek a zombik!
camera.position.set(0, 1.6, 0); 

clock = new THREE.Clock();

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

// Fények
scene.add(new THREE.AmbientLight(0x55ff55, 0.3)); // Zöldes alapfény
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

// Radioaktív por (részecskék a levegőben)
const radGeo = new THREE.BufferGeometry();
const radVerts = [];
for (let i = 0; i < 300; i++) {
    radVerts.push((Math.random() - 0.5) * 50, Math.random() * 10, (Math.random() - 0.5) * 50);
}
radGeo.setAttribute('position', new THREE.Float32BufferAttribute(radVerts, 3));
const radMat = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.1, transparent: true, opacity: 0.5 });
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

loadSound('music', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/f162302b83992b9adfe75b1c3ade387a25e2478d/music.mp3', 0.3, true); 
loadSound('ammo', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/ammo%20box.mp3', 1.0);
loadSound('shoot', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/gun%20shoot.mp3', 0.7);
loadSound('heal', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/heal.mp3', 1.0);
loadSound('hurt', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/me%20get%20hit.mp3', 1.0);
loadSound('reload', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/reload.mp3', 1.0);
loadSound('zombieHit', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/7bc7874a7ddc6802b16f0d3eafb82b2b4860e125/zombie%20get%20hit.mp3', 1.0);
loadSound('zombieDie', 'https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/1f5b9cfe04d0b19f99fdb0b263ba582b429f4f92/zombie%20die.mp3', 1.0);

window.unlockAudio = function() {
    if (listener.context.state === 'suspended') listener.context.resume();
    if (sounds['music'] && !sounds['music'].isPlaying && sounds['music'].buffer) sounds['music'].play();
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
const floorTex = textureLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6ff430b224fb8cd358b83fade1e06710d708d094/1783431196560.png',
    undefined, 
    undefined, 
    (err) => console.error('Hiba a padló textúra betöltése közben:', err)
); 
floorTex.wrapS = THREE.RepeatWrapping; floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10); 
const wallTex = textureLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6ff430b224fb8cd358b83fade1e06710d708d094/1783431502863.png',
    undefined,
    undefined,
    (err) => console.error('Hiba a fal textúra betöltése közben:', err)
); 
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

// Külső falak
createWall(arenaSize + 4, wallHeight, 2, 0, -26); 
createWall(arenaSize + 4, wallHeight, 2, 0, 26); 
createWall(2, wallHeight, arenaSize, -26, 0); 
createWall(2, wallHeight, arenaSize, 26, 0);  

// Belső oszlopok
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

// Fegyver modell
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
}, undefined, (error) => console.error('Hiba a fegyver modell betöltése közben:', error));

// Zombi, Ammo, Health modellek
gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/main/zombie.glb', (gltf) => { 
    zombieModel = gltf.scene; 
    zombieAnimations = gltf.animations; 
    zombieModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
}, undefined, (error) => console.error('Hiba a zombi modell betöltése közben:', error));

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6aa130a4c148ae5e16855905c4a15b9978e974ee/Fast%20zombie.glb', (gltf) => { 
    fastZombieModel = gltf.scene; 
    fastZombieAnimations = gltf.animations; 
    fastZombieModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
}, undefined, (error) => console.error('Hiba a gyors zombi modell betöltése közben:', error));
// Hider Zombi
gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/6aa130a4c148ae5e16855905c4a15b9978e974ee/hider%20zombie.glb', (gltf) => { 
    hiderZombieModel = gltf.scene; 
    hiderZombieAnimations = gltf.animations; 
    hiderZombieModel.traverse((c) => { if(c.isMesh) c.frustumCulled = false; }); 
}, undefined, (error) => console.error('Hiba a hider zombi modell betöltése közben:', error));

gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/db069dbbe97f2d9cd71985c37eb64dad31848434/ammo.glb', (gltf) => { ammoModel = gltf.scene; }, undefined, (error) => console.error('Hiba az ammo modell betöltése közben:', error));
gltfLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/db069dbbe97f2d9cd71985c37eb64dad31848434/health.glb', (gltf) => { healthModel = gltf.scene; }, undefined, (error) => console.error('Hiba a health modell betöltése közben:', error));

// Vérfolt generátor
function createBloodStain(x, z) {
    const geo = new THREE.CircleGeometry(1.2 + Math.random() * 0.8, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0x440000, transparent: true, opacity: 0.7, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI;
    mesh.position.set(x, 0.02, z);
    scene.add(mesh);
    bloodStains.push(mesh);
}


// ==========================================
// 4. LÖVÉS, IRÁNYÍTÁS ÉS FEGYVER LOGIKA
// ==========================================


window.handleShoot = function(e) {
    // Biztonságos eseménykezelés
    if (e) { e.preventDefault(); e.stopPropagation(); }
    
    if (gameState !== 'PLAYING' || isReloading) return;
    
    let wpn = weapons[currentWeaponId];

    // 1. Újratöltés logika
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
    
    // 2. Lövés logika
    wpn.ammo--; 
    if (typeof updateUI === 'function') updateUI(); 
    playSound('shoot', 0.4);
    
    // Vizualitás és visszarúgás
    muzzleFlash.intensity = 8.0; 
    recoilPitch += 0.08 + (wpn.spread * 0.5); 
    if (gunShootAction) { gunShootAction.stop(); gunShootAction.play(); }

    const raycaster = new THREE.Raycaster(); 
    
    // Sörétes puska (Shotgun) spread logika - Több lövedék
    for (let p = 0; p < wpn.pellets; p++) {
        const spreadX = (Math.random() - 0.5) * wpn.spread;
        const spreadY = (Math.random() - 0.5) * wpn.spread;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);
        
        const intersects = raycaster.intersectObjects(enemyHitboxes, false);
        const endPoint = intersects.length > 0 ? intersects[0].point : raycaster.ray.at(50, new THREE.Vector3());
        
        // Szuper fegyver = Kék lézer, többi = Sárga
        const laserColor = currentWeaponId === 'super' ? 0x00ffff : 0xffff00;
        const laserMat = new THREE.LineBasicMaterial({ color: laserColor, linewidth: 3 });
        const startPoint = new THREE.Vector3(0.5, -0.5, -1).applyMatrix4(camera.matrixWorld);
        const laser = new THREE.Line(new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]), laserMat);
        scene.add(laser); 
        setTimeout(() => scene.remove(laser), 100);
        
        // Találat ellenőrzése
        if (intersects.length > 0) { 
            const hitObj = intersects[0].object;
            const index = enemies.findIndex(e => e.bodyHitbox === hitObj || e.headHitbox === hitObj); 
            
            if (index > -1) { 
                const en = enemies[index];
                const isHeadshot = hitObj.userData.type === 'head';
                
                if (typeof showHitmarker === 'function') showHitmarker(isHeadshot); 
                
                // MÓDOSÍTVA: Pittyegés helyett zombi sérülés hangja
                playSound('zombieHit');

                let dmg = isHeadshot ? wpn.damage * 3 : wpn.damage;
                en.health -= dmg; 
                score += isHeadshot ? 50 : 10; // PÉNZ ADÁSA
                if (typeof updateUI === 'function') updateUI();

                // Zombi halála
                if (en.health <= 0) {
                    // MÓDOSÍTVA: Zombi halál hangja
                    playSound('zombieDie');
                    createBloodStain(en.mesh.position.x, en.mesh.position.z);
                    
                    // Robbanás részecskék
                    const particleMat = new THREE.MeshBasicMaterial({ color: 0xaa0000 });
                    for (let i = 0; i < 15; i++) {
                        const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), particleMat);
                        m.position.copy(intersects[0].point);
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



// Joypad Touch Eventek
const zoneLeft = document.getElementById('zone-left'), zoneRight = document.getElementById('zone-right');
let leftTouchId = null, rightTouchId = null, joyStartX = 0, joyStartY = 0, lastLookX = 0, lastLookY = 0;

zoneLeft.addEventListener('touchstart', (e) => { e.preventDefault(); leftTouchId = e.changedTouches[0].identifier; joyStartX = e.changedTouches[0].clientX; joyStartY = e.changedTouches[0].clientY; });
zoneLeft.addEventListener('touchmove', (e) => { 
    e.preventDefault(); 
    for (let touch of e.changedTouches) { 
        if (touch.identifier === leftTouchId) { 
            const dx = touch.clientX - joyStartX; 
            const dy = touch.clientY - joyStartY; 
            const angle = Math.atan2(dy, dx); 
            moveX = Math.cos(angle); 
            moveZ = Math.sin(angle); 
        } 
    } 
});
zoneLeft.addEventListener('touchend', (e) => { if (e.changedTouches[0].identifier === leftTouchId) { leftTouchId = null; moveX = moveZ = 0; } });

zoneRight.addEventListener('touchstart', (e) => { e.preventDefault(); rightTouchId = e.changedTouches[0].identifier; lastLookX = e.changedTouches[0].clientX; lastLookY = e.changedTouches[0].clientY; });
zoneRight.addEventListener('touchmove', (e) => { 
    e.preventDefault(); 
    for (let touch of e.changedTouches) { 
        if (touch.identifier === rightTouchId) { 
            yaw -= (touch.clientX - lastLookX) * 0.005; 
            pitch -= (touch.clientY - lastLookY) * 0.005; 
            pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch)); 
            lastLookX = touch.clientX; 
            lastLookY = touch.clientY; 
        } 
    } 
});
zoneRight.addEventListener('touchend', (e) => { if (e.changedTouches[0].identifier === rightTouchId) rightTouchId = null; });


// ==========================================
// 5. JÁTÉK CIKLUS ÉS FRISSÍTÉS
// ==========================================

window.startWaveCountdown = function() {
    let countdown = 10;
    const waveDisplay = document.getElementById('wave-display');
    
    if (waveDisplay) {
        waveDisplay.innerText = `KÉSZÜLJ...JÖNNEK!: ${countdown}mp`; 
        waveDisplay.classList.remove('hidden');
    }
    
    const waveInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) { 
            if (waveDisplay) waveDisplay.innerText = `KÉSZÜLJ...JÖNNEK!: ${countdown}mp`; 
} else {
                clearInterval(waveInterval); 
                currentWave++; 
                enemiesToSpawn += 2; 
                let bossSpawning = (currentWave % 5 === 0); 
                
                if (typeof spawnEnemy === 'function') {
                    for(let i=0; i<enemiesToSpawn; i++) spawnEnemy(getSafeSpawnPosition(enemyRadius, 10).x, getSafeSpawnPosition(enemyRadius, 10).z, bossSpawning && i===0);
                }
                
                isWaveActive = true; 
               
                waveStartTime = clock.getElapsedTime(); 
                
                if (waveDisplay) {
                    waveDisplay.innerText = `${currentWave}. HULLÁM`;
                    setTimeout(() => waveDisplay.classList.add('hidden'), 2000);
                }
            }
    }, 1000);
}

window.startGame = function() {
    if (!zombieModel || !ammoModel || !healthModel || !fastZombieModel || !hiderZombieModel) { 
        setTimeout(window.startGame, 500); 
        return; 
    }
    
    // --- ÚJ: Garantáljuk, hogy minden fizikai változó valós szám legyen induláskor ---
    window.moveX = 0; window.moveZ = 0; 
    window.pitch = 0; window.yaw = 0; 
    window.recoilPitch = 0; window.cameraShake = 0; 
    window.baseCamY = 1.6; window.velocityY = 0; window.gravity = 0.005;
    if (camera) camera.position.set(0, baseCamY, 0);
    // ---------------------------------------------------------------------------------
    
    gameState = 'PLAYING'; 
    playerHealth = 100; 
    playerArmor = 0; 
    score = 0; 
    currentWave = 1; 
    enemiesToSpawn = 5; 
    currentWeaponId = 'pistol';
    
    weapons.pistol.ammo = weapons.pistol.maxAmmo; 
    weapons.pistol.reserve = weapons.pistol.maxReserve;
    
    if (typeof updateUI === 'function') updateUI();
    camera.position.set(0, baseCamY, 0);
    
    // Pálya takarítás
    const radarContainer = document.getElementById('radar');
    for (let i = 0; i < enemies.length; i++) { 
        scene.remove(enemies[i].mesh); 
        if (radarContainer && enemies[i].blip && enemies[i].blip.parentNode) radarContainer.removeChild(enemies[i].blip); 
    }
    enemies.length = 0; 
    enemyHitboxes.length = 0; 
    
    bloodStains.forEach(b => scene.remove(b)); bloodStains.length = 0;
    medkits.forEach(mk => scene.remove(mk.mesh)); medkits.length = 0; 
    ammoBoxes.forEach(ab => scene.remove(ab.mesh)); ammoBoxes.length = 0;
    
    // Spawn
    if(typeof spawnEnemy === 'function') {
        for (let i = 0; i < enemiesToSpawn; i++) spawnEnemy(getSafeSpawnPosition(enemyRadius, 10).x, getSafeSpawnPosition(enemyRadius, 10).z);
    }
    if(typeof spawnMedkit === 'function') {
        for (let i = 0; i < 4; i++) spawnMedkit(getSafeSpawnPosition(0.5, 5).x, getSafeSpawnPosition(0.5, 5).z);
        for (let i = 0; i < 4; i++) spawnAmmoBox(getSafeSpawnPosition(0.4, 5).x, getSafeSpawnPosition(0.4, 5).z);
    }
    
    isWaveActive = true;
}

let currentBob = 0;

function animate() {
    requestAnimationFrame(animate); 
    const delta = clock.getDelta();

    // 1. Állapotellenőrzés
    if (gameState !== 'PLAYING') { 
        renderer.render(scene, camera); 
        return; 
    }

    // 2. Automata tüzelés logikája (ezt szúrd be ide)
    let wpn = weapons[currentWeaponId];
    if (isShootingBtnPressed && wpn.auto) {
        autoShootTimer -= delta;
        if (autoShootTimer <= 0) {
            handleShoot();
            autoShootTimer = wpn.fireRate;
        }
    }

    // Effektek frissítése
    if (damageCooldown > 0) damageCooldown -= delta;
    if (muzzleFlash.intensity > 0) muzzleFlash.intensity = Math.max(0, muzzleFlash.intensity - delta * 30);
    if (gunMixer) gunMixer.update(delta);
    
    const screenBlood = document.getElementById('screen-blood');
    if (screenBlood && parseFloat(screenBlood.style.opacity || 0) > 0) {
        screenBlood.style.opacity = Math.max(0, parseFloat(screenBlood.style.opacity) - delta * 0.4);
    }
    
    // Rádióaktív részecskék mozgatása
    const positions = radSystem.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) { 
        positions[i] += delta * 0.5; 
        if (positions[i] > 10) positions[i] = 0; 
    }
    radSystem.geometry.attributes.position.needsUpdate = true;

    // Lámpa pislákolás
    playerLight.intensity = Math.random() < 0.1 ? Math.random() * 0.6 : 0.6 + Math.random() * 0.2;
    playerLight.position.copy(camera.position);

    // Radar letapogató
    radarAngle -= delta * 3.5; 
    let displayAngle = radarAngle % (Math.PI * 2); 
    if (displayAngle < 0) displayAngle += Math.PI * 2;
    const radarScanner = document.querySelector('.radar-scanner');
    if (radarScanner) radarScanner.style.transform = `translate(0, -50%) rotate(${displayAngle}rad)`;

// Hullám menedzser és Bolt (Bónusz számolással)
    if (isWaveActive && enemies.length === 0) {
        isWaveActive = false; 
        
        let waveDuration = clock.getElapsedTime() - waveStartTime;
        let parTime = enemiesToSpawn * 4; // Célidő: kb. 4 másodperc / zombi
        lastWaveBonus = 0;
        
        if (waveDuration < parTime) {
            // Megspórolt másodpercenként 10 Pénz bónusz
            let savedSeconds = Math.floor(parTime - waveDuration);
            lastWaveBonus = savedSeconds * 10;
            score += lastWaveBonus;
            if (typeof updateUI === 'function') updateUI();
        }
        
        if (typeof openShop === 'function') openShop(); 
    }

    // Kamera Rázkódás, Visszarúgás és Lépkedés
    recoilPitch = Math.max(0, recoilPitch - delta * 1.5);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch + recoilPitch, yaw, 0, 'YXZ'));
    
    let shakeX = 0, shakeY = 0;
    if (cameraShake > 0) {
        shakeX = (Math.random() - 0.5) * cameraShake;
        shakeY = (Math.random() - 0.5) * cameraShake;
        cameraShake -= delta;
    }
    
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
    
    let nextX = camera.position.x + forward.x*(moveZ*-0.15) + right.x*(moveX*0.15);
    let nextZ = camera.position.z + forward.z*(moveZ*-0.15) + right.z*(moveX*0.15);
    
    if (!checkWallCollision(nextX, camera.position.z, playerRadius)) camera.position.x = nextX;
    if (!checkWallCollision(camera.position.x, nextZ, playerRadius)) camera.position.z = nextZ;

    velocityY -= gravity; 
    baseCamY += velocityY; 
    if (baseCamY < 1.6) { baseCamY = 1.6; velocityY = 0; }
    
    const speed = Math.hypot(moveX, moveZ); 
    if (speed > 0.05) { 
        bobTime += delta * 12; 
        currentBob = Math.sin(bobTime) * 0.06; 
    } else { 
        currentBob += (0 - currentBob) * delta * 10; 
    }
    
    camera.position.y = baseCamY + currentBob + shakeY;
    camera.position.x += shakeX;

    // Zombik AI Logika
    for (let i = 0; i < enemies.length; i++) {
        const en = enemies[i]; 
        if (en.mixer) en.mixer.update(delta);
        const distToPlayer = Math.hypot(camera.position.x - en.mesh.position.x, camera.position.z - en.mesh.position.z);
        
        // Támadás
        if (distToPlayer <= 3.0) {
            const stats = difficultySettings[currentDifficulty];
            let rawDamage = stats.damage * en.damageMult; 
            
            // Páncél logika
            if (playerArmor > 0) {
                let block = Math.min(playerArmor, rawDamage * 2); 
                playerArmor -= block;
                rawDamage -= block / 2;
            }
            if (rawDamage > 0) playerHealth -= rawDamage;
            
            if (typeof updateUI === 'function') updateUI(); 
            if (screenBlood) screenBlood.style.opacity = 1.0;
            
            if (damageCooldown <= 0) { 
                playSound('hurt'); 
                damageCooldown = 1.0; 
                cameraShake = 0.5; 
            } 
            
            if (playerHealth <= 0 && gameState !== 'GAMEOVER') {
                gameState = 'GAMEOVER'; 
                document.getElementById('final-score').innerText = `PÉNZ: ${score}`; 
                document.getElementById('final-wave').innerText = `TÚLÉLT HULLÁMOK: ${currentWave}`; 
                document.getElementById('game-over').classList.remove('hidden');
            }
        } 
        // Mozgás (Követés + Szeparáció + Falon csúszás)
        else {
            const enemyDir = new THREE.Vector3().subVectors(camera.position, en.mesh.position).normalize(); 
            enemyDir.y = 0; 
            en.mesh.lookAt(camera.position.x, 0, camera.position.z); 
            
            let sep = new THREE.Vector3();
            for (let j = 0; j < enemies.length; j++) {
                if (i !== j) {
                    let d = Math.hypot(en.mesh.position.x - enemies[j].mesh.position.x, en.mesh.position.z - enemies[j].mesh.position.z);
                    if (d < enemyRadius * 1.5 && d > 0.01) {
                        sep.add(new THREE.Vector3().subVectors(en.mesh.position, enemies[j].mesh.position).normalize().multiplyScalar((enemyRadius * 1.5 - d) * 0.05));
                    }
                }
            }
            
            let mX = (enemyDir.x * en.speed) + sep.x; 
            let mZ = (enemyDir.z * en.speed) + sep.z;
            
            if (!checkWallCollision(en.mesh.position.x + mX, en.mesh.position.z, enemyRadius)) en.mesh.position.x += mX;
            if (!checkWallCollision(en.mesh.position.x, en.mesh.position.z + mZ, enemyRadius)) en.mesh.position.z += mZ;
        }

        // Radar frissítés
        if (en.blip) {
            const localPos = en.mesh.position.clone(); 
            camera.worldToLocal(localPos);
            en.blip.style.left = (50 + localPos.x * 1.2) + '%'; 
            en.blip.style.top = (50 + localPos.z * 1.2) + '%';
            
            let targetAngle = Math.atan2(localPos.z, localPos.x); 
            if (targetAngle < 0) targetAngle += Math.PI * 2;
            let diff = Math.abs(targetAngle - displayAngle); 
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            
            if (diff < 0.3) en.blip.classList.add('visible'); 
            else en.blip.classList.remove('visible');
        }
    }


// Loot felvétel és Részecskék mozgása
    for (let i = medkits.length - 1; i >= 0; i--) { 
        const mk = medkits[i]; 
        mk.floatTime += 0.05; 
        mk.mesh.position.y = mk.startY + Math.sin(mk.floatTime) * 0.3; 
        
        if (Math.hypot(camera.position.x - mk.mesh.position.x, camera.position.z - mk.mesh.position.z) < 1.5) { 
            // EZ A SOR JÁTSSZA LE A HANGOT
            playSound('heal'); 
            
            const healFlash = document.getElementById('heal-flash');
            if (healFlash) {
                healFlash.style.opacity = 1;
                setTimeout(() => healFlash.style.opacity = 0, 200);
            }
            
            playerHealth = Math.min(100, playerHealth + 40); 
            if (typeof updateUI === 'function') updateUI(); 
            scene.remove(mk.mesh); 
            medkits.splice(i, 1); 
            setTimeout(() => { if(gameState === 'PLAYING' && typeof spawnMedkit === 'function') spawnMedkit(getSafeSpawnPosition(0.5, 5).x, getSafeSpawnPosition(0.5, 5).z); }, 5000); 
        } 
    }
    
for (let i = ammoBoxes.length - 1; i >= 0; i--) { 
        const ab = ammoBoxes[i]; 
        ab.floatTime += 0.05; 
        ab.mesh.position.y = ab.startY + Math.sin(ab.floatTime) * 0.2; 
        
        if (Math.hypot(camera.position.x - ab.mesh.position.x, camera.position.z - ab.mesh.position.z) < 1.5) { 
            playSound('ammo'); 
            
            const ammoFlash = document.getElementById('ammo-flash'); 
            if(ammoFlash) { 
                ammoFlash.style.opacity = 1; 
                setTimeout(() => ammoFlash.style.opacity = 0, 200); 
            }
            
            let w = weapons[currentWeaponId]; 
            w.reserve = Math.min(w.maxReserve, w.reserve + w.maxAmmo * 2); 
            if (typeof updateUI === 'function') updateUI(); 
            scene.remove(ab.mesh); 
            ammoBoxes.splice(i, 1); 
            setTimeout(() => { if(gameState === 'PLAYING' && typeof spawnAmmoBox === 'function') spawnAmmoBox(getSafeSpawnPosition(0.4, 5).x, getSafeSpawnPosition(0.4, 5).z); }, 5000); 
        } 
    }
    
    for (let i = particles.length - 1; i >= 0; i--) { 
        let p = particles[i]; 
        p.life -= 0.02; 
        p.vy -= 0.02; 
        p.mesh.position.x += p.vx; 
        p.mesh.position.y += p.vy; 
        p.mesh.position.z += p.vz; 
        if (p.life <= 0) { 
            scene.remove(p.mesh); 
            particles.splice(i, 1); 
        } 
    }

    // --- ÚJ: Biztonsági háló NaN mérgezés ellen (Ha elszáll a matek, visszatesz középre) ---
    if (isNaN(camera.position.x) || isNaN(camera.position.y) || isNaN(camera.position.z)) {
        camera.position.set(0, 1.6, 0);
    }
    // --------------------------------------------------------------------------------------

    // --- JÁTÉKOS POZÍCIÓJÁNAK KORLÁTOZÁSA (Falba lökés ellen) ---
    const playerLimit = 23.5; // A fal belső síkja. (Így a kamera nem mehet át rajta)
    camera.position.x = Math.max(-playerLimit, Math.min(playerLimit, camera.position.x));
    camera.position.z = Math.max(-playerLimit, Math.min(playerLimit, camera.position.z));
    
    renderer.render(scene, camera);
}
const shootBtn = document.getElementById('shoot-btn');
if(shootBtn) {
    shootBtn.addEventListener('touchstart', (e) => { e.preventDefault(); isShootingBtnPressed = true; handleShoot(e); });
    shootBtn.addEventListener('touchend', (e) => { e.preventDefault(); isShootingBtnPressed = false; });
    shootBtn.addEventListener('mousedown', () => { isShootingBtnPressed = true; handleShoot(); });
    shootBtn.addEventListener('mouseup', () => { isShootingBtnPressed = false; });
}

// ==========================================
// KÉPERNYŐ ÁTMÉRETEZÉSÉNEK KEZELÉSE (Képarány és célkereszt javítása)
// ==========================================
function resizeGame() {
    if (camera && renderer) {
        // Frissítjük a kamera képarányát
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // Frissítjük a renderelő felbontását az új, immár teljes képernyős méretre
        renderer.setSize(window.innerWidth, window.innerHeight);

        // ÚJ: Kényszerítjük a UI konténert, hogy pixelre pontosan egyezzen a játéktérrel
        const uiWrapper = document.getElementById('game-ui-wrapper');
        if (uiWrapper) {
            uiWrapper.style.width = window.innerWidth + 'px';
            uiWrapper.style.height = window.innerHeight + 'px';
        }
    }
}

// Alap átméretezés figyelése
window.addEventListener('resize', resizeGame);

// ÚJ: Külön figyeljük a teljes képernyős váltást, és adunk neki egy kis időt (200ms), 
// amíg a mobil animációja befejeződik, mielőtt újraszámolnánk a pontos méreteket és a lövés irányát.
document.addEventListener('fullscreenchange', () => setTimeout(resizeGame, 200));
document.addEventListener('webkitfullscreenchange', () => setTimeout(resizeGame, 200));

animate();
