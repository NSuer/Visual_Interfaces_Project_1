class Histogram {
    constructor(_config, _data, _defaultColumn, _descriptions) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 140,
            margin: { top: 50, bottom: 50, right: 50, left: 50 }
        }

        this.data = _data;
        this.selectedColumn = [];
        this.defaultColumn = _defaultColumn;
        this.title = [];
        this.brushed = this.brushed.bind(this);

        this.colors = d3.scaleOrdinal([d3.schemeCategory10[0], d3.schemeCategory10[2]]);
        this.mouseoverColor = d3.schemeCategory10[1];
        this.selectedColor = d3.schemeCategory10[3];

        this.initVis();
        this.addEventListener();

        // Call a class function
        this.updateData(this.data, this.defaultColumn, _descriptions);
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

        // Add <svg> element (drawing space)
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on('brush end', function (event) {
                vis.brushed(event);
            });

        vis.chart.append('g')
            .attr('class', 'brush')
            .call(vis.brush);

        // Create axes
        vis.xAxis = d3.axisBottom(vis.xScaleFocus).tickFormat(d => d + '%');
        vis.yAxis = d3.axisLeft(d3.scaleLinear().range([vis.height, 0]));

        vis.chart.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${vis.height})`);

        vis.chart.append('g')
            .attr('class', 'y-axis');

        vis.chart.append('text')
            .attr('transform', `translate(${vis.width / 2}, ${vis.height + vis.config.margin.bottom - 5})`)
            .style('text-anchor', 'middle')
            .text('Percentage');

        vis.chart.append('text')
            .attr('transform', `translate(${-vis.config.margin.left + 15}, ${vis.height / 2}) rotate(270)`)
            .style('text-anchor', 'middle')
            .text('Count');

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
            .attr('fill', this.selectedColor);

        legend.append('text')
            .attr('x', 20)
            .attr('y', 50)
            .text('Selected Data Points')
            .style('font-size', '12px')
            .attr('alignment-baseline', 'middle');

        // Add tooltip
        vis.tooltip = d3.select('body').append('div')
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

    renderVis() {
        let vis = this;

        // Create bins for each selected column
        let bins = vis.selectedColumn.map((col, i) => {
            return d3.histogram()
                .domain([0, 100])
                .thresholds(d3.range(0, 100, 1))
                (vis.data.map(d => d[col]))
                .map(bin => {
                    bin.x0 = bin.x0 !== undefined ? bin.x0 : bin[0];
                    bin.x1 = bin.x1 !== undefined ? bin.x1 : bin[bin.length - 1];
                    bin.column = col;
                    bin.index = i;
                    bin.fips = bin.map(d => vis.data.find(data => data[vis.selectedColumn[i]] === d).FIPS); // Add FIPS for all data points in each bin
                    return bin;
                });
        });

        let x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.width]);

        let y = d3.scaleLinear()
            .domain([0, d3.max(bins.flat(), d => d.length)])
            .range([vis.height, 0]);

        vis.chart.select('.x-axis').call(vis.xAxis);
        vis.chart.select('.y-axis').call(vis.yAxis.scale(y));

        bins.forEach((binData, i) => {
            let bars = vis.chart.selectAll(`.bar-${i}`)
                .data(binData.filter(d => d.x0 !== undefined && d.x1 !== undefined));

            bars.enter()
                .append('rect')
                .attr('class', `bar bar-${i}`)
                .merge(bars)
                .attr('x', d => x(d.x0) + (i * (x(d.x1) - x(d.x0)) / 2))
                .attr('y', d => y(d.length))
                .attr('width', d => (x(d.x1) - x(d.x0)) / 2 - 1)
                .attr('height', d => vis.height - y(d.length))
                .attr('fill', this.colors(i))
                .attr('opacity', 0.7)
                .attr('stroke', d => window.selectedCounties.some(f => d.fips.includes(f)) ? this.selectedColor : this.colors(i))
                .on('mouseover', function (event, d) {
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke', vis.mouseoverColor);
                    vis.tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    vis.tooltip.html(`Count: ${d.length}<br> Percentage range: [${d.x0}%, ${d.x1}%]`)
                        .style('left', (event.pageX + 5) + 'px')
                        .style('top', (event.pageY - 35) + 'px')
                })
                .on('mouseout', function () {
                    d3.select(this)
                        .attr('opacity', 0.7)
                        .attr('stroke', d => window.selectedCounties.some(f => d.fips.includes(f)) ? vis.selectedColor : vis.colors(d.index));
                    vis.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                })
                .on('mousedown', function (event, d) {
                    vis.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                    var e = vis.brush.extent(),
                        m = d3.pointer(vis.svg.node()), // pointer position with respect to g
                        p = [x.invert(m[0]), y.invert(m[1])]; // position in user space

                    // if there is no brush
                    if (e[0] > p[0] || p[0] > e[1]) {
                        vis.brush.extent([p, p]); // set brush to current position
                    } else {
                        d3.select(this).classed('extent', true); // else we are moving the brush, so fool d3 (I got this from looking at source code, it's how d3 determines a drag)
                    }
                    // clear all tooltips
                    d3.selectAll('.tooltip').style('opacity', 0);
                })
                .on('mouseup', function () {
                    vis.tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
            bars.exit().remove();
        });
    }

    updateData = function (data, selectedColumn, descriptions) {
        this.selectedColumn = Array.isArray(selectedColumn) ? selectedColumn : [selectedColumn];

        this.processedData = data.map(d => ({
            Xdata: d[this.selectedColumn],
            Fips: d['FIPS'],
            State: d['State'],
            County: d['County']
        }));

        this.renderVis();
    }

    // Method to add event listener
    addEventListener() {
        window.addEventListener('selectedCountiesChanged', () => {
            if (this.hasSelectedCountiesChanged()) {
                this.updateData(this.data, this.selectedColumn);
            }
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
            // Get the corresponding date range
            const dateRange = selection.map(vis.xScaleContext.invert);

            // get the fips of the selected data points
            const selectedData = vis.processedData.filter(d => d.Xdata >= dateRange[0] && d.Xdata <= dateRange[1]);

            // Update the bars in the focus chart
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

