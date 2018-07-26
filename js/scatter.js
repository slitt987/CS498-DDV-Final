function render_scatter(ds, div) {
    let margin = {top: 40, right: 0, bottom: 40, left: 60, legend_buffer: 100};
    let width = parseInt(d3.selectAll("#" + div).style("width").replace('px', '')) - margin.left - margin.right;
    let height = parseInt(d3.selectAll("#" + div).style("height").replace('px', '')) - margin.top - margin.bottom;
    let vizWidth = width - margin.legend_buffer;

    let svg = d3.select("#" + div).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "shadow")
        .attr("id", div + "-svg");

    let g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // setup the tooltip
    let tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("display", "none");

    tooltip.append("rect")
        .attr("width", 120)
        .attr("height", 45)
        .attr("fill", "#7a7a7a")
        .style("opacity", 0.5);

    tooltip.append("text")
        .style("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .text(null);

    let dataset = apply_filter(ds);

    if (dataset.length === 0) {
        svg.append("text")
            .style("text-anchor", "middle")
            .attr("x", width / 2 + (margin.left - margin.right) / 2)
            .attr("dy", height / 2)
            .attr("font-size", "40px")
            .attr("font-weight", "bold")
            .attr("fill", "#7a7a7a")
            .text("No Data For Selection")
            .style("opacity", 0)
            .transition()
            .duration(1000)
            .style("opacity", 1);
        return false;
    }

    data[control.current_scene].key_values = dataset.map(function (d) {
        return d[ds.key]
    });

    // setup menus
    filterMenuSetup(ds, div);
    metricMenuSetup(ds, div);

    let range = d3.extent(
        d3.extent(dataset, function(d) { return d.failed; })
            .concat(d3.extent(dataset, function(d) { return d.successful; }))
    );

    let x = {}, y = {};

    if (range[1] < 1000) {
        x = d3.scaleLinear().range([0, vizWidth]);
        y = d3.scaleLinear().range([height, 0]);
    } else {
        x = d3.scaleLog().range([0, vizWidth]);
        y = d3.scaleLog().range([height, 0]);
    }

    let color = d3.scaleOrdinal(d3.schemeCategory20);
    let xAxis = d3.axisBottom(x).ticks(null, ".2s");
    let yAxis = d3.axisLeft(y).ticks(null, ".2s");

    x.domain(range).nice();
    y.domain(range).nice();

    g.append("polygon")
        .attr("points", vizWidth + "," + height + " 0," + height + " " + vizWidth + ",0")
        .attr("fill", "#9f9f9f")
        .attr("opacity", .1);

    g.append("text")
        .attr("x", vizWidth / 10)
        .attr("y", height / 8)
        .attr("font-family", "sans-serif")
        .attr("font-size", 30)
        .attr("fill", "#cecece")
        .attr("opacity", .2)
        .text("Winners");

    g.append("text")
        .attr("x", vizWidth - (vizWidth / 5))
        .attr("y", height - height / 8)
        .attr("font-family", "sans-serif")
        .attr("font-size", 30)
        .attr("fill", "#cecece")
        .attr("opacity", .2)
        .text("Losers");

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", vizWidth - 5)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Failed Projects " + ds.metric_name[ds.metric]);

    g.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Successful Projects " + ds.metric_name[ds.metric])

    g.selectAll(".dot")
        .data(dataset)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 5)
        .attr("cx", 0)
        .attr("cy", function(d) { return d.successful === 0? height : y(d.successful); })
        .style("fill", function(d) { return color(d[ds.key]); })
        .on("mouseenter", function() { tooltip.style("display", null); })
        .on("mouseleave", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
            let xPosition = d3.mouse(this)[0] - 5;
            let yPosition = d3.mouse(this)[1] - 15;
            tooltip
                .attr("transform", "translate(" + xPosition + "," + yPosition + ")")
                .moveToFront();
            let tspan = tooltip
                .select("text")
                .selectAll("tspan")
                .data([
                    d[ds.key],
                    "Succ: " + round(d.successful, 2) + " " + ds.metric_name[ds.metric],
                    "Fail: " + round(d.failed, 2) + " " + ds.metric_name[ds.metric]
                ]);
            tspan.enter().append("tspan").merge(tspan)
                .text(function(d) {return d})
                .attr("dy", function(d, i) { return ( i === 0)?"1.4em":"1.7em"})
                .attr("x", +tooltip.select("rect").attr("width") / 2);
        })
        .transition()
        .duration(1000)
        .delay(function (d, i) {
            return i * 50;
        })
        .attr("cx", function(d) { return d.failed === 0 ? 0: x(d.failed); });

    let legend = g.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 10)
        .attr("width", 10)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("fill", "#cecece")
        .attr("x", width - 16)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

}