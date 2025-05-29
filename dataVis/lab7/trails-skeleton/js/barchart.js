class Barchart {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _dispatcher, _data) {
      // Configuration object with defaults
      this.config = {
        parentElement: _config.parentElement,
        colorScale: _config.colorScale,
        containerWidth: _config.containerWidth || 260,
        containerHeight: _config.containerHeight || 300,
        margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 40},
      }
      this.dispatcher = _dispatcher;
      this.data = _data;
      this.initVis();
    }
    
    /**
     * Initialize scales/axes and append static elements, such as axis titles
     */
    initVis() {
      let vis = this;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Initialize scales and axes
      
      // Initialize scales (yScale, and xScale)
      
      // Important: we flip array elements in the y output range to position the rectangles correctly
      vis.yScale = d3.scaleLinear()
          .range([vis.height, 0]) 
  
      vis.xScale = d3.scaleBand()
          .range([0, vis.width])
          .paddingInner(0.2);
  
      vis.xAxis = d3.axisBottom(vis.xScale)
          .ticks(['Easy', 'Intermediate', 'Difficult'])
          .tickSizeOuter(0);
  
      vis.yAxis = d3.axisLeft(vis.yScale)
          .ticks(6)
          .tickSizeOuter(0)
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
  
      // SVG Group containing the actual chart; D3 margin convention
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Append empty x-axis group and move it to the bottom of the chart
      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);
      
      // Append y-axis group 
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');
  
      // Append axis title
      vis.svg.append('text')
          .attr('class', 'axis-title')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '.71em')
          .text('Trails');
    }
  
    /**
     * Prepare data and scales before we render it
     */
    updateVis() {
      let vis = this;
  
      // Prepare data: count number of trails in each difficulty category
      // i.e. [{ key: 'easy', count: 10 }, {key: 'intermediate', ...
      const aggregatedDataMap = d3.rollups(vis.data, v => v.length, d => d.difficulty);
      vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({ key, count }));
  
      const orderedKeys = ['Easy', 'Intermediate', 'Difficult'];
      vis.aggregatedData = vis.aggregatedData.sort((a,b) => {
        return orderedKeys.indexOf(a.key) - orderedKeys.indexOf(b.key);
      });
  
      // Specificy accessor functions
      vis.colorValue = d => d.key;
      vis.xValue = d => d.key;
      vis.yValue = d => d.count;
  
      // Set the scale input domains
      vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
      vis.yScale.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);
  
      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;
  
      // Add rectangles --> be sure to use vis.config.colorScale!
      
      const bars = vis.chart.selectAll('.bar')
          .data(vis.aggregatedData, vis.xValue)
        .join('rect')
          .attr('class', 'bar')
          .attr('x', d => vis.xScale(vis.xValue(d))) //Don't forget "vis." !
          .attr('y', d => vis.height - 2.5*vis.yValue(d))
          .attr('width', d => 50)
          .attr('height', d => 2.5*vis.yValue(d))
          .attr('fill', d => vis.config.colorScale(vis.colorValue(d)))
          
          // Previous D3 code / attributes of the SVG rectangle ...
          .attr('class', 'bar')
          .on('click', function(event, d) {
            // Check if current category is active and toggle class
            const isActive = d3.select(this).classed('active');
            d3.select(this).classed('active', !isActive);

            // Get the names of all active/filtered categories
            const selectedCategories = vis.chart.selectAll('.bar.active').data().map(k => k.key);
            console.log(selectedCategories);

            // Call dispatcher and pass the event name, D3 event object,
            // and our custom event data (selected category names)
            vis.dispatcher.call('filterCategories', event, selectedCategories);
});


          /*
          .on('click', function(event, d) {
            // Check if filter is already active
            const isActive = difficultyFilter.includes(d.key);
            if (isActive) {
              // Remove filter
              difficultyFilter = difficultyFilter.filter(f => f !== d.key);
            } else {
              // Add filter
              difficultyFilter.push(d.key);
            }
         // Call global function to update scatter plot
          filterData();

          // Add class to style active filters with CSS
          d3.select(this).classed('active', !isActive);
        });
      */
      // Update axes
      vis.xAxisG.call(vis.xAxis);
      vis.yAxisG.call(vis.yAxis);
    }
  }