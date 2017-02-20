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
        this.genes.push(new Gene(22.5 - Math.random() * 45, 32));
      }
    }
  }

  crossover(partner) {
    const newGenes = [];

    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < mission.crossoverProbability) {
        const { adjustment, thrust } = this.genes[i];
        newGenes[i] =  new Gene(adjustment, thrust);
      } else {
        const { adjustment, thrust } = partner.genes[i];
        newGenes[i] =  new Gene(adjustment, thrust);
      }
    }

    return new DNA(newGenes);
  }

  mutate(mutationProbability) {
    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < mutationProbability) {
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
  constructor(id, dna = new DNA()) {
    this.id = id;

    this.x = mission.startingCoord.x;
    this.y = mission.startingCoord.y;

    this.width = 24;
    this.height = 32;

    this.angle = 0;
    this.totalAdjustments = [dna.genes[0].adjustment];

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

      for (let i = 0; i < mission.asteroids.length; i++) {
        if (this.x > mission.asteroids[i].x - mission.asteroids[i].width / 2
            && this.x < mission.asteroids[i].x + mission.asteroids[i].width / 2
            && this.y > mission.asteroids[i].y - mission.asteroids[i].height / 2
            && this.y < mission.asteroids[i].y + mission.asteroids[i].height / 2
        ) {
          this.crashed = true;
        }
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

  totalAdjustment(geneIndex) {
    this.totalAdjustments[geneIndex] = this.totalAdjustments[geneIndex - 1] + this.dna.genes[geneIndex].adjustment;

    return this.totalAdjustments[geneIndex];
  }

  calculateFitness() {
    // Calculate the fitness of the rocket.
    let xOffset = mission.target.x - this.x;
    if (xOffset < 0) {
      xOffset *= -1;
    }

    let yOffset = mission.target.y - this.y;
    if (yOffset < 0) {
      yOffset *= -1;
    }

    this.fitness = (window.innerWidth + window.innerHeight) - (xOffset + yOffset);

    // Adjust the rocket's fitness.
    if (this.crashed) {
      this.fitness /= 8;
    }

    if (this.completed) {
      this.fitness *= 8;
    }
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
    this.averageFitness = 0;
    this.mutationProbability = 0;
    this.maxFitness = 0;

    for (let i = 0; i < this.populationSize; i++) {
      this.rockets[i] = new Rocket(i);
    }
  }

  completed() {
    for (let i = 0; i < this.populationSize; i++) {
      if (!this.rockets[i].completed) {
        return false;
      }
    }
    return true;
  }

  propel(count) {
    for (let i = 0; i < this.populationSize; i++) {
      this.rockets[i].propel(count);
    }
  }

  evaluate() {
    let i;
    let totalFitness = 0;

    this.maxFitness = 0;

    // Evaluate the fitness of each rocket in the population.
    for (i = 0; i < this.populationSize; i++) {
      this.rockets[i].calculateFitness();

      if (this.rockets[i].fitness > this.maxFitness) {
        this.maxFitness = this.rockets[i].fitness;
      }
    }

    for (i = 0; i < this.populationSize; i++) {

      // Level the rocket's fitness to a 0 to 100 scale based on the maximun fitness of the generation.
      this.rockets[i].fitness /= this.maxFitness;
      this.rockets[i].fitness *= 100;

      totalFitness += this.rockets[i].fitness;
    }

    this.averageFitness = totalFitness / this.populationSize;

    this.mutationProbability = 1 / this.averageFitness -0.01;
  }

  pickParrent(i) {
    const parrentIndex = Math.floor(Math.random() * this.populationSize);
    const parrent = this.rockets[parrentIndex];

    // Avoid callstack limit error.
    if (i > Math.pow(2, 14) / 2) {
      return parrent;
    }

    // Check if parrent is suitable based on the probebility of it's fitness.
    if ((Math.random() * this.maxFitness) < parrent.fitness) {
      return parrent;
    }

    // Else try to find an other parrent.
    return this.pickParrent(++i);
  }

  matchMaking(parrentOne, i) {
    const parrentTwo = this.pickParrent(0);

    // Avoid callstack limit error.
    if (i < Math.pow(2, 14)) {

      // Check if all the genes of the parrents are actualy within the difference margin.
      for (let j = 1; j < mission.lifeSpan; j++) {
        let difference = parrentOne.totalAdjustment(j) - parrentTwo.totalAdjustment(j);
        if (difference < 0) {
          difference *= -1;
        }

        // If the difference is to big try with an other partner.
        if (difference > mission.maxAllowedDifference) {
          return this.matchMaking(parrentOne, ++i);
        }
      }
    }

    // Returns a matching partner or if none exists returns a random partner.
    return parrentTwo;
  }

  crossover() {
    const evolvedRockets = [];

    this.evaluate();

    for (let i = 0; i < this.populationSize; i++) {

      // Select a random parrent.
      const parrentOne = this.pickParrent(0);

      // Find a rocket with it's ajustments within the allowed margin of ajustments for each point in time.
      const parrentTwo = this.matchMaking(parrentOne, 0);

      let childDna;

      // Crossover the dna form the strongest to the weakest parerent. And add it to the dna set.
      if (parrentOne.fitness >= parrentTwo.fitness) {
        childDna = parrentOne.dna.crossover(parrentTwo.dna, mission.crossoverProbability);
      } else {
        childDna = parrentTwo.dna.crossover(parrentOne.dna, mission.crossoverProbability);
      }

      evolvedRockets[i] = new Rocket(i, childDna);

      // Mutate the new child based on the mutation probability.
      evolvedRockets[i].dna.mutate(this.mutationProbability);
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

    if (mission.completed) {
      const completed = document.createElement('p');
      completed.classList.add('hud__item');
      completed.classList.add('hud__item_complete');
      completed.innerHTML = `Mission complete!`;
      hud.appendChild(completed);
    }

    const lifeSpan = document.createElement('p');
    lifeSpan.classList.add('hud__item');
    lifeSpan.innerHTML = `Life span: ${mission.lifeSpan}`;
    hud.appendChild(lifeSpan);

    const generationCount = document.createElement('p');
    generationCount.classList.add('hud__item');
    generationCount.innerHTML = `Generation: ${mission.generationCount}`;
    hud.appendChild(generationCount);

    const averageFitness = document.createElement('p');
    averageFitness.classList.add('hud__item');
    averageFitness.innerHTML = `Average fitness: ${mission.generation.averageFitness.toFixed(2)}%`;
    hud.appendChild(averageFitness);

    const populationSize = document.createElement('p');
    populationSize.classList.add('hud__item');
    populationSize.innerHTML = `Population size: ${mission.populationSize} rockets`;
    hud.appendChild(populationSize);

    const maxAllowedDifference = document.createElement('p');
    maxAllowedDifference.classList.add('hud__item');
    maxAllowedDifference.innerHTML = `Maximum adjustment difference: ${mission.maxAllowedDifference} pixels`;
    hud.appendChild(maxAllowedDifference);

    const crossoverProbability = document.createElement('p');
    crossoverProbability.classList.add('hud__item');
    crossoverProbability.innerHTML = `DNA crossover probability: ${(mission.crossoverProbability * 100).toFixed(2)}%`;
    hud.appendChild(crossoverProbability);

    const mutationProbability = document.createElement('p');
    mutationProbability.classList.add('hud__item');
    mutationProbability.innerHTML = `DNA mutation probability: ${(mission.generation.mutationProbability * 100).toFixed(2)}%`;
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
    maxAllowedDifference,
    crossoverProbability
  ) {
    this.started = false;
    this.startingCoord = {
      x: window.innerWidth / 2,
      y: 32,
    };
    this.completed = false;

    this.count = 0;
    this.lifeSpan = lifeSpan;

    this.crossoverProbability = crossoverProbability;

    this.maxAllowedDifference = maxAllowedDifference;

    this.target = target;
    this.earth = new Planet(window.innerWidth / 2, 0, 'earth.svg');
    this.asteroids = [
      new Planet(window.innerWidth / 2 - 32, window.innerHeight / 2, 'asteroid.svg'),
      new Planet(window.innerWidth / 2 + 32, window.innerHeight / 2 - 32, 'asteroid.svg'),
      new Planet(window.innerWidth / 3 * 2, window.innerHeight / 4, 'asteroid.svg'),
      new Planet(window.innerWidth / 4 * 1, window.innerHeight / 4 * 1, 'asteroid.svg'),
      new Planet(window.innerWidth / 2 + 96, window.innerHeight / 2, 'asteroid.svg'),
      new Planet(window.innerWidth / 2 - 96, window.innerHeight / 2 - 32, 'asteroid.svg'),
      new Planet(window.innerWidth / 2 - 160, window.innerHeight / 2, 'asteroid.svg'),
      new Planet(window.innerWidth / 2 + 160, window.innerHeight / 2 - 32, 'asteroid.svg'),
    ];

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

    // Check if mission is completed.
    this.completed = this.generation.completed();
    if (this.completed) {
      // Update the HUD.
      this.hud.render();
      return true;
    }

    if (this.count === this.lifeSpan) {

      // Clear the DOM.
      this.count = 0;
      space.innerHTML = '';

      // Setup the planets.
      this.target.render();
      this.earth.render();
      for (let i = 0; i < this.asteroids.length; i++) {
        this.asteroids[i].render();
      }

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
    for (let i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].render();
    }

    // Create an inital random rocket generation.
    this.generation = new Generation(this.populationSize);
    this.generation.render();

    this.hud.render();
  }
};


/**
*   Mission Control   *
*/
const space = document.querySelector('.space');
const target = new Planet(window.innerWidth / 2, window.innerHeight - 126, false, 126);
const mission = new Mission(target, 24, 32, window.innerWidth + window.innerHeight, 0.5);

mission.initialize();

// Start mission when you click on the screen.
window.addEventListener('click', () => {
  // Only launch if not launched before to avoid bugs.
  if (!mission.started) {
    mission.started = true;
    mission.run();
  }
});
