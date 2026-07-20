
// --- ÚJ GLOBÁLIS ANYAGOK ÉS GEOMETRIÁK ---
const texLoader = new THREE.TextureLoader();
// Sima betöltés inverzió nélkül
const puddleTex = texLoader.load('https://raw.githubusercontent.com/csontarpad-bit/glb-t-r/102a0d507c37ef59b9aeb075e1b30110c95f3b3f/puddle.jpg'); 
puddleTex.wrapS = THREE.RepeatWrapping;
puddleTex.wrapT = THREE.RepeatWrapping;

const globalToxicMat = new THREE.MeshBasicMaterial({ 
    map: puddleTex, 
    color: 0x55ff55,     
    transparent: true, 
    opacity: 0.8, 
    depthWrite: false 
});

const globalHitboxMat = new THREE.MeshBasicMaterial({ visible: false });
const globalBodyGeo = new THREE.BoxGeometry(1.0, 1.4, 1.0);
const globalHeadGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);

function getSafeSpawnPosition(radius, minDist = 0) {
    let x, z; let isSafe = false; let attempts = 0;
    
    // Megemeltük a próbálkozások számát 100-ra, hogy a gép biztosan találjon tiszta helyet
    while (!isSafe && attempts < 100) { 
        
        // 46 helyett 42: Így a pálya legszélére sem tudnak spawnolni, nem lógnak bele a külső falba
        x = (Math.random() - 0.5) * 42; 
        z = (Math.random() - 0.5) * 42; 
        
        let distToPlayer = Math.hypot(camera.position.x - x, camera.position.z - z);
        
        if (distToPlayer >= minDist) {
            if (typeof checkWallCollision === 'function') {
                // A TRÜKK: Megszorozzuk a sugarat 3.5-tel! 
                // Így egy hatalmas, láthatatlan "erőtér" lesz az oszlopok körül spawnoláskor.
                let safeRadius = radius * 3.5; 
                
                if (!checkWallCollision(x, z, safeRadius)) {
                    isSafe = true; // Találtunk egy tökéletesen üres, biztonságos helyet!
                }
            } else {
                isSafe = true;
            }
        }
        attempts++;
    }
    
    // Ha 100 próbálkozás után sem talált helyet (pl. túl sok pocsolya/zombi van), lerakja a nullapontra
    return { x: x || 0, z: z || 0 };
}

function spawnEnemy(x, z, isBoss = false) {
    if (!zombieModel || !fastZombieModel || !hiderZombieModel) return;
    
    let type = 'normal';
    let rand = Math.random();
    if (isBoss) type = 'boss';
    else if (rand < 0.15) type = 'runner';
    else if (rand < 0.25) type = 'tank';
    else if (rand < 0.35) type = 'hider';
    else if (rand < 0.40 && crawlerModel) type = 'crawler';

    let baseModel = zombieModel;
    let anims = zombieAnimations;
    
    // Itt osztjuk ki, hogy melyik típushoz melyik 3D modellt használja a játék
    if (type === 'runner') {
        baseModel = fastZombieModel; anims = fastZombieAnimations;
    } else if (type === 'hider') {
        baseModel = hiderZombieModel; anims = hiderZombieAnimations;
    } else if (type === 'crawler') {
        baseModel = crawlerModel; anims = crawlerAnimations;
    } else if (type === 'boss') {
        baseModel = bossModel; anims = bossAnimations;
    } else if (type === 'tank') {
        baseModel = tankModel; anims = tankAnimations;
    }

    // Biztonsági ellenőrzés: ha még nem töltött be az adott modell a netről, használja az alap zombit
    if (!baseModel) {
        baseModel = zombieModel;
        anims = zombieAnimations;
    }

    const mesh = THREE.SkeletonUtils.clone(baseModel);

    
    
    // 2. Statisztikák és Méret (Scale) Alapértékek
    let scale = 1.5, hpMult = 1, speedMult = 1, opacity = 1, reward = 20, hitboxScale = 1.0;
    
    // 3. Értékek felülírása a zombi típusa szerint (MÉRET, HP, SEBESSÉG, PÉNZ)
    if (type === 'runner') { 
        scale = 2.0; hpMult = 0.5; speedMult = 2.5; reward = 30; hitboxScale = 0.8; 
    } 
    else if (type === 'tank') { 
        scale = 1.5; hpMult = 4.0; speedMult = 0.6; reward = 100; hitboxScale = 1.8; 
    } 
    else if (type === 'boss') { 
        // A Boss modell alapból kicsi lehet, ezért felvisszük 4.0-ra (vagy nagyobbra)
        scale = 4.0; hpMult = 15.0; speedMult = 0.5; reward = 500; hitboxScale = 2.5; 
    } 
    else if (type === 'hider') { 
        scale = 0.02; hpMult = 0.8; speedMult = 1.3; opacity = 0.2; reward = 40; hitboxScale = 0.8; 
    }
    else if (type === 'crawler') { 
        scale = 0.005; hpMult = 0.1; speedMult = 4.0; reward = 500; hitboxScale = 2.0; 
    }

    // 4. Alkalmazzuk a méretet a 3D modellre!
    mesh.scale.set(scale, scale, scale); 
    mesh.position.set(x, 0, z);
    
    mesh.traverse((child) => {
        if (child.isMesh) {
            child.frustumCulled = false;
            
            // Biztonsági klónozás
            if (opacity < 1.0 || type === 'runner') {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(m => m.clone());
                } else {
                    child.material = child.material.clone();
                }
            }

            // Hider zombi átlátszósága
            if (opacity < 1.0) {
                let mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(m => {
                    m.transparent = true;
                    m.opacity = opacity;
                });
            }

// --- ÚJ: RUNNER ZOMBI VÉGLEGES TEXTÚRÁZÁSA ---
            if (type === 'runner') {
                let mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(m => {
                    // 1. Alapszín: Még sötétebb szürke
                    if (m.color) m.color.setHex(0x222222);
                    
                    // 2. Sugárzás (Emissive)
                    if (m.emissive !== undefined) {
                        // Nem tiszta neont használunk, hanem egy sötétebb méregzöldet, hogy ne égjen ki!
                        m.emissive.setHex(0x005500); 
                        
                        // Az eredeti textúrát használjuk maszkként
                        if (typeof puddleTex !== 'undefined') {
                            m.emissiveMap = puddleTex;
                        }
                        
                        // ITT A LÉNYEG: 2.5 helyett levisszük 0.3-ra! Így csak nagyon halványan, foltokban fog derengeni.
                        m.emissiveIntensity = 0.3; 
                    }
                    
                    // 3. Mattabb felület, hogy a szürke rész domináljon, ne csillogjon
                    if (m.roughness !== undefined) m.roughness = 0.8;
                    if (m.metalness !== undefined) m.metalness = 0.1;
                });
            }
        }
    });
    
    // ÚJ: Hitbox matematika
    // Ezzel az osztással visszaszámoljuk a 3D modell torzítását, így a hitbox fix méretű marad.
    const inv = hitboxScale / scale;
    
