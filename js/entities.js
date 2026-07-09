function getSafeSpawnPosition(radius, minDist = 0) {
    let x, z; let isSafe = false; let attempts = 0;
    while (!isSafe && attempts < 50) {
        x = (Math.random() - 0.5) * (46); z = (Math.random() - 0.5) * (46);
        if (Math.hypot(camera.position.x - x, camera.position.z - z) >= minDist) {
            if(typeof checkWallCollision === 'function' && !checkWallCollision(x, z, radius)) isSafe = true; 
            else if (typeof checkWallCollision !== 'function') isSafe = true;
        }
        attempts++;
    }
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

    let baseModel = zombieModel;
    let anims = zombieAnimations;
    
    if (type === 'runner') {
        baseModel = fastZombieModel;
        anims = fastZombieAnimations;
    } else if (type === 'hider') {
        baseModel = hiderZombieModel;
        anims = hiderZombieAnimations;
    }

    const mesh = THREE.SkeletonUtils.clone(baseModel);
    
    // ÚJ: hitboxScale - A találati zóna logikai mérete a játéktérben
    let scale = 1.5, hpMult = 1, speedMult = 1, opacity = 1, reward = 20, hitboxScale = 1.0;
    if (type === 'runner') { scale = 1.0; hpMult = 0.5; speedMult = 2.5; reward = 30; hitboxScale = 0.8; } 
    else if (type === 'tank') { scale = 2.5; hpMult = 4.0; speedMult = 0.6; reward = 100; hitboxScale = 1.8; } 
    else if (type === 'boss') { scale = 4.0; hpMult = 15.0; speedMult = 0.5; reward = 500; hitboxScale = 2.5; } 
    else if (type === 'hider') { scale = 0.02; hpMult = 0.8; speedMult = 1.3; opacity = 0.2; reward = 40; hitboxScale = 0.8; } 

    mesh.scale.set(scale, scale, scale); 
    mesh.position.set(x, 0, z); 
    
    mesh.traverse((child) => {
        if (child.isMesh) {
            child.frustumCulled = false;
            if (opacity < 1.0) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = opacity;
            }
        }
    });
    
    // ÚJ: Hitbox matematika
    // Ezzel az osztással visszaszámoljuk a 3D modell torzítását, így a hitbox fix méretű marad.
    const inv = hitboxScale / scale;
    
    // A test (body) és fej (head) dobozok pontos elhelyezése
    const bodyHitbox = new THREE.Mesh(new THREE.BoxGeometry(1.0 * inv, 1.4 * inv, 1.0 * inv), new THREE.MeshBasicMaterial({ visible: false })); 
    bodyHitbox.position.y = 0.7 * inv; 
    bodyHitbox.userData = { type: 'body' };
    
    const headHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.6 * inv, 0.6 * inv, 0.6 * inv), new THREE.MeshBasicMaterial({ visible: false }));
    headHitbox.position.y = 1.7 * inv; 
    headHitbox.userData = { type: 'head' }; 

    mesh.add(bodyHitbox); 
    mesh.add(headHitbox); 
    scene.add(mesh); 
    enemyHitboxes.push(bodyHitbox, headHitbox); 
    
    const mixer = new THREE.AnimationMixer(mesh);
    
    let walkClip = null;
    if (anims && anims.length > 0) {
        if (type === 'runner') {
            walkClip = anims.find(a => a.name.toLowerCase().includes('run')) || anims[0];
        } else if (type === 'hider') {
            walkClip = anims.find(a => a.name.toLowerCase().includes('fight') || a.name.toLowerCase().includes('idle')) || anims[0];
        } else {
            walkClip = anims.find(a => a.name.toLowerCase().includes('walk')) || anims[0];
        }
    }

    if (walkClip) { 
        const action = mixer.clipAction(walkClip); 
        action.setLoop(THREE.LoopRepeat); 
        action.play(); 
    }
    
    const radarContainer = document.getElementById('radar');
    const blip = document.createElement('div'); 
    blip.className = 'radar-blip'; 
    if (radarContainer) radarContainer.appendChild(blip);
    
    const baseStats = difficultySettings[currentDifficulty];
    enemies.push({ 
        mesh, bodyHitbox, headHitbox, 
        health: baseStats.health * hpMult, 
        speed: baseStats.speed * speedMult,
        damageMult: type === 'boss' ? 3 : type === 'tank' ? 2 : 1,
        reward: reward, 
        mixer, blip 
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
