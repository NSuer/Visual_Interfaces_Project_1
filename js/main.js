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

		// get the columns
		let columns = data.columns;
		console.log('Columns in the dataset:');
		console.log(columns);

		//cut out the first row and save it as descriptions for the columns
		let descriptions = data[0];
		console.log('Descriptions of columns:');
		console.log(descriptions);
		
		data = data.slice(1);
		data.columns = columns;


		// get the max of each column
		let maxValues = {};
		columns.forEach(column => {
			maxValues[column] = d3.max(data.slice(1), d => d[column]);
		});

		console.log('Max values of each column:');
		console.log(maxValues);

		// add a new column for each column in the dataset
		columns.forEach(column => {
			let newColumn = column + '_normalized';
			data.columns.push(newColumn);
			data.forEach(d => {
				d[newColumn] = +d[column] / +maxValues[column];
			});
		});

		console.log('Data after normalization:');
		console.log(data);
		console.log('normalized columns:');
		console.log(data.columns);

		histogramData = data;
		scatterData = data;
		chloropleth1Data = data;
		chloropleth2Data = data;

		// Histogram
		let histogram = new Histogram({
			'parentElement': '#histogram',
			'containerHeight': 1100,
			'containerWidth': 1000
		}, histogramData);

		// Scatterplot
		let scatterplot = new Scatterplot({
			'parentElement': '#scatterplot',
			'containerHeight': 1100,
			'containerWidth': 1000
		}, scatterData);

		// Chloropleth Map
		let chloropleth1 = new Chloropleth({
			'parentElement': '#chloropleth1',
			'containerHeight': 1100,
			'containerWidth': 1000
		}, chloropleth1Data);

		let chloropleth2 = new Chloropleth({
			'parentElement': '#chloropleth2',
			'containerHeight': 1100,
			'containerWidth': 1000
		}, chloropleth2Data);

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

		// Create dropdown for Scatterplot X-axis
		d3.select('#scatterplot-x-dropdown')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		// Create dropdown for Scatterplot Y-axis
		d3.select('#scatterplot-y-dropdown')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		// Create dropdown for Chloropleth Map
		d3.select('#chloropleth-dropdown1')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#chloropleth-dropdown2')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		// Event listeners for dropdowns to update graphs
		d3.select('#histogram-dropdown').on('change', function() {
			let selectedColumn = d3.select(this).property('value');
			histogram.updateData(data, selectedColumn);
		});

		d3.select('#scatterplot-x-dropdown').on('change', function() {
			let selectedXColumn = d3.select(this).property('value');
			let selectedYColumn = d3.select('#scatterplot-y-dropdown').property('value');
			scatterplot.updateData(data, selectedXColumn, selectedYColumn);
		});

		d3.select('#scatterplot-y-dropdown').on('change', function() {
			let selectedXColumn = d3.select('#scatterplot-x-dropdown').property('value');
			let selectedYColumn = d3.select(this).property('value');
			scatterplot.updateData(data, selectedXColumn, selectedYColumn);
		});

		d3.select('#chloropleth-dropdown1').on('change', function() {
			let selectedColumn = d3.select(this).property('value');
			chloropleth1.updateData(data, selectedColumn);
		});

		d3.select('#chloropleth-dropdown2').on('change', function() {
			let selectedColumn = d3.select(this).property('value');
			chloropleth2.updateData(data, selectedColumn);
		});

	})
	.catch(error => {
		console.log('Error loading the data');
		console.log(error);
	});


