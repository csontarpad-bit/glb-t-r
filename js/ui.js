const healthFill = document.getElementById('health-fill');
const armorFill = document.getElementById('armor-fill');
const scoreDisplay = document.getElementById('score-display');
const ammoDisplay = document.getElementById('ammo-display');
const weaponInfoDisplay = document.getElementById('weapon-info-display');
const hitmarker = document.getElementById('hitmarker');
const hsMsg = document.getElementById('headshot-msg');
const shopMenu = document.getElementById('shop-menu');
const shopPoints = document.getElementById('shop-points');


// --- ÚJ: BOLT FÜLEK LOGIKÁJA (Védett verzió) ---
const tabWeaponsBtn = document.getElementById('tab-weapons');
const tabSkillsBtn = document.getElementById('tab-skills');
const shopWeaponsDiv = document.getElementById('shop-weapons');
const shopSkillsDiv = document.getElementById('shop-skills');

if (tabWeaponsBtn && tabSkillsBtn) {
    tabWeaponsBtn.addEventListener('click', () => {
        tabWeaponsBtn.classList.add('active');
        tabSkillsBtn.classList.remove('active');
        shopWeaponsDiv.classList.remove('hidden');
        shopSkillsDiv.classList.add('hidden');
    });

    tabSkillsBtn.addEventListener('click', () => {
        tabSkillsBtn.classList.add('active');
        tabWeaponsBtn.classList.remove('active');
        shopSkillsDiv.classList.remove('hidden');
        shopWeaponsDiv.classList.add('hidden');
    });
}

// --- BOLT MEGNYITÁSA ---
window.openShop = function() {
    gameState = 'SHOPPING'; // Játék szüneteltetése!
    shopMenu.classList.remove('hidden');
	
	let bonusText = lastWaveBonus > 0 ? ` (+${lastWaveBonus} Bónusz!)` : '';
    shopPoints.innerText = score + bonusText;
	
    if(typeof updateShopButtons === 'function') updateShopButtons();
}

document.getElementById('close-shop-btn').addEventListener('click', () => {
    shopMenu.classList.add('hidden');
    gameState = 'PLAYING'; 
    
    // CSAK PC-n kérjük el az egeret, mobilon ez hibát dobna!
    if (window.innerWidth > 768) {
        try { document.body.requestPointerLock(); } catch(e){}
    }
    
    // ITT CSAK A VISSZASZÁMLÁLÓT INDÍTJUK EL! 
    // Az öregedés már a visszaszámláló BELSŐ logikájában fog lefutni!
    if (typeof startWaveCountdown === 'function') startWaveCountdown(); 
});

// --- VIZUÁLIS VISSZAJELZÉS ---
function flashMoneyError() {
    shopPoints.style.color = '#ff0000';
    setTimeout(() => shopPoints.style.color = '#ffcc00', 300);
}

// --- FEGYVER FEJLESZTÉS LOGIKA ---
function upgradeWeapon(wpnId, basePrice) {
    let w = weapons[wpnId];
    let cost = w.owned ? basePrice * w.level : basePrice;
    
    if (w.level >= 5 || score < cost) { flashMoneyError(); return; }
    
    score -= cost;
    if (!w.owned) {
        w.owned = true;
        w.reserve = w.maxReserve;
    } else {
        w.level++;
        // Bónuszok szintenként:
        if (w.level === 2) w.maxReserve = Math.floor(w.maxReserve * 1.5);
        if (w.level === 3) w.reloadTime = Math.floor(w.reloadTime * 0.75);
        if (w.level === 4) w.maxAmmo = Math.floor(w.maxAmmo * 1.5);
        if (w.level === 5) w.damage *= 2;
    }
    updateShopButtons();
}

// --- KÉPESSÉG FEJLESZTÉS LOGIKA ---
function upgradeSkill(skillId) {
    let s = skills[skillId];
    let cost = s.baseCost * (s.level + 1);
    
    if (s.level >= s.maxLevel || score < cost) { flashMoneyError(); return; }
    
    score -= cost;
    s.level++;
    
    // Ha életet fejlesztünk, azonnal gyógyuljunk is a maximumra
    if (skillId === 'maxHealth') playerHealth = 100 + (skills.maxHealth.level * 20);
    // Ha fagyasztást veszünk, jelenjen meg a gomb
    if (skillId === 'freeze' && s.level === 1) document.getElementById('freeze-btn').classList.remove('hidden');

    updateShopButtons();
}

