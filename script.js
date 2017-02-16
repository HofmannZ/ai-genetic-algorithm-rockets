const root = document.querySelector('.root');

/**
*   Mars
*/
class Mars {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.width = 64;
    this.height = 64;
  }

  render() {
    const element = document.createElement('div');
    element.classList.add('mars');

    root.appendChild(element);

    element.style.width = `${this.width.toString()}px`;
    element.style.height = `${this.height.toString()}px`;

    element.style.left = `${this.x.toString()}px`;
    element.style.bottom = `${this.y.toString()}px`;
  }
}


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
  }

  propel() {
    this.x += this.speed * Math.sin(this.angle * (Math.PI / 180));
    this.y += this.speed * Math.cos(this.angle * (Math.PI / 180));

    this.element.style.left = `${this.x.toString()}px`;
    this.element.style.bottom = `${this.y.toString()}px`;

    this.element.style.transform = `rotate(${this.angle}deg)`;
  }

  render() {
    this.element.style.width = `${this.width.toString()}px`;
    this.element.style.height = `${this.height.toString()}px`;

    this.element.style.left = `${this.x.toString()}px`;
    this.element.style.bottom = `${this.y.toString()}px`;

    root.appendChild(this.element);
  }
}


/**
*   Mission control
*/
const rockets = [];
const numberOfRockets = 16;
const cycleLimit = 32;
const mars = new Mars(window.innerWidth / 2, window.innerHeight - 64);

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
    mars.render();
    constructRockets();
    findMars();
  } else {
    // Propel the rockets.
    for (i = 0; i < numberOfRockets; i++) {
      // TODO: Set this in the DNA of the rocket.
      rockets[i].angle = Math.round(Math.random() * 360);

      rockets[i].propel();
    }

    cycle++;
    setTimeout(findMars, 256);
  }
};

// Display initial rockets and mars.
mars.render();
constructRockets();

// Launch rockets on click event.
window.addEventListener('click', () => {
  // Only launch if not launched before.
  if (!started) {
    started = true;
    findMars();
  }
});
