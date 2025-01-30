class Chloropleth {
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
        this.processedData = [];
        // Load GeoJSON data
        d3.json('data/counties.geojson').then(geoData => {
            this.geoData = geoData;
            console.log('geoData:', this.geoData);
            console.log('Choropleth default column:', this.defaultColumn);
            this.updateData(this.data, this.defaultColumn);
        });
    }

    initVis() {
        let vis = this;

        console.log('Initializing choropleth');
        console.log(vis.processedData);

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
        vis.color = d3.scaleQuantize()
            .range(d3.schemeBlues[9]);

        // Create tooltip
        vis.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        // Create legend
        vis.legend = vis.svg.append('g')
            .attr('transform', `translate(${vis.width - 100}, ${vis.height - 20})`);

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

        console.log('GeoData with values:', vis.geoData);

        // Plot the map with filled color
        // Create an area at the bottom for displaying information
        vis.infoArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left + 30}, ${vis.height + vis.config.margin.top + 50})`);

        vis.infoText = vis.infoArea.append('text')
            .attr('class', 'info-text')
            .attr('x', vis.width / 2)
            .attr('y', -this.config.containerHeight + 10 )
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
            return value ? vis.color(value) : '#ccc'; // Default color for missing data
            })
            .on('mouseover', function (event, d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style('fill', 'orange');

            vis.infoText.text(`FIPS: ${d.properties.GEOID} | State: ${d.properties.state} | County: ${d.properties.county} | Percentage: ${d.properties.data}%`);
            })
            .on('mouseout', function (event, d) {
            d3.select(this)
                .transition()
                .duration(100)
                .style('fill', function (d) {
                let value = d.properties.value;
                return value ? vis.color(value) : '#ccc';
                });

            vis.infoText.text('');
            });
    }

    updateData(data, selectedColumn) {
        this.selectedColumn = selectedColumn;

        // I need to fix the data so that it is imbetween 0 and 1 not 0 and 100
        this.processedData = data.map(d => ({
            corrected_data: d[this.selectedColumn] /10,
            data: d[this.selectedColumn],
            Fips: d['FIPS'],
            State: d['State'],
            County: d['County']
        }));

        // Clear then re-draw the map
        d3.select(this.config.parentElement).selectAll('*').remove();

        this.initVis();
    }
}
