let globalGames; //global variable, so can be accessed from the onchange in html

/**
 * Load data from JSON file asynchronously and render force directed graph
 */
d3.json('data/ssbu_with_neighbor_counts.json').then(data => {

  this.createLegend();
  globalGames = data;  
  
  const forceDirectedGraph = new ForceDirectedGraph({ parentElement: '#force-directed-graph'}, globalGames);
  
  
  //working on dropdown filtering

  //code taken from Lab 2

  dataFiltering();

  })
  .catch(error => console.error(error));



function dataFiltering() {
	var games = globalGames.nodes.slice(); //copies 
	  
	var currentArray = dataManipulation(); //returns current selected box value

  var currentAttr = currentArray[0];
  var currentSort = currentArray[1];


  sortedGames = games.sort(function(a, b) {

        if (currentAttr === "copies") {
            
          return currentSort === "ascend" ? a.size - b.size : b.size - a.size;
        
          } else if (currentAttr === "crossover") {
            
            return currentSort === "ascend" ? a.neighborCount - b.neighborCount : b.neighborCount - a.neighborCount;
  
          } else if (currentAttr === "alphabetical") {

            //used Perplexity to help with id comparison, alphabetical
            if (currentSort === "ascend") {
                  return a.id.localeCompare(b.id);
              } else {
                  return b.id.localeCompare(a.id);
              }
          }
  });

    updateRank(sortedGames, currentAttr, currentSort);
   
  }

function dataManipulation() {
	var attribute = document.getElementById("attr");
	var selectedAttr = attribute.options[attribute.selectedIndex].value;

  var sorting = document.getElementById("sort");
  var selectedSort = sorting.options[sorting.selectedIndex].value;

	console.log(selectedAttr, selectedSort)

	return [selectedAttr, selectedSort];
}

function updateRank(games, currentAttr, currentSort) {
  const dropdown = d3.select("#order");
  dropdown.selectAll('option').remove();
  
  if (currentAttr === "copies") {
    games.forEach(game => {
            dropdown.append('option')
              .attr('value', game.id)
              .text(`${game.id}: ${game.size}M copies sold`);
            });
  }

  else if (currentAttr === "crossover") {
    games.forEach(game => {
            dropdown.append('option')
              .attr('value', game.id)
              .text(`${game.id}: ${game.neighborCount} Crossovers`);
            });

  }

  else if (currentAttr === "alphabetical") {
    games.forEach(game => {
            dropdown.append('option')
              .attr('value', game.id)
              .text(`${game.id}`);
            });


          }

   
}

  function createLegend(){
    const legend = d3.select('#legend');
    const svg = legend.append('svg')
    .attr('width', 400)
    .attr('height', 160);
    
    const parties = [
    { legendtext: 'Nintendo Franchise', color: '#d73027' },
    { legendtext: 'Third-Party Franchise', color: '#4575b4' }
  ];

    const links = [
    { legendtext: 'Fighter in Smash', color: '#fc8d59' },
    { legendtext: 'Other Smash Crossover', color: '#91bfdb' },
    { legendtext: 'Non-Smash Crossover', color: '#e0e0e0' }
  ];

  svg.append('text')
    .attr('x', 10)
    .attr('y', 20)
    .text('Node Color:')
    .attr('font-weight', 'bold');

  parties.forEach((item, i) => {
    svg.append('circle')
      .attr('cx', 20)
      .attr('cy', 40 + i * 25)
      .attr('r', 7)
      .attr('fill', item.color);

    svg.append('text')
      .attr('x', 40)
      .attr('y', 45 + i * 25)
      .attr('class', 'legendtext')
      .text(item.legendtext)
      .attr('font-weight', 'thin');
  });

  svg.append('text')
    .attr('x', 10)
    .attr('y', 100)
    .text('Link Color:')
    .attr('font-weight', 'bold');

  links.forEach((item, i) => {
    svg.append('line')
      .attr('x1', 20)
      .attr('y1', 115 + i * 20)
      .attr('x2', 50)
      .attr('y2', 115 + i * 20)
      .attr('stroke', item.color)
      .attr('stroke-width', 3);

    svg.append('text')
      .attr('x', 60)
      .attr('y', 120 + i * 20)
      .attr('class', 'legendtext')
      .text(item.legendtext);
  });
  }