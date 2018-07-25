function render_scatter(ds, div) {
    let margin = {top: 40, right: 0, bottom: 40, left: 60};
    let width = parseInt(d3.selectAll("#" + div).style("width").replace('px', '')) - margin.left - margin.right;
    let height = parseInt(d3.selectAll("#" + div).style("height").replace('px', '')) - margin.top - margin.bottom;

    let x = d3.scaleLinear()
        .range([0, width]);

    let y = d3.scaleLinear()
        .range([height, 0]);

    let color = d3.scaleOrdinal(d3.schemeCategory20);
    let xAxis = d3.axisBottom(x);
    let yAxis = d3.axisLeft(y);

    console.log(JSON.stringify([width, height]));
    let svg = d3.select("#" + div).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "shadow")
        .attr("id", div + "-svg");

    let dataset = apply_filter(ds);

    data[control.current_scene].key_values = dataset.map(function (d) {
        return d[ds.key]
    });
/*
    console.log(JSON.stringify(ds.filter));
    console.log(JSON.stringify(width));
    console.log(JSON.stringify(height));
    console.log(JSON.stringify(dataset));
    console.log(JSON.stringify(ds.key));
    console.log(JSON.stringify(data[control.current_scene].key_values));
    */
    console.log(JSON.stringify([width, height]));

    // setup menus
    filterMenuSetup(ds, div);
    metricMenuSetup(ds, div);

    let g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(dataset, function(d) { return d.failed; })).nice();
    y.domain(d3.extent(dataset, function(d) { return d.successful; })).nice();
    console.log(JSON.stringify([width, height]));

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
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
        .attr("cy", function(d) { return y(d.successful); })
        .transition()
        .duration(1000)
        .delay(function (d, i) {
            return i * 50;
        })
        .attr("cx", function(d) { return x(d.failed); })
        .style("fill", function(d) { return color(d[ds.key]); });

    let legend = g.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

}