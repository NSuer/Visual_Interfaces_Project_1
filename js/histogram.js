class Histogram {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 140,
            margin: { top: 10, bottom: 30, right: 10, left: 30 }
        }

        this.data = _data;

        // Call a class function
        this.initVis();
    }

    initVis() {
        let vis = this;

        console.log('Initializing histogram');
        console.log(vis.data);

        // Width and height as the inner dimensions of the chart area- as before
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define 'svg' as a child-element (g) from the drawing area and include spaces
        // Add <svg> element (drawing space)
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        // Create bins
        let bins = d3.histogram()
            .domain([d3.min(vis.data), d3.max(vis.data)])
            .thresholds(20)
            (vis.data);

        console.log('Bins:');
        console.log(bins);

        // Create scales
        let x = d3.scaleLinear()
            .domain([d3.min(vis.data), d3.max(vis.data)])
            .range([0, vis.width]);

        let y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([vis.height, 0]);

        // Create bars
        let bars = vis.chart.selectAll('.bar')
            .data(bins);

        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .merge(bars)
            .attr('x', d => x(d.x0))
            .attr('y', d => y(d.length))
            .attr('width', d => x(d.x1) - x(d.x0) - 1)
            .attr('height', d => vis.height - y(d.length));

        bars.exit().remove();

        // Create axes
        let xAxis = d3.axisBottom(x);
        let yAxis = d3.axisLeft(y);

        vis.chart.selectAll('.x-axis').remove();
        vis.chart.selectAll('.y-axis').remove();

        vis.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${vis.height})`)
            .call(xAxis);

        vis.chart.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);

        vis.chart.append('text')
            .attr('transform', `translate(${vis.width / 2}, ${vis.height + 25})`)
            .style('text-anchor', 'middle')
            .text(selectedColumn);

        vis.chart.append('text')
            .attr('transform', `translate(${-25}, ${vis.height / 2}) rotate(270)`)
            .style('text-anchor', 'middle')
            .text('Frequency');

    }

    updateData = function (data, selectedColumn) {

        if (selectedColumn == '') {
            selectedColumn = 'Median_HH_Inc_ACS';
        }
        // What this function should do is take the data fron the selected column and update the histogram
        // This is where the magic happens
        console.log('Updating histogram data');
        console.log(data);

        // Filter data to only include the selected column
        let selectedData = data.map(d => d[selectedColumn]);

        console.log('Selected data:');
        console.log(selectedData);

        this.data = selectedData;
    }
}