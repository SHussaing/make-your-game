const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;
const KEY_PAUSE = 80;

const GAME_WIDTH = 1920;
const GAME_HEIGHT = 720;

const STATE = {
  x_pos : 0,
  y_pos : 0,
  move_right: false,
  move_left: false,
  shoot: false,
  lasers: [],
  enemyLasers: [],
  enemies : [],
  spaceship_width: 50,
  enemy_width: 50,
  cooldown : 0,
  number_of_enemies: 44, 
  enemy_cooldown : 0,
  player_lives: 3,
  pause: false,
  player_deleted: false,
  score: 0,
  time_alive: Date.now(),
  total_pause_time: 0, //Tracks total paused time
  pause_start: null,     //Tracks the start time of the pause
}

// General purpose functions
function setPosition($element, x, y) {
  $element.style.transform = `translate(${x}px, ${y}px)`;
}

function setSize($element, width) {
  $element.style.width = `${width}px`;
  $element.style.height = "auto";
}

function bound(x){
  if (x >= GAME_WIDTH-STATE.spaceship_width){
    STATE.x_pos = GAME_WIDTH-STATE.spaceship_width;
    return GAME_WIDTH-STATE.spaceship_width
  } if (x <= 0){
    STATE.x_pos = 0;
    return 0
  } else {
    return x;
  }
}

function collideRect(rect1, rect2){
  return!(rect2.left > rect1.right || 
    rect2.right < rect1.left || 
    rect2.top > rect1.bottom || 
    rect2.bottom < rect1.top);
}

// Enemy 
function createEnemy($container, x, y){
  const $enemy = document.createElement("img");
  $enemy.src = "img/ufo.png";
  $enemy.className = "enemy";
  $container.appendChild($enemy);
  const enemy_cooldown = Math.floor(Math.random()*100);
  const enemy = {x, y, $enemy, enemy_cooldown}
  STATE.enemies.push(enemy);
  setSize($enemy, STATE.enemy_width);
  setPosition($enemy, x, y)
}

function updateEnemies($container) {
  // Calculate the adjusted time considering the paused duration
  let adjustedTime = Date.now() - STATE.total_pause_time;
  
  // Calculate dx and dy based on adjusted time
  const dx = Math.sin(adjustedTime / 1000) * 40;
  const dy = Math.cos(adjustedTime / 1000) * 30;

  const enemies = STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    var a = enemy.x + dx;
    var b = enemy.y + dy;
    setPosition(enemy.$enemy, a, b);
    enemy.cooldown = Math.random(0, 100);
    if (enemy.enemy_cooldown == 0) {
      createEnemyLaser($container, a, b);
      enemy.enemy_cooldown = Math.floor(Math.random() * 50) + 100;
    }
    enemy.enemy_cooldown -= 0.5;
  }
}


// Player
function createPlayer($container) {
  STATE.x_pos = GAME_WIDTH / 2;
  STATE.y_pos = GAME_HEIGHT - 50;
  const $player = document.createElement("img");
  $player.src = "img/spaceship.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, STATE.x_pos, STATE.y_pos);
  setSize($player, STATE.spaceship_width);
}

function updatePlayer(){
  if (STATE.player_deleted) {
    return; // Exit early if the player is deleted
  }

  if(STATE.move_left){
    STATE.x_pos -= 3;
  } if(STATE.move_right){
    STATE.x_pos += 3;
  } if(STATE.shoot && STATE.cooldown == 0){
    createLaser($container, STATE.x_pos - STATE.spaceship_width/2, STATE.y_pos);
    STATE.cooldown = 30;
  }
  const $player = document.querySelector(".player");
  setPosition($player, bound(STATE.x_pos), STATE.y_pos-10);
  if(STATE.cooldown > 0){
    STATE.cooldown -= 0.5;
  }
}

function deletePlayer() {
  STATE.player_deleted = true;
}

// Player Laser
function createLaser($container, x, y){
  const $laser = document.createElement("img");
  const laserSound = new Audio("audio/laser.mp3");
  laserSound.play(); 
  $laser.src = "img/laser.png";
  $laser.className = "laser";
  $container.appendChild($laser);
  const laser = {x, y, $laser};
  STATE.lasers.push(laser);
  setPosition($laser, x, y);
}

