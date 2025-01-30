class Histogram {
    constructor(_config, _data, _defaultColumn) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 140,
            margin: { top: 50, bottom: 50, right: 50, left: 50 }
        }

        this.data = _data;
        this.selectedColumn = '';
        this.defaultColumn = _defaultColumn;

        // Call a class function
        this.updateData(this.data, this.defaultColumn);
    }

    initVis() {
        let vis = this;

        console.log('Initializing histogram');
        console.log(vis.data);

        // Width and height as the inner dimensions of the chart area
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Add <svg> element (drawing space)
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        // Create bins
        let bins = d3.histogram()
            .domain([0, 100])
            .thresholds(d3.range(0, 100, 1))
            (vis.data)
            .map(bin => {
            bin.x0 = bin.x0 !== undefined ? bin.x0 : bin[0];
            bin.x1 = bin.x1 !== undefined ? bin.x1 : bin[bin.length - 1];
            return bin;
            });

        console.log('Bins:', bins);

        // Create scales
        let x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.width]);

        let y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([vis.height, 0]);

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
            .attr('transform', `translate(${vis.width / 2}, ${vis.height + vis.config.margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .text(this.selectedColumn);

        vis.chart.append('text')
            .attr('transform', `translate(${-vis.config.margin.left + 15}, ${vis.height / 2}) rotate(270)`)
            .style('text-anchor', 'middle')
            .text('Count');

        // Create bars
        let bars = vis.chart.selectAll('.bar')
            .data(bins.filter(d => d.x0 !== undefined && d.x1 !== undefined));

        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .merge(bars)
            .attr('x', d => x(d.x0))
            .attr('y', d => y(d.length))
            .attr('width', d => x(d.x1) - x(d.x0) - 1)
            .attr('height', d => vis.height - y(d.length))
            .attr('fill', 'steelblue')
            .attr('stroke', 'black')  // Add this line to make sure bars are visible
            .on('mouseover', function(event, d) {
            d3.select(this).attr('fill', 'orange');
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html(`Count: ${d.length}<br> Percentage range: [${d.x0}%, ${d.x1}%]`)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 35) + 'px')
            })
            .on('mouseout', function(d) {
            d3.select(this).attr('fill', 'steelblue');
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            });

        bars.exit().remove();

        // Add tooltip
        let tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('text-align', 'center')
            .style('width', '120px')
            .style('height', '50px')
            .style('padding', '2px')
            .style('font', '12px sans-serif')
            .style('background', 'lightsteelblue')
            .style('border', '0px')
            .style('border-radius', '8px')
            .style('pointer-events', 'none')
            .style('opacity', 0);
    }

    updateData = function (data, selectedColumn) {
        this.selectedColumn = selectedColumn;

        let selectedData = data.map(d => d[this.selectedColumn]);

        console.log('Selected data:');
        console.log(selectedData);

        this.data = selectedData;
        // clear then re-draw the histogram
        d3.select(this.config.parentElement).selectAll('*').remove();

        this.initVis();
    }
}
