import React, { useEffect, useState } from "react";
import noteFrequencyTable from "../utils/noteFrequencyTable";
import * as d3 from "d3";

// eslint-disable-next-line react/prop-types
const PitchGraph = ({ frequency, spacing, range, accidentals }) => {

	const [svgWidth, setSvgWidth] = useState(0);

	useEffect(() => {
		const onResize = () => {
			setSvgWidth(Math.min(window.innerWidth, 1200));
		}

		window.addEventListener("resize", onResize);
		onResize();

		return () => window.removeEventListener("resize", onResize);
	}, []);
	// const margin = { top: 20, right: 50, bottom: 30, left: 50 };
	const margin = { top: 5, right: 50, bottom: 5, left: 50 };
	var height_abs;
	if (spacing === "small") {
		// height_abs = 500;
		height_abs = window.innerHeight * .35;
	} else if (spacing === "medium") {
		// height_abs = 800;
		height_abs = window.innerHeight * .4;
	} else {
		// height_abs = 1100;
		height_abs = window.innerHeight * .45 ;
	}
	const height = height_abs - margin.top - margin.bottom;


	let noteFrequencyTableRange;


	if (range === "low") {
		noteFrequencyTableRange = noteFrequencyTable.slice(0, 36);
	} else {
		noteFrequencyTableRange = noteFrequencyTable.slice(12, 48);
	}
	let minFreq = noteFrequencyTableRange[0][1];
	let maxFreq =
		noteFrequencyTableRange[noteFrequencyTableRange.length - 1][1];
	let minTime = -5;
	let noteFrequencyMap = new Map(noteFrequencyTableRange);
	let frequencies = Array.from(noteFrequencyMap.values());
	const [data, setData] = useState([]);



	let yScale = d3.scaleLog().domain([minFreq, maxFreq]).range([height, 0]);

	let yScaleRight = d3
		.scaleLog()
		.domain([minFreq, maxFreq])
		.range([height, 0]);



	const updateData = () => {
		// Increment time values by 1
		let newData = data.map((d) => [d[0] - 0.1, d[1]]);
		// newData = newData.filter(d => d[0] <= frequency && d[1] >= frequency)
		newData = newData.map(d => {
			if (+d[1] < minFreq) d[1] = minFreq
			if (+d[1] > maxFreq) d[1] = maxFreq
			return d
		})
		// Add current value of frequency prop to data
		if (frequency > minFreq && frequency < maxFreq) {
			newData = [...newData, [0, frequency]];
		}
		// Discard data with time values lower than minTime
		newData = newData.filter((d) => d[0] >= minTime);

		setData(newData);
	};

	const drawGraph = () => {

		d3.select("g").remove(); // remove previous graphs

		// edit
		const width = svgWidth - margin.left - margin.right;
		const xScale = d3.scaleLinear().domain([minTime, 0]).range([0, width]);

		const line = d3
			.line()
			.x((d) => xScale(d[0]))
			.y((d) => yScale(d[1]))
			.curve(d3.curveMonotoneX);
		// edit

		const svg = d3
			.select(".graph")
			.attr("height", height + margin.top + margin.bottom)
			.attr("width", width + margin.left + margin.right);

		const g = svg
			.append("g")
			.attr("transform", `translate(${margin.left}, ${margin.top})`);

		// add horizontal lines across the chart that alternate in opacity for each tick of the y-axis
		g.selectAll(".horizontal-lines")
			.data(frequencies)
			.enter()
			.append("line")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", (frequency) => yScaleRight(frequency))
			.attr("y2", (frequency) => yScaleRight(frequency))
			.style("stroke", "#ccc")
			.style("opacity", (frequency, i) => (i % 2 === 0 ? 0.2 : 0.6));

		g.append("g")
			.attr("class", "x axis")
			.attr("transform", `translate(0, ${height})`)
			.call(d3.axisBottom(xScale).tickSize(0).tickFormat(""));

		g.append("g")
			.attr("class", "y axis")
			.call(
				d3
					.axisLeft(yScale)
					.tickValues(frequencies)
					.tickFormat((d) => {
						for (
							let i = 0;
							i < noteFrequencyTableRange.length;
							i++
						) {
							if (noteFrequencyTableRange[i][1] === d) {
								return noteFrequencyTableRange[i][1];
							}
						}
					})
			);

		g.append("g")
			.attr("class", "y axis right")
			.attr("transform", `translate(${width}, 0)`)
			.call(
				d3
					.axisRight(yScaleRight)
					.tickValues(frequencies)
					.tickFormat((d) => {
						for (
							let i = 0;
							i < noteFrequencyTableRange.length;
							i++
						) {
							if (noteFrequencyTableRange[i][1] === d) {
								if (
									noteFrequencyTableRange[i][0].length > 2 &&
									accidentals == "sharp"
								) {
									return noteFrequencyTableRange[i][0].slice(
										0,
										3
									);
								} else if (
									noteFrequencyTableRange[i][0].length > 2 &&
									accidentals == "flat"
								) {
									return noteFrequencyTableRange[i][0].slice(
										4,
										7
									);
								}
								return noteFrequencyTableRange[i][0];
							}
						}
					})
			);

		g.append("path")
			.datum(data)
			.attr("class", "line")
			.attr("d", line)
			.attr("fill", "none")
			// green
			.attr("stroke", "red")
			.attr("stroke-width", "2.5");
	};

	const updateFre = () => {
		const range = 7
		let midpoint = noteFrequencyTable.findIndex(item => item[1] >= frequency)
		if (midpoint === -1) midpoint = noteFrequencyTable.length - 1

		let startIndex = Math.max(0, midpoint - range)
		let endIndex = Math.min(noteFrequencyTable.length, midpoint + range)

		let diff = endIndex - startIndex
		if (diff !== 2 * range) {
			if (midpoint < range) {
				endIndex += range - midpoint
			} else {
				startIndex -= (range - (noteFrequencyTable.length - midpoint))
			}
		}
		noteFrequencyTableRange = noteFrequencyTable.slice(startIndex, endIndex)
		minFreq = noteFrequencyTableRange[0][1];
		maxFreq = noteFrequencyTableRange[noteFrequencyTableRange.length - 1][1];
		noteFrequencyMap = new Map(noteFrequencyTableRange);
		frequencies = Array.from(noteFrequencyMap.values());


		yScale = d3.scaleLog().domain([minFreq, maxFreq]).range([height, 0]);
		yScaleRight = d3
			.scaleLog()
			.domain([minFreq, maxFreq])
			.range([height, 0]);
	}
	useEffect(() => {
		updateFre()
		updateData();
		drawGraph();
	}, [frequency, spacing, range, accidentals, svgWidth]);

	return <svg className="graph mx-auto"></svg>;
};

export default PitchGraph;
