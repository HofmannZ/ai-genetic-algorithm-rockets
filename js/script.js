/**
*   Gene   *
*/
class Gene {
  constructor(adjustment, thrust) {
    this.adjustment = adjustment;
    this.thrust = thrust;
  }

  mutate() {
    this.adjustment = Math.round(22.5 - Math.random() * 45);
  }
};


/**
*   DNA   *
*/
class DNA {
  constructor(genes) {
    if (genes) {
      this.genes = genes;
    } else {
      this.genes = [];

      for (let j = 0; j < mission.lifeSpan; j++) {
        this.genes.push(new Gene(Math.round(22.5 - Math.random() * 45), 32));
      }
    }
  }

  crossover(partner) {
    const newGenes = [];

    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < mission.crossoverProbability) {
        newGenes[i] = this.genes[i];
      } else {
        newGenes[i] = partner.genes[i];
      }
    }

    return new DNA(newGenes);
  }

  mutate() {
    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < mission.mutationProbability) {
        this.genes[i].mutate();
      }
    }
  }
};


/**
*   Rocket   *
*   Echt rocket has it's own DNA containing an array of objects with two properties:
*   adjustment ( the adjustment angle of the rocket )
*   and
*   thrust ( the force of when propelled ).
*/
class Rocket {
  constructor(dna = new DNA()) {
    this.x = mission.startingCoord.x;
    this.y = mission.startingCoord.y;

    this.width = 24;
    this.height = 32;

    this.angle = 0;

    this.dna = dna;
    this.fitness = 0;

    this.crashed = false;
    this.completed = false;

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

  propel() {
    if (!this.crashed && !this.completed) {
      // Get the current gene from the dna.
      const currentGene = this.dna.genes[mission.count];

      // Calculate the new angle based on the ajustment.
      this.angle += currentGene.adjustment;

      // Calculate the rigth x and y increments based on the rocket's adjustment and speed.
      this.x += Math.sin(Math.PI / 180 * this.angle) * currentGene.thrust;
      this.y += Math.cos(Math.PI / 180 *  this.angle) * currentGene.thrust;

      // Apply the rocket's adjustment.
      this.element.style.transform = `translateX(-50%) rotate(${this.angle}deg)`;

      // Move the rocket to the new coordinate.
      this.element.style.left = `${this.x.toString()}px`;
      this.element.style.bottom = `${this.y.toString()}px`;

      if (this.x < 0 || this.x > window.innerWidth || this.y < 0 || this.y > window.innerHeight) {
        this.crached = true;
      }

      if (this.x > mission.target.x - mission.target.width / 2
          && this.x < mission.target.x + mission.target.width / 2
          && this.y > mission.target.y - mission.target.height / 2
          && this.y < mission.target.y + mission.target.height / 2
      ) {
        this.completed = true;
      }
    }
  }

  calculateFitness() {
    // Calculate the fitness of the rocket on a scale of 1 to 100.
    let xOffset = mission.target.x - this.x;
    if (xOffset < 0) {
      xOffset *= -1;
    }

    let yOffset = mission.target.y - this.y;
    if (yOffset < 0) {
      yOffset *= -1;
    }

    this.fitness = xOffset + yOffset;

    if (this.crashed) {
      this.fitness /= 8;
    }

    if (this.completed) {
      this.fitness *= 16;
    }

    this.fitness = Math.round(this.fitness);
  }

  render() {
    space.appendChild(this.element);
  }
};


/**
*   Generation   *
*   Each genaration has a population of rockets
*   the flight time for each launch is defined as lifespan.
*/
class Generation {
  constructor(populationSize) {
    this.populationSize = populationSize;
    this.rockets = [];
    this.breedingPool = [];

    for (let i = 0; i < this.populationSize; i++) {
      this.rockets[i] = new Rocket();
    }
  }

  propel(count) {
    for (let i = 0; i < this.populationSize; i++) {
      this.rockets[i].propel(count);
    }
  }

  generateBreedingPool() {
    let maxFitness = 0;

    // Evaluate the fitness of each rocket in the population.
    for (let i = 0; i < this.populationSize; i++) {
      const fitness = this.rockets[i].calculateFitness();

      if (this.rockets[i].fitness > maxFitness) {
        maxFitness = this.rockets[i].fitness;
      }
    }

    // Set the rocket's fitness to a 0 to 100 scale based on the maximun fitnes of the generation.
    for (let i = 0; i < this.populationSize; i++) {
      this.rockets[i].fitness /= maxFitness;
      this.rockets[i].fitness *= 100;
    }

    this.breedingPool = [];

    for (let i = 0; i < this.populationSize; i++) {
      for (let j = 0; j < this.rockets[i].fitness; j++) {
        this.breedingPool.push(this.rockets[i]);
      }
    }
  }

