var gameState = 'MENU';
var highScore = 0;

var playerHealth = 100;
var playerArmor = 0; 
var score = 0; 
var currentWave = 1;
var isWaveActive = false;
var enemiesToSpawn = 5;
var isReloading = false;
var bloodOpacity = 0;
var cameraShake = 0; 
var waveStartTime = 0;
var lastWaveBonus = 0;
// ÚJ: Sorozatlövő beállítások (auto és fireRate)
var isShootingBtnPressed = false;
var autoShootTimer = 0;

var weapons = {
    pistol: { name: 'Pisztoly', damage: 1, ammo: 10, reserve: 30, maxAmmo: 10, maxReserve: 30, pellets: 1, spread: 0, reloadTime: 1500, owned: true, auto: false, fireRate: 0 },
    shotgun: { name: 'Sörétes', damage: 1.2, ammo: 0, reserve: 0, maxAmmo: 6, maxReserve: 24, pellets: 6, spread: 0.15, reloadTime: 2000, owned: false, auto: false, fireRate: 0 },
    rifle: { name: 'Gépkarabély', damage: 0.8, ammo: 0, reserve: 0, maxAmmo: 30, maxReserve: 90, pellets: 1, spread: 0.05, reloadTime: 1800, owned: false, auto: true, fireRate: 0.12 }, // 0.12 mp / lövés
    super: { name: 'Szuper fegyver', damage: 15, ammo: 0, reserve: 0, maxAmmo: 5, maxReserve: 15, pellets: 1, spread: 0, reloadTime: 2500, owned: false, auto: false, fireRate: 0 }
};
var currentWeaponId = 'pistol';

var currentDifficulty = 'medium';
var difficultySettings = {
    easy: { speed: 0.02, health: 2, damage: 0.2 },
    medium: { speed: 0.04, health: 3, damage: 0.4 },
    hard: { speed: 0.06, health: 4, damage: 0.8 }
};

var baseCamY = 1.6;
var velocityY = 0;
var gravity = 0.02;
var canJump = true;
var recoilPitch = 0;
var bobTime = 0;
var playerRadius = 0.5; 
var enemyRadius = 0.8; 
var damageCooldown = 0;

var moveX = 0, moveZ = 0, pitch = 0, yaw = 0;
var radarAngle = 0;

var enemies = [];
var enemyHitboxes = [];
var wallHitboxes = [];
var medkits = [];
var ammoBoxes = [];
var particles = [];
var radParticles = []; 
var bloodStains = []; 

var scene, camera, renderer, clock, listener, muzzleFlash, playerLight;
var gunMixer, gunShootAction;
var zombieModel, zombieAnimations, ammoModel, healthModel;
var fastZombieModel, fastZombieAnimations;
var hiderZombieModel, hiderZombieAnimations;