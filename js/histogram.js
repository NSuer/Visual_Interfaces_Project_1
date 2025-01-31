class Histogram {
    constructor(_config, _data, _defaultColumns, _descriptions) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 140,
            margin: { top: 50, bottom: 50, right: 50, left: 50 }
        }

        this.data = _data;
        this.selectedColumns = [];
        this.defaultColumns = _defaultColumns;
        this.title = [];

        // Call a class function
        this.updateData(this.data, this.defaultColumns, _descriptions);
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

        // Create bins for each selected column
        let bins = vis.selectedColumns.map((col, i) => {
            return d3.histogram()
                .domain([0, 100])
                .thresholds(d3.range(0, 100, 1))
                (vis.data.map(d => d[col]))
                .map(bin => {
                    bin.x0 = bin.x0 !== undefined ? bin.x0 : bin[0];
                    bin.x1 = bin.x1 !== undefined ? bin.x1 : bin[bin.length - 1];
                    bin.column = col;
                    bin.index = i;
                    return bin;
                });
        });

        // Create scales
        let x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.width]);

        let y = d3.scaleLinear()
            .domain([0, d3.max(bins.flat(), d => d.length)])
            .range([vis.height, 0]);

        // Create axes
        let xAxis = d3.axisBottom(x).tickFormat(d => d + '%');
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
            .text('Percentage');

        vis.chart.append('text')
            .attr('transform', `translate(${-vis.config.margin.left + 15}, ${vis.height / 2}) rotate(270)`)
            .style('text-anchor', 'middle')
            .text('Count');

        // Create bars for each column
        let colors = d3.scaleOrdinal([d3.schemeCategory10[0], d3.schemeCategory10[2]]);
        let mouseoverColor = d3.schemeCategory10[1];
        let selectedColor = d3.schemeCategory10[3];

        // Add legend
        let legend = vis.svg.append('g')
            .attr('transform', `translate(${vis.width - 100}, 20)`);
        legend.attr('transform', `translate(${vis.width - 100}, ${vis.height / 2 - vis.selectedColumns.length * 10})`);

        legend.selectAll('rect')
            .data(vis.selectedColumns)
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', (d, i) => i * 20)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', (d, i) => colors(i));

        legend.selectAll('text')
            .data(vis.selectedColumns)
            .enter()
            .append('text')
            .attr('x', 20)
            .attr('y', (d, i) => i * 20 + 10)
            .text(d => d)
            .style('font-size', '12px')
            .style('font-weight', 'bold');

        // Add viewing data points and selected data points to the legend
        legend.append('rect')
            .attr('x', 0)
            .attr('y', vis.selectedColumns.length * 20)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', mouseoverColor);

        legend.append('text')
            .attr('x', 20)
            .attr('y', vis.selectedColumns.length * 20 + 10)
            .text('Viewing')
            .style('font-size', '12px')
            .style('font-weight', 'bold');

        legend.append('rect')
            .attr('x', 0)
            .attr('y', vis.selectedColumns.length * 20 + 20)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', selectedColor);

        legend.append('text')
            .attr('x', 20)
            .attr('y', vis.selectedColumns.length * 20 + 30)
            .text('Selected')
            .style('font-size', '12px')
            .style('font-weight', 'bold');


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
                .attr('fill', colors(i))
                .attr('opacity', 0.7)
                .attr('stroke', colors(i))
                .on('mouseover', function (event, d) {
                    d3.select(this)
                        .attr('fill', mouseoverColor)
                        .attr('opacity', 1)
                        .attr('stroke', mouseoverColor);
                    tooltip.transition()
                        .duration(200)
                        .style('opacity', .9);
                    tooltip.html(`Count: ${d.length}<br> Percentage range: [${d.x0}%, ${d.x1}%]`)
                        .style('left', (event.pageX + 5) + 'px')
                        .style('top', (event.pageY - 35) + 'px')
                })
                .on('mouseout', function (event, d) {
                    d3.select(this)
                        .attr('fill', colors(d.index))
                        .attr('opacity', 0.7)
                        .attr('stroke', colors(d.index));
                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

            bars.exit().remove();
        });

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

    updateData = function (data, selectedColumns) {
        this.selectedColumns = selectedColumns;

        let selectedData = data.map(d => {
            let obj = {};
            this.selectedColumns.forEach(col => {
                obj[col] = d[col];
            });
            return obj;
        });

        this.data = selectedData;
        // clear then re-draw the histogram
        d3.select(this.config.parentElement).selectAll('*').remove();

        this.initVis();
    }

    // Method to add event listener
    addEventListener() {
        window.addEventListener('selectedCountiesChangedScatter', (event) => {
            this.updateData(this.data, this.selectedColumns);
        });
        window.addEventListener('selectedCountiesChangedChloropleth1', (event) => {
            this.updateData(this.data, this.selectedColumns);
        });
        window.addEventListener('selectedCountiesChangedChloropleth2', (event) => {
            this.updateData(this.data, this.selectedColumns);
        });
    }
}