  crossover() {
    const evolvedRockets = [];

    this.generateBreedingPool();

    for (let i = 0; i < this.populationSize; i++) {
      // Select two random parrenta from the breeding pool.
      const parrentOneIndex = Math.floor(Math.random() * this.breedingPool.length);
      const parrentTwoIndex = Math.floor(Math.random() * this.breedingPool.length);

      const parrentOne = this.breedingPool[parrentOneIndex];
      const parrentTwo = this.breedingPool[parrentTwoIndex];

      let childDna;

      // Crossover the dna form the strongest to the weakest parerent. And add it to the dna set.
      if (parrentOne.fitness >= parrentTwo.fitness) {
        childDna = parrentOne.dna.crossover(parrentTwo.dna, mission.crossoverProbability);
      } else {
        childDna = parrentTwo.dna.crossover(parrentOne.dna, mission.crossoverProbability);
      }

      // Mutate the new child based on the mutation probability.
      childDna.mutate(mission.mutationProbability);
      evolvedRockets[i] = new Rocket(childDna);
    }

    this.rockets = evolvedRockets;
  }

  render() {
    for (let i = 0; i < this.populationSize; i++) {
      this.rockets[i].render();
    }
  }
};


/**
*   Plannet   *
*/
class Planet {
  constructor(x, y, src, size = 64) {
    this.x = x;
    this.y = y;

    this.width = size;
    this.height = size;

    if (src) {
      this.src = src;
    } else {
      this.src = 'planet.svg'
    }
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
    space.appendChild(element);
  }
};


/**
*   Heads Up Display   *
*/
class HUD {
  render() {
    const hud = document.createElement('article');
    hud.classList.add('hud');

    const lifeSpan = document.createElement('p');
    lifeSpan.classList.add('hud__item');
    lifeSpan.innerHTML = `Life span: ${mission.lifeSpan}`;
    hud.appendChild(lifeSpan);

    const generationCount = document.createElement('p');
    generationCount.classList.add('hud__item');
    generationCount.innerHTML = `Generation: ${mission.generationCount}`;
    hud.appendChild(generationCount);

    const populationSize = document.createElement('p');
    populationSize.classList.add('hud__item');
    populationSize.innerHTML = `Population size: ${mission.populationSize} rockets`;
    hud.appendChild(populationSize);

    const crossoverProbability = document.createElement('p');
    crossoverProbability.classList.add('hud__item');
    crossoverProbability.innerHTML = `Crossover probability: ${mission.crossoverProbability * 100}%`;
    hud.appendChild(crossoverProbability);

    const mutationProbability = document.createElement('p');
    mutationProbability.classList.add('hud__item');
    mutationProbability.innerHTML = `Mutation probability: ${mission.mutationProbability * 100}%`;
    hud.appendChild(mutationProbability);

    space.appendChild(hud);
  }
}


/**
*   Mission   *
*/
class Mission {
  constructor(
    target,
    lifeSpan,
    populationSize,
    crossoverProbability,
    mutationProbability
  ) {
    this.started = false;
    this.startingCoord = {
      x: window.innerWidth / 2,
      y: 32,
    };

    this.count = 0;
    this.lifeSpan = lifeSpan;

    this.crossoverProbability = crossoverProbability;
    this.mutationProbability = mutationProbability;

    this.target = target;
    this.earth = new Planet(window.innerWidth / 2, 0, 'earth.svg');

    this.populationSize = populationSize;
    this.generation;
    this.generationCount = 1;

    this.hud = new HUD();

    // The maximum distance offset for the fitness function.
    this.maxXOffset = this.target.x - this.target.width / 2;
    this.maxYOffset = this.target.y - this.target.height / 2;
    this.maxOffset = this.maxXOffset + this.maxYOffset;

    // Binding the context to the mothods.
    this.run = this.run.bind(this);
    this.initialize = this.initialize.bind(this);
  }

  run() {
    if (this.count === this.lifeSpan) {
      // Clear the DOM.
      this.count = 0;
      space.innerHTML = '';

      // Setup the planets.
      this.target.render();
      this.earth.render();

      // Evolve the generation.
      this.generation.crossover();
      this.generation.render();
      this.generationCount++;

      // Update the HUD.
      this.hud.render();

      // Run this method recursifly.
      this.run();
    } else {
      // Propel all the rockets.
      this.generation.propel(this.count);

      // Run this method recursifly.
      this.count++;
      setTimeout(this.run, 256);
    }
  }

  initialize() {
    // Display initial rockets and mars.
    this.target.render();
    this.earth.render();
    this.hud.render();

    // Create an inital random rocket generation.
    this.generation = new Generation(this.populationSize);
    this.generation.render();
  }
};


/**
*   Mission Control   *
*/
const space = document.querySelector('.space');
const target = new Planet(window.innerWidth / 2, window.innerHeight - 126, false, 126);
const mission = new Mission(target, 24, 32, 0.5, 0.01);

mission.initialize();

// Start mission when you click on the screen.
window.addEventListener('click', () => {
  // Only launch if not launched before to avoid bugs.
  if (!mission.started) {
    mission.started = true;
    mission.run();
  }
});