// --- GOMBOK FRISSÍTÉSE (Menő Sci-Fi Kiosztás) ---
window.updateShopButtons = function() {
    let bonusText = lastWaveBonus > 0 ? ` (+${lastWaveBonus} Bónusz!)` : '';
    shopPoints.innerText = score + bonusText;
    if(typeof updateUI === 'function') updateUI();

    // Segédfüggvény a szép HTML struktúra generálásához
    function getBtnHTML(name, stat, price) {
        return `<div class="item-name">${name}</div><div class="item-stat">${stat}</div><div class="item-price">${price}</div>`;
    }

    // Lőszer gomb
    const ammoBtn = document.getElementById('buy-ammo');
    ammoBtn.innerHTML = getBtnHTML("TÁRAK FELTÖLTÉSE", "Aktuális fegyver max lőszer", "ÁR: 50 CR");
    ammoBtn.onclick = () => {
        if (score >= 50) { score -= 50; let w = weapons[currentWeaponId]; w.reserve = w.maxReserve; updateShopButtons(); } 
        else flashMoneyError();
    };

    // Fegyverek
    const wBtns = { shotgun: 'buy-shotgun', rifle: 'buy-rifle', super: 'buy-super' };
    for (let id in wBtns) {
        let btn = document.getElementById(wBtns[id]);
        let w = weapons[id];
        let base = id === 'shotgun' ? 500 : id === 'rifle' ? 1000 : 5000;
        
        if (!w.owned) { 
            btn.innerHTML = getBtnHTML(w.name, "Állapot: Zárolva", `VÉTEL: ${base} CR`); 
        } else if (w.level < 5) { 
            btn.innerHTML = getBtnHTML(w.name, `Szint: ${w.level} ➔ ${w.level+1}`, `FEJLESZTÉS: ${base * w.level} CR`); 
        } else { 
            btn.innerHTML = getBtnHTML(w.name, "Állapot: MAX SZINT", "---"); 
            btn.disabled = true; 
        }
        btn.onclick = () => upgradeWeapon(id, base);
    }
    
    // Alap pisztoly
    let pBtn = document.getElementById('buy-pistol');
    if (weapons.pistol.level < 5) { 
        pBtn.innerHTML = getBtnHTML("Pisztoly", `Szint: ${weapons.pistol.level} ➔ ${weapons.pistol.level+1}`, `FEJLESZTÉS: ${200 * weapons.pistol.level} CR`); 
        pBtn.onclick = () => upgradeWeapon('pistol', 200); 
    } else { 
        pBtn.innerHTML = getBtnHTML("Pisztoly", "Állapot: MAX SZINT", "---"); 
        pBtn.disabled = true; 
    }

    // Képességek (Külön megnevezések a szebb megjelenésért)
    const skillNames = { revive: "Újraélesztő Szérum", maxHealth: "Kevlár Implantátum", speed: "Kibernetikus Láb", ammoLoot: "Kibővített Zsebek", healthLoot: "Gyógyító Nanobotok", freeze: "Krio-Gránát (F)" };
    const sBtns = { revive: 'skill-revive', maxHealth: 'skill-health', speed: 'skill-speed', ammoLoot: 'skill-ammoLoot', healthLoot: 'skill-healthLoot', freeze: 'skill-freeze' };
    
    for (let id in sBtns) {
        let btn = document.getElementById(sBtns[id]);
        let s = skills[id];
        let displayName = skillNames[id];
        
        if (s.level < s.maxLevel) { 
            btn.innerHTML = getBtnHTML(displayName, `Fejlettség: ${s.level} / ${s.maxLevel}`, `ÁR: ${s.baseCost * (s.level + 1)} CR`); 
        } else { 
            btn.innerHTML = getBtnHTML(displayName, "Állapot: MAX SZINT", "---"); 
            btn.disabled = true; 
        }
btn.onclick = () => upgradeSkill(id);
    }

    // ÚJ: Takarító (Sterilizáló) gomb logikája
    const puddleCountDisplay = document.getElementById('puddle-count');
    if (puddleCountDisplay) puddleCountDisplay.innerText = toxicPuddles.length;

    const cleanBtn = document.getElementById('buy-clean');
    if (cleanBtn) {
        let amountToClean = Math.min(10, toxicPuddles.length); // Max 10, vagy ami maradt
        let cost = amountToClean * 10; // 10 CR / pocsolya
        
        if (toxicPuddles.length === 0) {
            cleanBtn.innerHTML = getBtnHTML("STERILIZÁLÁS", "A pálya tiszta.", "ÁR: 0 CR");
            cleanBtn.disabled = true;
        } else {
            cleanBtn.innerHTML = getBtnHTML("STERILIZÁLÁS (10 db)", `Célpontok: ${amountToClean} toxikus góc`, `ÁR: ${cost} CR`);
            cleanBtn.disabled = (score < cost);
        }
        
        cleanBtn.onclick = () => {
            if (toxicPuddles.length > 0 && score >= cost) {
                score -= cost;
                for (let i = 0; i < amountToClean; i++) {
                    let oldestPuddle = toxicPuddles.shift(); // Legrégebbi kivétele
                    scene.remove(oldestPuddle);
                    oldestPuddle.geometry.dispose(); // MEMÓRIA FELSZABADÍTÁS!
                }
                updateToxicFog();
                if (typeof playSound === 'function') playSound('heal');
                updateShopButtons(); 
            } else {
                flashMoneyError();
            }
        };
    }
}

