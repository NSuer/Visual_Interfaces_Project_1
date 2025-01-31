class Scatterplot {
    constructor(_config, _data, _defaultColumn, _descriptions) {
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

        this.title = [];

        this.addEventListener();

        // Call a class function
        this.updateData(this.data, this.defaultColumn[0], this.defaultColumn[1], _descriptions);
    }

    initVis() {
        let vis = this;

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
            .domain([0, 100])
            .range([0, vis.width]);

        let y = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.height, 0]);

        // Create axes
        let xAxis = d3.axisBottom(x).tickFormat(d => d + '%');
        let yAxis = d3.axisLeft(y).tickFormat(d => d + '%');

        let selectedColor = d3.schemeCategory10[3];

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
            .text(`Percentage: ${vis.selectedXColumn}`);

        vis.chart.append('text')
            .attr('transform', `translate(${-vis.config.margin.left + 15}, ${vis.height / 2}) rotate(270)`)
            .style('text-anchor', 'middle')
            .text(`Percentage: ${vis.selectedYColumn}`);

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
            .attr('fill', d => selectedCounties.includes(d.Fips) ? selectedColor : d3.schemeCategory10[0])
            .attr('stroke', 'black')
            .attr('stroke-width', 0.2)
            .attr('fill-opacity', 0.5)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr('r', 10)
                    .attr('stroke', d3.schemeCategory10[1])
                    .attr('stroke-width', 1);

                vis.tooltip.transition()
                    .duration(100)
                    .style('opacity', 1);
                vis.tooltip.html(`FIPS: ${d.Fips}<br>State: ${d.State}<br>County: ${d.County}<br>${vis.selectedXColumn}: ${d.Xdata}%<br>${vis.selectedYColumn}: ${d.Ydata}%`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr('r', 5)
                    .attr('stroke', 'black')

                vis.tooltip.transition()
                    .duration(100)
                    .style('opacity', 0);
            });

        // Add legend
        let legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width - 150}, ${vis.config.margin.top})`);

        // Unselected data points
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d3.schemeCategory10[0]);

        legend.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .text('Unselected Data Points')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');

        // Viewing data points
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 20)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d3.schemeCategory10[1]);

        legend.append('text')
            .attr('x', 20)
            .attr('y', 30)
            .text('Viewing Data Points')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');

        // Selected data points
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 40)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', selectedColor);

        legend.append('text')
            .attr('x', 20)
            .attr('y', 50)
            .text('Selected Data Points')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
    }

    updateData = function (data, selectedXColumn, selectedYColumn) {
        this.selectedXColumn = selectedXColumn;
        this.selectedYColumn = selectedYColumn;

        this.processedData = data.map(d => ({
            Xdata: d[this.selectedXColumn],
            Ydata: d[this.selectedYColumn],
            color: d3.schemeCategory10[0],
            Fips: d['FIPS'],
            State: d['State'],
            County: d['County']
        }));
        // clear then re-draw the histogram
        d3.select(this.config.parentElement).selectAll('*').remove();

        this.initVis();
    }

    // Method to add event listener
    addEventListener() {
        window.addEventListener('selectedCountiesChanged', (event) => {
            this.updateData(this.data, this.selectedXColumn, this.selectedYColumn);
        });
    }
}
