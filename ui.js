const healthFill = document.getElementById('health-fill');
const armorFill = document.getElementById('armor-fill');
const scoreDisplay = document.getElementById('score-display');
const ammoDisplay = document.getElementById('ammo-display');
const weaponInfoDisplay = document.getElementById('weapon-info-display');
const hitmarker = document.getElementById('hitmarker');
const hsMsg = document.getElementById('headshot-msg');
const shopMenu = document.getElementById('shop-menu');
const shopPoints = document.getElementById('shop-points');

// --- BOLT LOGIKA ---
window.openShop = function() {
    gameState = 'SHOPPING'; // Játék szüneteltetése!
    shopMenu.classList.remove('hidden');
	
	let bonusText = lastWaveBonus > 0 ? ` (+${lastWaveBonus} Bónusz!)` : '';
    shopPoints.innerText = score + bonusText;
	
	
    document.getElementById('buy-shotgun').disabled = weapons.shotgun.owned;
    document.getElementById('buy-rifle').disabled = weapons.rifle.owned;
    document.getElementById('buy-super').disabled = weapons.super.owned;
}

document.getElementById('close-shop-btn').addEventListener('click', () => {
    shopMenu.classList.add('hidden');
    gameState = 'PLAYING'; // Játék folytatása
    if (typeof startWaveCountdown === 'function') startWaveCountdown(); // CSAK MOST indul a 10 másodperc!
});

function buyItem(cost, action) {
    if (score >= cost) {
        score -= cost;
        action();
        shopPoints.innerText = score;
        if(typeof updateUI === 'function') updateUI();
    } else {
        alert("Nincs elég pénzed!");
    }
}

document.getElementById('buy-health').addEventListener('click', () => buyItem(100, () => playerHealth = 100));
document.getElementById('buy-armor').addEventListener('click', () => buyItem(200, () => playerArmor = Math.min(100, playerArmor + 50)));
document.getElementById('buy-ammo').addEventListener('click', () => buyItem(50, () => {
    let w = weapons[currentWeaponId];
    w.reserve = Math.min(w.reserve + w.maxAmmo * 2, w.maxReserve);
}));
document.getElementById('buy-shotgun').addEventListener('click', () => buyItem(500, () => { weapons.shotgun.owned = true; weapons.shotgun.reserve = weapons.shotgun.maxReserve; document.getElementById('buy-shotgun').disabled = true; }));
document.getElementById('buy-rifle').addEventListener('click', () => buyItem(1000, () => { weapons.rifle.owned = true; weapons.rifle.reserve = weapons.rifle.maxReserve; document.getElementById('buy-rifle').disabled = true; }));
document.getElementById('buy-super').addEventListener('click', () => buyItem(5000, () => { weapons.super.owned = true; weapons.super.reserve = weapons.super.maxReserve; document.getElementById('buy-super').disabled = true; }));

window.updateUI = function() {
    if(healthFill) healthFill.style.width = Math.max(0, playerHealth) + '%';
    if(healthFill) healthFill.style.backgroundColor = playerHealth > 60 ? '#00ff00' : playerHealth > 30 ? '#ffaa00' : '#ff0000';
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
    currentDifficulty = document.getElementById('difficulty-select').value;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui-wrapper').classList.remove('hidden');
    if(typeof unlockAudio === 'function') unlockAudio();
    if(typeof startGame === 'function') startGame();
});

document.getElementById('restart-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-ui-wrapper').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    gameState = 'MENU';
});