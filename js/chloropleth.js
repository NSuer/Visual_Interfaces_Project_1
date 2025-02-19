class Chloropleth {
    constructor(_config, _data, _defaultColumn, _descriptions) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 140,
            margin: { top: 50, bottom: 50, right: 50, left: 50 }
        }

        this.data = _data;
        this.selectedColumn = '';
        this.defaultColumn = _defaultColumn;
        this.processedData = [];

        this.title = [];

        this.addEventListener();
        // Load GeoJSON data
        d3.json('data/counties.geojson').then(geoData => {
            this.geoData = geoData;
            this.updateData(this.data, this.defaultColumn, _descriptions);
        });
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

        // Create map projection
        vis.map = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        // Create color scale
        vis.color = d3.scaleSequential(d3.interpolateTurbo);

        // Create tooltip
        vis.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);


        // Create legend 
        // the legend should be a gradient from 0 to 1 with the color as well as showing the viewing and selected color

        // Create a color scale
        vis.color = d3.scaleSequential(d3.interpolateTurbo)
            .domain([0, 1]);

        // Create a legend
        vis.legend = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width + vis.config.margin.left + 20}, ${vis.config.margin.top})`);

        // Create a gradient
        vis.legend.append('defs')
            .append('linearGradient')
            .attr('id', 'gradient')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%')
            .selectAll('stop')
            .data(d3.ticks(0, 1, 10))
            .enter()
            .append('stop')
            .attr('offset', d => `${100 * d}%`)
            .attr('stop-color', d => vis.color(d));

        // Create a rectangle with the gradient
        vis.legend.append('rect')
            .attr('width', 20)
            .attr('height', vis.height)
            .style('fill', 'url(#gradient)');

        // Add text for the minimum value
        vis.legend.append('text')
            .attr('x', -30)
            .attr('y', vis.height)
            .text('0%');

        // Add text for the maximum value
        vis.legend.append('text')
            .attr('x', -10)
            .attr('y', 10)
            .attr('text-anchor', 'end')
            .text('100 %');

        // Add text for the viewing color
        vis.legend.append('text')
            .attr('x', -110)
            .attr('y', vis.height / 2 - 10)
            .attr('text-anchor', 'start')
            .text('Viewing Color');

        // Add rectangle for the viewing color
        vis.legend.append('rect')
            .attr('x', -130)
            .attr('y', vis.height / 2 - 20)
            .attr('width', 20)
            .attr('height', 10)
            .style('fill', d3.schemeCategory10[1]);

        // Create projection
        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale([700]);

        // Create path
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Merge the data with the GeoJSON based on FIPS code
        vis.geoData.features.forEach(function (feature) {
            const fips = feature.properties.GEOID;  // Assuming GEOID is the FIPS code in GeoJSON
            const dataEntry = vis.processedData.find(d => d.Fips === fips);

            if (dataEntry) {
                feature.properties.value = dataEntry.corrected_data; // Add the data value to the GeoJSON feature
                feature.properties.data = dataEntry.data;
                feature.properties.county = dataEntry.County;
                feature.properties.state = dataEntry.State;
            } else {
                feature.properties.value = 0; // Default value if not found
            }
        });

        // Plot the map with filled color
        // Create an area at the bottom for displaying information
        vis.infoArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left + 30}, ${vis.height + vis.config.margin.top + 50})`);

        vis.infoText = vis.infoArea.append('text')
            .attr('class', 'info-text')
            .attr('x', vis.width / 2)
            .attr('y', -this.config.containerHeight + 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#000');

        vis.map.selectAll('path')
            .data(vis.geoData.features)
            .enter()
            .append('path')
            .attr('d', vis.path)
            .style('fill', function (d) {
            let value = d.properties.value;
            if (window.selectedCounties && window.selectedCounties.length > 0) {
                return window.selectedCounties.includes(d.properties.GEOID) ? (value ? vis.color(value) : '#ccc') : '#e0e0e0'; // Grey out unselected counties
            } else {
                return value ? vis.color(value) : '#ccc'; // Default color for missing data
            }
            })
            .on('mouseover', function (event, d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style('stroke', d3.schemeCategory10[1]);

            vis.infoText.text(`FIPS: ${d.properties.GEOID} | State: ${d.properties.state} | County: ${d.properties.county} | Percentage: ${d.properties.data}%`);
            })
            .on('mouseout', function (event, d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style('stroke', function (d) {
                let value = d.properties.value;
                if (window.selectedCounties && window.selectedCounties.length > 0) {
                    return window.selectedCounties.includes(d.properties.GEOID) ? (value ? vis.color(value) : '#ccc') : '#e0e0e0'; // Grey out unselected counties
                } else {
                    return value ? vis.color(value) : '#ccc'; // Default color for missing data
                }
                });

            vis.infoText.text('');
            });
    }

    updateData(data, selectedColumn, descriptions) {
        this.selectedColumn = selectedColumn;

        // I need to fix the data so that it is imbetween 0 and 1 not 0 and 100
        this.processedData = data.map(d => ({
            corrected_data: d[this.selectedColumn] / 100,
            data: d[this.selectedColumn],
            Fips: d['FIPS'],
            State: d['State'],
            County: d['County']
        }));

        // Clear then re-draw the map
        d3.select(this.config.parentElement).selectAll('*').remove();

        this.initVis();
    }

    // Method to add event listener
    addEventListener() {
        window.addEventListener('selectedCountiesChanged', (event) => {
            this.updateData(this.data, this.selectedColumn);
        });
    }
}
