class Scatterplot {
    constructor(_config, _data, _defaultColumn) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 140,
            margin: { top: 50, bottom: 50, right: 50, left: 50 }
        }

        this.data = _data;
        this.processedData = [];

        this.selectedXColumn = '';
        this.selectedYColumn = '';
        this.defaultColumn = _defaultColumn;
        console.log('Scatterplot default column:', this.defaultColumn[1]);

        // Call a class function
        this.updateData(this.data, this.defaultColumn[0], this.defaultColumn[1]);
    }

    initVis() {
        let vis = this;

        console.log('Initializing scatterplot');
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

        // Create scales
        let x = d3.scaleLinear()
            .domain([d3.min(vis.processedData, d => d.Xdata), d3.max(vis.processedData, d => d.Xdata)])
            .range([0, vis.width]);

        let y = d3.scaleLinear()
            .domain([d3.min(vis.processedData, d => d.Ydata), d3.max(vis.processedData, d => d.Ydata)])
            .range([vis.height, 0]);

        // Create axes
        let xAxis = d3.axisBottom(x);
        let yAxis = d3.axisLeft(y);

        // Draw the axes
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
            .text(this.selectedXColumn);

        vis.chart.append('text')
            .attr('transform', `translate(${-vis.config.margin.left + 15}, ${vis.height / 2}) rotate(270)`)
            .style('text-anchor', 'middle')
            .text(this.selectedYColumn);

        // Create tooltip
        vis.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#f4f4f4')
            .style('padding', '5px')
            .style('border', '1px solid #ddd')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        // Draw the circles
        vis.chart.selectAll('.circle')
            .data(vis.processedData)
            .enter()
            .append('circle')
            .attr('class', 'circle')
            .attr('cx', d => x(d.Xdata))
            .attr('cy', d => y(d.Ydata))
            .attr('r', 5)
            .attr('fill', 'steelblue')
            .attr('fill-opacity', 0.5)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr('r', 10)
                    .attr('fill', 'orange')
                    .attr('fill-opacity', 1);

                vis.tooltip.transition()
                    .duration(100)
                    .style('opacity', 1);
                vis.tooltip.html(`FIPS: ${d.Fips}<br>State: ${d.State}<br>County: ${d.County}<br>${vis.selectedXColumn}: ${d.Xdata}<br>${vis.selectedYColumn}: ${d.Ydata}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr('r', 5)
                    .attr('fill', 'steelblue')
                    .attr('fill-opacity', 0.5);

                vis.tooltip.transition()
                    .duration(100)
                    .style('opacity', 0);
            });
    }

    updateData = function (data, selectedXColumn, selectedYColumn) {
        this.selectedXColumn = selectedXColumn;
        this.selectedYColumn = selectedYColumn;

        this.processedData = data.map(d => ({
            Xdata: d[this.selectedXColumn],
            Ydata: d[this.selectedYColumn],
            Fips: d['FIPS'],
            State: d['State'],
            County: d['County']
        }));
        // clear then re-draw the histogram
        d3.select(this.config.parentElement).selectAll('*').remove();

        this.initVis();
    }
}
