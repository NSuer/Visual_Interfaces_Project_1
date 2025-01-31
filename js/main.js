let histogramData = {};
let scatterData = {};
let chloropleth1Data = {};
let chloropleth2Data = {};
window.selectedCounties = [];
window.allCounties = [];

d3.csv('data/MyData.csv')
	.then(data => {

		//process the data 
		// For each column a max should be calculated
		// using the min and max, each value should be mapped to a value between 0 and 1 in a new column

		// get the columns that include percentages or rates, given by 'pct' or 'rate' either uppercase or lowercase
		let columns = data.columns.filter(column => column.toLowerCase().includes('pct') || column.toLowerCase().includes('rate') || column.toLowerCase().includes('deep'));

		// Set selectedCounties and allCounties to all the counties in the dataset
		window.selectedCounties = data.map(d => d.FIPS);
		window.allCounties = data.map(d => d.FIPS);

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

		let defaultColumns = ['Deep_Pov_All', 'Vets18OPct'];

		d3.select('#histogram-title').text(`Histogram: ${descriptions[defaultColumns[0]]} and ${descriptions[defaultColumns[1]]}`);
		d3.select('#scatterplot-title').text(`Scatterplot: ${descriptions[defaultColumns[0]]} and ${descriptions[defaultColumns[1]]}`);
		d3.select('#chloropleth1-title').text(`Choropleth Map 1: ${descriptions[defaultColumns[0]]}`);
		d3.select('#chloropleth2-title').text(`Choropleth Map 2: ${descriptions[defaultColumns[1]]}`);

		let histogram = new Histogram({
			'parentElement': '#histogram',
			'containerHeight': histogramContainer.height,
			'containerWidth': histogramContainer.width
		}, histogramData, defaultColumns, descriptions);

		// Scatterplot
		let scatterplot = new Scatterplot({
			'parentElement': '#scatterplot',
			'containerHeight': scatterplotContainer.height,
			'containerWidth': scatterplotContainer.width,
		}, scatterData, defaultColumns, descriptions);

		let chloropleth1 = new Chloropleth({
			'parentElement': '#chloropleth1',
			'containerHeight': chloropleth1Container.height,
			'containerWidth': chloropleth1Container.width
		}, chloropleth1Data, defaultColumns[0], descriptions);
		// Chloropleth Map

		let chloropleth2 = new Chloropleth({
			'parentElement': '#chloropleth2',
			'containerHeight': chloropleth2Container.height,
			'containerWidth': chloropleth2Container.width
		}, chloropleth2Data, defaultColumns[1], descriptions);

		// Create dropdowns for each graph
		const columnsDropdown = columns.filter(column => column !== 'FIPS' && column !== 'State' && column !== 'County');

		// Create 1st dropdown for all graphs
		d3.select('#dataSelector1')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#dataSelector1').property('value', defaultColumns[0]);
		d3.select('#dataSelector1-description').text(descriptions[defaultColumns[0]]);

		// Create 2nd dropdown for all graphs
		d3.select('#dataSelector2')
			.selectAll('option')
			.data(columnsDropdown)
			.enter()
			.append('option')
			.text(d => d)
			.attr('value', d => d);

		d3.select('#dataSelector2').property('value', defaultColumns[1]);
		d3.select('#dataSelector2-description').text(descriptions[defaultColumns[1]]);

		// Event listeners for dropdowns to update graphs and descriptions
		d3.select('#dataSelector1').on('change', function () {
			let selectedColumn1 = d3.select(this).property('value');
			let selectedColumn2 = d3.select('#dataSelector2').property('value');

			histogram.updateData(data, [selectedColumn1, selectedColumn2], descriptions);
			scatterplot.updateData(data, selectedColumn1, selectedColumn2, descriptions);
			chloropleth1.updateData(data, selectedColumn1, descriptions);
			chloropleth2.updateData(data, selectedColumn2, descriptions);

			d3.select('#dataSelector1-description').text(descriptions[selectedColumn1]);
			d3.select('#dataSelector2-description').text(descriptions[selectedColumn2]);

			d3.select('#histogram-title').text(`Histogram: ${descriptions[selectedColumn1]} and ${descriptions[selectedColumn2]}`);
			d3.select('#scatterplot-title').text(`Scatterplot: ${descriptions[selectedColumn1]} and ${descriptions[selectedColumn2]}`);
			d3.select('#chloropleth1-title').text(`Choropleth Map 1: ${descriptions[selectedColumn1]}`);
			d3.select('#chloropleth2-title').text(`Choropleth Map 2: ${descriptions[selectedColumn2]}`);
		});

		d3.select('#dataSelector2').on('change', function () {
			let selectedColumn1 = d3.select('#dataSelector1').property('value');
			let selectedColumn2 = d3.select(this).property('value');

			histogram.updateData(data, [selectedColumn1, selectedColumn2]);
			scatterplot.updateData(data, selectedColumn1, selectedColumn2);
			chloropleth1.updateData(data, selectedColumn1);
			chloropleth2.updateData(data, selectedColumn2);

			d3.select('#dataSelector1-description').text(descriptions[selectedColumn1]);
			d3.select('#dataSelector2-description').text(descriptions[selectedColumn2]);

			d3.select('#histogram-title').text(`Histogram: ${descriptions[selectedColumn1]} and ${descriptions[selectedColumn2]}`);
			d3.select('#scatterplot-title').text(`Scatterplot: ${descriptions[selectedColumn1]} and ${descriptions[selectedColumn2]}`);
			d3.select('#chloropleth1-title').text(`Choropleth Map 1: ${descriptions[selectedColumn1]}`);
			d3.select('#chloropleth2-title').text(`Choropleth Map 2: ${descriptions[selectedColumn2]}`);
		});

	})
	.catch(error => {
		console.log('Error loading the data');
		console.log(error);
	});