function updateLaser($container){
  const lasers = STATE.lasers;
  const score = document.getElementById('score')
  score.textContent = STATE.score
  for(let i = 0; i < lasers.length; i++){
    const laser = lasers[i];
    laser.y -= 2;
    if (laser.y < 0){
      deleteLaser(lasers, laser, laser.$laser);
    }
    setPosition(laser.$laser, laser.x, laser.y);
    const laser_rectangle = laser.$laser.getBoundingClientRect();
    const enemies = STATE.enemies;
    for(let j = 0; j < enemies.length; j++){
      const enemy = enemies[j];
      const enemy_rectangle = enemy.$enemy.getBoundingClientRect();
      if(collideRect(enemy_rectangle, laser_rectangle)){
        deleteLaser(lasers, laser, laser.$laser);
        const index = enemies.indexOf(enemy);
        enemies.splice(index,1);
        STATE.score += 10;
        score.textContent = STATE.score
        console.log(STATE.score)

        $container.removeChild(enemy.$enemy);
      }
    }
  }
}

// Enemy Laser
function createEnemyLaser($container, x, y){
  const $enemyLaser = document.createElement("img");
  $enemyLaser.src = "img/enemyLaser.png";
  $enemyLaser.className = "enemyLaser";
  $container.appendChild($enemyLaser);
  const enemyLaser = {x, y, $enemyLaser};
  STATE.enemyLasers.push(enemyLaser);
  setPosition($enemyLaser, x, y);
}

function updateEnemyLaser($container){
  const enemyLasers = STATE.enemyLasers;
  const lives = document.getElementById('lives')
  for(let i = 0; i < enemyLasers.length; i++){
    const enemyLaser = enemyLasers[i];
    enemyLaser.y += 2;
    if (enemyLaser.y > GAME_HEIGHT-30){
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
    }
    const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
    const spaceship_rectangle = document.querySelector(".player").getBoundingClientRect();
    if(collideRect(spaceship_rectangle, enemyLaser_rectangle)){
      deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
      STATE.player_lives -= 1;
      lives.removeChild(lives.lastElementChild);
      hitSound = new Audio("audio/hit.mp3");
      hitSound.play();
    }
    setPosition(enemyLaser.$enemyLaser, enemyLaser.x + STATE.enemy_width/2, enemyLaser.y+15);
  }
}

//time counter

function upadteTime() {
  const time = document.getElementById('time');
  
  let elapsed_time = Date.now() - STATE.time_alive - STATE.total_pause_time;
  
  // Display time in seconds
  time.textContent = `${Math.floor(elapsed_time / 1000)}`;
}

// Delete Laser
function deleteLaser(lasers, laser, $laser){
  const index = lasers.indexOf(laser);
  lasers.splice(index,1);
  $container.removeChild($laser);
}

// Key Presses
function KeyPress(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = true;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = true;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = true;

    // Trigger the restart button click if the game is in a win, lose, or pause state
    if (document.querySelector('.lose').style.display === 'block' || 
        document.querySelector('.win').style.display === 'block' || 
        document.querySelector('.pause').style.display === 'block') {
      
        window.location.reload(); // Refresh the page
    }
  }
}


function KeyRelease(event) {
  if (event.keyCode === KEY_RIGHT) {
    STATE.move_right = false;
  } else if (event.keyCode === KEY_LEFT) {
    STATE.move_left = false;
  } else if (event.keyCode === KEY_SPACE) {
    STATE.shoot = false;
  } else if (event.keyCode === KEY_PAUSE) {
    STATE.pause = !STATE.pause;
    if (STATE.pause) {
      document.querySelector(".pause").style.display = "block";
      STATE.pause_start = Date.now(); // Track when the game is paused
    } else {
      document.querySelector(".pause").style.display = "none";
      STATE.total_pause_time += Date.now() - STATE.pause_start; // Add paused duration to total
      STATE.pause_start = null;
    }
  }
}

// Main Update Function
function update() {
  if (!STATE.pause) {
    updatePlayer();
    updateEnemies($container);
    updateLaser($container);
    updateEnemyLaser($container);
    if(STATE.enemies.length != 0){
      upadteTime();
    }
    
    if (STATE.player_lives === 0 && !STATE.player_deleted) {
      deletePlayer();
      document.querySelector(".lose").style.display = "block";
      const loseAudio = new Audio("audio/lose.wav");
      loseAudio.play();
    } else if (STATE.enemies.length === 0 && STATE.player_lives > 0 ) {
      document.querySelector(".win").style.display = "block";
      const winAudio = new Audio("audio/victory.mp3");
      winAudio.play();
      return;
    }
  }
  window.requestAnimationFrame(update);
}

function createEnemies($container) {
  for(var i = 0; i <= STATE.number_of_enemies/2; i++){
    createEnemy($container, i*80, 100);
  } for(var i = 0; i <= STATE.number_of_enemies/2; i++){
    createEnemy($container, i*80, 180);
  }
}

// Initialize the Game
const $container = document.querySelector(".main");
createPlayer($container);
createEnemies($container);

// Key Press Event Listener
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);
update();