// Alap UI frissítés (Lőszer, HP sáv a játékban)
window.updateUI = function() {
    let maxHP = 100 + (skills.maxHealth.level * 20);
    if(healthFill) healthFill.style.width = Math.max(0, (playerHealth / maxHP) * 100) + '%';
    if(healthFill) healthFill.style.backgroundColor = (playerHealth / maxHP) > 0.6 ? '#00ff00' : (playerHealth / maxHP) > 0.3 ? '#ffaa00' : '#ff0000';
    if(armorFill) armorFill.style.width = Math.max(0, playerArmor) + '%';
    if(scoreDisplay) scoreDisplay.innerText = `PÉNZ: ${score}`;
    
    let w = weapons[currentWeaponId];
    if(ammoDisplay) ammoDisplay.innerText = `[ ${w.ammo} / ${w.reserve} ]`;
    if(weaponInfoDisplay) weaponInfoDisplay.innerText = w.name;
}


window.showHitmarker = function(isHeadshot) {
    hitmarker.classList.remove('hidden');
    setTimeout(() => hitmarker.classList.add('hidden'), 100);
    if (isHeadshot) { hsMsg.classList.remove('hidden'); hsMsg.classList.remove('headshot-anim'); void hsMsg.offsetWidth; hsMsg.classList.add('headshot-anim'); }
}

document.getElementById('switch-weapon-btn').addEventListener('touchstart', handleWeaponSwitch);
document.getElementById('switch-weapon-btn').addEventListener('click', handleWeaponSwitch);

function handleWeaponSwitch(e) {
    if(e) e.preventDefault();
    const keys = Object.keys(weapons);
    let currIdx = keys.indexOf(currentWeaponId);
    let nextIdx = currIdx;
    do {
        nextIdx = (nextIdx + 1) % keys.length;
    } while (!weapons[keys[nextIdx]].owned && nextIdx !== currIdx);
    
    currentWeaponId = keys[nextIdx];
    isReloading = false;
    document.getElementById('reload-text').classList.add('hidden');
    updateUI();
}

document.getElementById('start-game-btn').addEventListener('click', (e) => {
    e.preventDefault();
    
    // Teljes képernyő és Egér bezárás (Biztonságosan, hogy ne omoljon össze a kód)
    let elem = document.documentElement;
    try {
        if (elem.requestFullscreen) elem.requestFullscreen().catch(err => console.log("Fullscreen hiba:", err));
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        
        // Csak akkor zárjuk be az egeret, ha nem mobilon vagyunk
        if (window.innerWidth > 768) {
            document.body.requestPointerLock();
        }
    } catch (err) {
        console.warn("Pointer lock figyelmeztetés:", err);
    }
    // --- ÚJ: FADE ÁTMENET ÉS ELALVÁS ---
    const fadeOverlay = document.getElementById('fade-overlay');
    if (fadeOverlay) fadeOverlay.style.opacity = '1';

    // Menü zene leállítása, hogy a sötétségben csend legyen
    if (typeof sounds !== 'undefined' && sounds['menuMusic'] && sounds['menuMusic'].isPlaying) {
        sounds['menuMusic'].stop();
    }
    
    // Várunk 1.5 másodpercet amíg a képernyő teljesen fekete lesz
    setTimeout(() => {
        // UI és Állapot Frissítés (Már a sötétség alatt történik)
        currentDifficulty = document.getElementById('difficulty-select').value;
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui-wrapper').classList.remove('hidden');
        
        yaw = 0; pitch = 0; moveX = 0; moveZ = 0;
        if (camera) camera.position.set(0, 1.6, 0);

        if(typeof unlockAudio === 'function') unlockAudio();
        if(typeof startGame === 'function') startGame();

        // Kivilágosodás ("Ébredés")
        setTimeout(() => {
            if (fadeOverlay) fadeOverlay.style.opacity = '0';
        }, 500); // Fél másodpercet töltünk a teljes sötétben, mielőtt kinyitnánk a szemünk
        
    }, 1500);
});

document.getElementById('restart-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-ui-wrapper').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    gameState = 'MENU';
});

// --- ÚJ: PAJZS IKON MEGJELENÍTÉSE ---
window.showShieldIcon = function(shieldType) {
    const shieldIcon = document.getElementById('shield-icon');
    if (!shieldIcon) return;

    shieldIcon.classList.remove('hidden');
    
    // Színezés a pocsolya állapota alapján
    if (shieldType === 'ready') shieldIcon.style.filter = 'hue-rotate(150deg) saturate(300%) brightness(150%)'; // Pirosas
    else if (shieldType === 'yellow') shieldIcon.style.filter = 'hue-rotate(220deg) saturate(300%)'; // Sárgás
    else shieldIcon.style.filter = 'hue-rotate(0deg) saturate(200%)'; // Alap (Zöldes)

    // Újraindítjuk az animációt
    shieldIcon.classList.remove('shield-anim'); 
    void shieldIcon.offsetWidth; 
    shieldIcon.classList.add('shield-anim');
}
