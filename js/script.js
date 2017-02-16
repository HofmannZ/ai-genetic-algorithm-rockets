const root = document.querySelector('.root');

/**
*   Plannet
*/
class Planet {
  constructor(x, y, src = 'planet.svg', size = 64) {
    this.x = x;
    this.y = y;

    this.width = size;
    this.height = size;

    this.src = src;
  }

  render() {
    // Create the plannet element.
    const element = document.createElement('img');
    element.src = `assets/${this.src}`;
    element.classList.add('planet');

    // Set the correct plannet size.
    element.style.width = `${this.width.toString()}px`;
    element.style.height = `${this.height.toString()}px`;

    // Set the correct plannet position.
    element.style.left = `${this.x.toString()}px`;
    element.style.bottom = `${this.y.toString()}px`;

    // Add the plannet to the dom.
    root.appendChild(element);
  }
};


/**
*   DNA   *
*/
class DNA {
  constructor() {
    this.genes = [];
  }

  add(gene) {
    this.genes.push(gene);
  }
};


/**
*   Rocket   *
*   Echt rocket has it's own DNA containing an array of objects with two properties:
*   angle ( the new new angle of the rocket )
*   and
*   thrust ( the force of when propelled ).
*/
class Rocket {
  constructor(x, y, dna) {
    this.x = x + 4;
    this.y = y;

    this.width = 24;
    this.height = 32;

    this.dna = dna;

    // Create a DOM element for the rocket.
    this.element = document.createElement('img');
    this.element.src = 'assets/rocket.svg';
    this.element.classList.add('rocket');

    // Set the initial position of the rocket.
    this.element.style.left = `${this.x.toString()}px`;
    this.element.style.bottom = `${this.y.toString()}px`;
    this.element.style.transform = `translateX(-50%)`;

    // Set the initial size of the rocket.
    this.element.style.width = `${this.width.toString()}px`;
    this.element.style.height = `${this.height.toString()}px`;

    // Binding the context to the mothods.
    this.propel = this.propel.bind(this);
  }

  propel(cycle) {
    // Get the current gene from the dna.
    const currentGene = this.dna.genes[cycle];

    // Apply the rocket's angle.
    this.element.style.transform = `translateX(-50%) rotate(${currentGene.angle}deg)`;

    // Calculate the rigth x and y increments based on the rocket's angle and speed.
    this.x += Math.sin(Math.PI / 180 * currentGene.angle) * currentGene.thrust;
    this.y += Math.cos(Math.PI / 180 *  currentGene.angle) * currentGene.thrust;

    // Move the rocket to the new coordinate.
    this.element.style.left = `${this.x.toString()}px`;
    this.element.style.bottom = `${this.y.toString()}px`;
  }

  fitness(target, maxOffset) {
    // Calculate the fitness of the rocket on a scale of 0 to 100.
    let xOffset = target.x - this.x;
    if (xOffset < 0) {
      xOffset *= -1;
    }

    let yOffset = target.y - this.y;
    if (yOffset < 0) {
      yOffset *= -1;
    }

    const offset = xOffset + yOffset;

    return (offset / maxOffset) * 100;
  }

  render() {
    root.appendChild(this.element);
  }
};


/**
*   Mission   *
*   Each mission consits of N amount of launches,
*   the flight time for each launch is defined in cycles.
*/
class Mission {
  constructor(
    numberOfRockets,
    cycleLimit,
    planet
  ) {
    this.started = false;
    this.startingCoord = {
      x: window.innerWidth / 2,
      y: 0,
    };

    this.rockets = [];
    this.numberOfRockets = numberOfRockets;

    this.cycle = 0;
    this.cycleLimit = cycleLimit;

    this.planet = planet;
    this.earth = new Planet(window.innerWidth / 2, 0, 'earth.svg');

    // The maximum distance offset for the fitness function.
    this.maxXOffset = this.planet.x - this.planet.width / 2;
    this.maxYOffset = this.planet.y - this.planet.height / 2;
    this.maxOffset = this.maxXOffset + this.maxYOffset;

    // Binding the context to the mothods.
    this.propelRockets = this.propelRockets.bind(this);
    this.initialize = this.initialize.bind(this);
  }

  createRockets(dnaSet) {
    // Create N amount of rockets, each rocket starts at a random angle.
    for (let i = 0; i < this.numberOfRockets; i++) {
      this.rockets[i] = new Rocket(
        this.startingCoord.x,
        this.startingCoord.y,
        dnaSet[i]
      );

      // Render the rocket to the DOM.
      this.rockets[i].render();
    }
  }

  propelRockets() {
    if (this.cycle === this.cycleLimit) {
      // Clear the DOM.
      this.cycle = 0;
      root.innerHTML = '';

      //
      this.evaluateRockets();

      // Generate a new dna set by geneticly recombining the dna based on the rocket's fitness.
      const evolvedDna = this.geneticlyRecombineRockets();

      // Try again with improved DNA.

      this.planet.render();
      this.earth.render();
      this.createRockets(evolvedDna);
      this.propelRockets();
    } else {
      // Propel the rockets.
      for (let i = 0; i < this.numberOfRockets; i++) {
        this.rockets[i].propel(this.cycle);
      }

      // Propel recursifly.
      this.cycle++;
      setTimeout(this.propelRockets, 256);
    }
  }

  evaluateRockets() {
    // Evaluates the fitness of the rockets based on their distance to the new plannet.
    for (let i = 0; i < this.numberOfRockets; i++) {
      console.log('fitness: ', this.rockets[i].fitness(this.planet, this.maxOffset));
    }
  }

  geneticlyRecombineRockets() {
    // TODO: Generate this form the best performing rockets.
    const dnaSet = [];
    for (let i = 0; i < this.numberOfRockets; i++) {
      const dna = new DNA();
      for (let j = 0; j < this.cycleLimit; j++) {
        dna.add({
          angle: 0,
          thrust: Math.round(Math.random() * 64),
        });
      }
      dnaSet[i] = dna;
    }
    return dnaSet;
  }

  initialize() {
    // Display initial rockets and mars.
    this.planet.render();
    this.earth.render();

    // Generate random DNA for the first launch.
    const dnaSet = [];
    for (let i = 0; i < this.numberOfRockets; i++) {
      const dna = new DNA();
      for (let j = 0; j < this.cycleLimit; j++) {
        dna.add({
          angle: Math.round(Math.random() * 360),
          thrust: Math.round(Math.random() * 8),
        });
      }
      dnaSet[i] = dna;
    }

    this.createRockets(dnaSet);
  }
};


/**
*   Mission Control   *
*/
const planet = new Planet(window.innerWidth / 2, window.innerHeight - 64);
const mission = new Mission(4, 16, planet);

mission.initialize();

// Start mission when you click on the screen.
window.addEventListener('click', () => {
  // Only launch if not launched before.
  if (!mission.started) {
    mission.started = true;
    mission.propelRockets();
  }
});
