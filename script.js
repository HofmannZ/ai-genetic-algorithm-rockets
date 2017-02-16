const root = document.querySelector('.root');


/**
*   Rocket
*/
class Rocket {
  constructor(x, y, angle, speed = 8) {
    this.x = x + 4;
    this.y = y;

    this.width = 8;
    this.height = 24;

    this.angle = angle;
    this.speed = speed;

    this.element = document.createElement('div');
    this.element.classList.add('rocket');

    root.appendChild(this.element);
  }

  propel() {
    this.x += this.speed * Math.sin(this.angle * (Math.PI / 180));
    this.y += this.speed * Math.cos(this.angle * (Math.PI / 180));
  }

  render() {
    this.element.style.left = `${this.x.toString()}px`;
    this.element.style.bottom = `${this.y.toString()}px`;
    this.element.style.transform = `rotate(${this.angle}deg)`;
  }
}


/**
*   Mission control
*/
const rockets = [];
const numberOfRockets = 50;
const cycleLimit = 32;

let started = false;
let cycle = 0;
let x = window.innerWidth / 2;
let y = 0;

function constructRockets() {
  let i;

  for (i = 0; i < numberOfRockets; i++) {
    rockets[i] = new Rocket(x, y, Math.round(Math.random() * 360));
    rockets[i].render();
  }
}

function findMars() {
  let i;

  if (cycle === cycleLimit) {
    // Clear the DOM.
    cycle = 0;
    root.innerHTML = '';

    // Try with new DNA.
    constructRockets();
    findMars();
  } else {
    // Propel the rockets.
    for (i = 0; i < numberOfRockets; i++) {
      // TODO: Set this in the DNA of the rocket.
      rockets[i].angle = Math.round(Math.random() * 360);

      rockets[i].propel();
      rockets[i].render();
    }

    cycle++;
    setTimeout(findMars, 256);
  }
};

// Display initial rockets.
constructRockets();

// Launch rockets on click event.
window.addEventListener('click', () => {
  // Only launch if not launched before.
  if (!started) {
    started = true;
    findMars();
  }
});
