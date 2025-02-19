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

        this.brushed = this.brushed.bind(this);

        this.initVis();
        this.addEventListener();

        // Call a class function
        this.updateData(this.data, this.defaultColumn[0], this.defaultColumn[1]);
    }

    initVis() {
        let vis = this;

        // Width and height as the inner dimensions of the chart area
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xScaleFocus = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.width]);

        vis.xScaleContext = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.width]);

        vis.yScaleFocus = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.height, 0]);

        vis.yScaleContext = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.height, 0]);

        // Add <svg> element (drawing space)
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        vis.brush = d3.brush()
            .extent([[0, 0], [vis.width, vis.height]])
            .on('brush end', function (event) {
                vis.brushed(event);
            });

        vis.chart.append('g')
            .attr('class', 'brush')
            .call(vis.brush);

        // Create axes groups
        vis.xAxisGroup = vis.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${vis.height})`);

        vis.yAxisGroup = vis.chart.append('g')
            .attr('class', 'y-axis');

        // Create axis labels
        vis.xAxisLabel = vis.chart.append('text')
            .attr('transform', `translate(${vis.width / 2}, ${vis.height + vis.config.margin.bottom - 5})`)
            .style('text-anchor', 'middle');

        vis.yAxisLabel = vis.chart.append('text')
            .attr('transform', `translate(${-vis.config.margin.left + 15}, ${vis.height / 2}) rotate(270)`)
            .style('text-anchor', 'middle');

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

        // Add legend
        vis.legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width - 150}, ${vis.config.margin.top})`);

        // Unselected data points
        vis.legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d3.schemeCategory10[0]);

        vis.legend.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .text('Unselected Data Points')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');

        // Viewing data points
        vis.legend.append('rect')
            .attr('x', 0)
            .attr('y', 20)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d3.schemeCategory10[1]);

        vis.legend.append('text')
            .attr('x', 20)
            .attr('y', 30)
            .text('Viewing Data Points')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');

        // Selected data points
        vis.legend.append('rect')
            .attr('x', 0)
            .attr('y', 40)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', d3.schemeCategory10[3]);

        vis.legend.append('text')
            .attr('x', 20)
            .attr('y', 50)
            .text('Selected Data Points')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');
    }

    renderVis() {
        let vis = this;

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
        vis.xAxisGroup.call(xAxis);
        vis.yAxisGroup.call(yAxis);

        vis.xAxisLabel.text(`Percentage: ${vis.selectedXColumn}`);
        vis.yAxisLabel.text(`Percentage: ${vis.selectedYColumn}`);

        // Draw the circles
        let circles = vis.chart.selectAll('.circle')
            .data(vis.processedData);

        circles.enter()
            .append('circle')
            .attr('class', 'circle')
            .merge(circles)
            .attr('cx', d => x(d.Xdata))
            .attr('cy', d => y(d.Ydata))
            .attr('r', 5)
            .attr('fill', d => selectedCounties.includes(d.Fips) ? selectedColor : d3.schemeCategory10[0])
            .attr('stroke', d => selectedCounties.includes(d.Fips) ? selectedColor : 'black')
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
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(100)
                    .attr('r', 5)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 0.2);

                vis.tooltip.transition()
                    .duration(100)
                    .style('opacity', 0);
            })
            .on('mousedown', function () {
                vis.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
                var selection = vis.brush.extent(),
                    m = d3.pointer(vis.svg.node()), // pointer position with respect to g
                    p = [x.invert(m[0]), y.invert(m[1])]; // position in user space

                // clear all tooltips
                d3.selectAll('.tooltip').style('opacity', 0);
            })
            .on('mouseup', function () {
                vis.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        circles.exit().remove();
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

        this.renderVis();
    }

    // Method to add event listener
    addEventListener() {
        window.addEventListener('selectedCountiesChanged', () => {
            this.updateData(this.data, this.selectedXColumn, this.selectedYColumn);
        });
    }

    hasSelectedCountiesChanged() {
        // Check if selected counties have actually changed
        // This can be a more sophisticated comparison, but here’s a simple example
        const currentCounties = window.selectedCounties.join(',');
        if (this.previousCounties !== currentCounties) {
            this.previousCounties = currentCounties;
            return true;
        }
        return false;
    }

    brushed(event) {
        let vis = this;
        const selection = event.selection;

        // Check if the brush is still active or if it has been removed
        if (selection) {
            // clear the selected counties
            window.selectedCounties = [];
            // Get the corresponding x and y ranges
            const xRange = [vis.xScaleContext.invert(selection[0][0]), vis.xScaleContext.invert(selection[1][0])];
            const yRange = [vis.yScaleContext.invert(selection[1][1]), vis.yScaleContext.invert(selection[0][1])];

            // get the fips of the selected data points
            const selectedData = vis.processedData.filter(d => d.Xdata >= xRange[0] && d.Xdata <= xRange[1] && d.Ydata >= yRange[0] && d.Ydata <= yRange[1]);

            console.log(selectedData);

            // Update the data
            const fips = selectedData.map(d => d.Fips);
            //sort the fips
            fips.sort();

            fips.forEach(f => {
                const index = window.selectedCounties.indexOf(f);
                if (index === -1) {
                    window.selectedCounties.push(f);
                } else {
                    window.selectedCounties.splice(index, 1);
                }
            });

            // Dispatch a custom event to notify other charts
            window.dispatchEvent(new CustomEvent('selectedCountiesChanged'));

        }
    }
}
