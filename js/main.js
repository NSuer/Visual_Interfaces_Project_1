console.log("Hello world");

let histogramData = {};
let scatterData = {};
let chloropleth1Data = {};
let chloropleth2Data = {};

d3.csv('data/MyData.csv')
	.then(data => {
		console.log('Data loading complete. Work with dataset. HI THERE');
		console.log(data);

		//process the data 
		// For each column a max should be calculated
		// using the min and max, each value should be mapped to a value between 0 and 1 in a new column

		// get the columns that include percentages or rates, given by 'pct' or 'rate' either uppercase or lowercase
		let columns = data.columns.filter(column => column.toLowerCase().includes('pct') || column.toLowerCase().includes('rate') || column.toLowerCase().includes('deep'));
		console.log('Columns in the dataset:');
		console.log(columns);

		// remove the columns that are not percentages except for the FIPS, State, and County columns
		data = data.map(row => {
			let newRow = {};
			Object.keys(row).forEach(key => {
				if (key === 'FIPS' || key === 'State' || key === 'County' || columns.includes(key)) {
					newRow[key] = row[key];
				}
			});
			return newRow;
		});

		//cut out the first row and save it as descriptions for the columns
		let descriptions = data[0];
		console.log('Descriptions of columns:');
		console.log(descriptions);

		data = data.slice(1);
		data.columns = columns;

		histogramData = data;
		scatterData = data;
		chloropleth1Data = data;
		chloropleth2Data = data;

		// Histogram
		let histogramContainer = d3.select('#histogram').node().getBoundingClientRect();
		let scatterplotContainer = d3.select('#scatterplot').node().getBoundingClientRect();
		let chloropleth1Container = d3.select('#chloropleth1').node().getBoundingClientRect();
		let chloropleth2Container = d3.select('#chloropleth2').node().getBoundingClientRect();

		let defaultHistogramColumn = 'Deep_Pov_All';
		let defaultScatterColumns = ['Deep_Pov_All', 'Vets18OPct'];
		let defaultChloroplethColumns = ['Deep_Pov_All', 'Vets18OPct'];

		let histogram = new Histogram({
			'parentElement': '#histogram',
			'containerHeight': histogramContainer.height,
			'containerWidth': histogramContainer.width
		}, histogramData, defaultHistogramColumn);

		// Scatterplot
		let scatterplot = new Scatterplot({
			'parentElement': '#scatterplot',
			'containerHeight': scatterplotContainer.height,
			'containerWidth': scatterplotContainer.width,
		}, scatterData, defaultScatterColumns);

		let chloropleth1 = new Chloropleth({
			'parentElement': '#chloropleth1',
			'containerHeight': chloropleth1Container.height,
			'containerWidth': chloropleth1Container.width
		}, chloropleth1Data, defaultChloroplethColumns[0]);
		// Chloropleth Map

		let chloropleth2 = new Chloropleth({
			'parentElement': '#chloropleth2',
			'containerHeight': chloropleth2Container.height,
			'containerWidth': chloropleth2Container.width
		}, chloropleth2Data, defaultChloroplethColumns[1]);

		// Create dropdowns for each graph
		const columnsDropdown = columns.filter(column => column !== 'FIPS' && column !== 'State' && column !== 'County');

		// Create dropdown for Histogram
		d3.select('#histogram-dropdown')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#histogram-dropdown').property('value', defaultHistogramColumn);
		d3.select('#histogram-description').text(descriptions[defaultHistogramColumn]);

		// Create dropdown for Scatterplot X-axis
		d3.select('#scatterplot-x-dropdown')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#scatterplot-x-dropdown').property('value', defaultScatterColumns[0]);
		d3.select('#scatterplot-x-description').text(descriptions[defaultScatterColumns[0]]);

		// Create dropdown for Scatterplot Y-axis
		d3.select('#scatterplot-y-dropdown')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#scatterplot-y-dropdown').property('value', defaultScatterColumns[1]);
		d3.select('#scatterplot-y-description').text(descriptions[defaultScatterColumns[1]]);

		// Create dropdown for Chloropleth Map
		d3.select('#chloropleth-dropdown1')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#chloropleth-dropdown1').property('value', defaultChloroplethColumns[0]);
		d3.select('#chloropleth-description1').text(descriptions[defaultChloroplethColumns[0]]);

		d3.select('#chloropleth-dropdown2')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#chloropleth-dropdown2').property('value', defaultChloroplethColumns[1]);
		d3.select('#chloropleth-description2').text(descriptions[defaultChloroplethColumns[1]]);

		// Event listeners for dropdowns to update graphs and descriptions
		d3.select('#histogram-dropdown').on('change', function () {
			let selectedColumn = d3.select(this).property('value');
			histogram.updateData(data, selectedColumn);
			d3.select('#histogram-description').text(descriptions[selectedColumn]);
		});

		d3.select('#scatterplot-x-dropdown').on('change', function () {
			let selectedXColumn = d3.select(this).property('value');
			let selectedYColumn = d3.select('#scatterplot-y-dropdown').property('value');
			scatterplot.updateData(data, selectedXColumn, selectedYColumn);
			d3.select('#scatterplot-x-description').text(descriptions[selectedXColumn]);
		});

		d3.select('#scatterplot-y-dropdown').on('change', function () {
			let selectedXColumn = d3.select('#scatterplot-x-dropdown').property('value');
			let selectedYColumn = d3.select(this).property('value');
			scatterplot.updateData(data, selectedXColumn, selectedYColumn);
			d3.select('#scatterplot-y-description').text(descriptions[selectedYColumn]);
		});

		d3.select('#chloropleth-dropdown1').on('change', function () {
			let selectedColumn = d3.select(this).property('value');
			chloropleth1.updateData(data, selectedColumn);
			d3.select('#chloropleth-description1').text(descriptions[selectedColumn]);
		});

		d3.select('#chloropleth-dropdown2').on('change', function () {
			let selectedColumn = d3.select(this).property('value');
			chloropleth2.updateData(data, selectedColumn);
			d3.select('#chloropleth-description2').text(descriptions[selectedColumn]);
		});

	})
	.catch(error => {
		console.log('Error loading the data');
		console.log(error);
	});


