function render_scatter(ds, div) {
    let margin = {top: 40, right: 0, bottom: 17, left: 40};
    let width = parseInt(d3.selectAll("#" + div).style("width").replace('px', '')) - margin.left - margin.right;
    let height = parseInt(d3.selectAll("#" + div).style("height").replace('px', '')) - margin.top - margin.bottom;

    let x = d3.scaleLinear()
        .range([0, width]);

    let y = d3.scaleLinear()
        .range([height, 0]);

    let color = d3.scaleOrdinal(d3.schemeCategory20);
    let xAxis = d3.axisBottom(x);
    let yAxis = d3.axisLeft(y);

    let svg = d3.select("#" + div).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "shadow")
        .attr("id", div + "-svg");

    let g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(data, function(d) { return d.sepalWidth; })).nice();
    y.domain(d3.extent(data, function(d) { return d.sepalLength; })).nice();

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Sepal Width (cm)");

    g.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Sepal Length (cm)")

    g.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", function(d) { return x(d.sepalWidth); })
        .attr("cy", function(d) { return y(d.sepalLength); })
        .style("fill", function(d) { return color(d.species); });

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