const bodyHitbox = new THREE.Mesh(globalBodyGeo, globalHitboxMat); 
    bodyHitbox.scale.set(inv, inv, inv);
    bodyHitbox.position.y = 0.7 * inv; 
    bodyHitbox.userData = { type: 'body' };
    
    const headHitbox = new THREE.Mesh(globalHeadGeo, globalHitboxMat);
    headHitbox.scale.set(inv, inv, inv);
    headHitbox.position.y = 1.7 * inv; 
    headHitbox.userData = { type: 'head' };

    mesh.add(bodyHitbox); 
    mesh.add(headHitbox); 
    scene.add(mesh); 
    enemyHitboxes.push(bodyHitbox, headHitbox); 
    
const mixer = new THREE.AnimationMixer(mesh);
    
    let runAction = null;
    let attackAction = null;

    if (anims && anims.length > 0) {
        if (type === 'runner') {
            let runClip = anims.length > 9 ? anims[9] : anims[0];
            let attackClip = anims.length > 2 ? anims[2] : anims[0];
            runAction = mixer.clipAction(runClip); attackAction = mixer.clipAction(attackClip);
            runAction.setLoop(THREE.LoopRepeat); attackAction.setLoop(THREE.LoopRepeat);
        } else if (type === 'crawler') {
            let runClip = anims.length > 1 ? anims[1] : anims[0];
            runAction = mixer.clipAction(runClip); runAction.setLoop(THREE.LoopRepeat);
        } else if (type === 'boss') {
            // ÚJ: Boss animációi (Séta: index 1, Támadás: index 0)
            let runClip = anims.length > 1 ? anims[1] : anims[0];
            let attackClip = anims.length > 0 ? anims[0] : anims[0];
            runAction = mixer.clipAction(runClip); attackAction = mixer.clipAction(attackClip);
            runAction.setLoop(THREE.LoopRepeat); attackAction.setLoop(THREE.LoopRepeat);
        } else if (type === 'tank') {
            // ÚJ TANK MODELL ANIMÁCIÓI
            // Séta: 22. animáció -> Index 21
            // Támadás: 1. animáció -> Index 0
            let runClip = anims.length > 21 ? anims[21] : anims[0];
            let attackClip = anims.length > 0 ? anims[0] : anims[0];
            
            runAction = mixer.clipAction(runClip); 
            attackAction = mixer.clipAction(attackClip);
            
            runAction.setLoop(THREE.LoopRepeat); 
            attackAction.setLoop(THREE.LoopRepeat);
        } else {
            let walkClip = anims.find(a => a.name.toLowerCase().includes('walk')) || anims[0];
            if (type === 'hider') walkClip = anims.find(a => a.name.toLowerCase().includes('fight') || a.name.toLowerCase().includes('idle')) || anims[0];
            runAction = mixer.clipAction(walkClip); runAction.setLoop(THREE.LoopRepeat);
        }
    }

    if (runAction) runAction.play();
    
    const radarContainer = document.getElementById('radar');
    const blip = document.createElement('div'); 
    blip.className = 'radar-blip'; 
    if (radarContainer) radarContainer.appendChild(blip);
    
    const baseStats = difficultySettings[currentDifficulty];
    enemies.push({ 
        type: type,
        mesh, bodyHitbox, headHitbox, 
        health: baseStats.health * hpMult, 
        speed: baseStats.speed * speedMult,
        damageMult: type === 'boss' ? 3 : type === 'tank' ? 2 : 1,
        reward: reward, 
        mixer, blip,
        runAction: runAction,
        attackAction: attackAction,
        currentAction: runAction,
        // ÚJ: A Crawlernek van 12 másodperce, a többieknek végtelen élete (Infinity)
        lifeTime: (type === 'crawler') ? 12.0 : Infinity 
    });
}

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
