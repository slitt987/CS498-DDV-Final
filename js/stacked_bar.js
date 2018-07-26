function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function stacked_bar_annontate_helper(svg, g, key, text){
    let bar = {};
    let margin = {top: 40, right: 20, bottom: 30, left: 40};
    let sizing = {length: 15, padding: 4, height: 23, width: 100};

    svg.select("#chart")
        .selectAll("g").each(function(d) {
        bar = d3.select(this);
    });

    // first find the data the stack
    let annotationXY = [];
    let ds = data[control.current_scene];
    bar.selectAll("rect")
        .filter(function(d, i) {
            return ds.key_values[i] === key
        })
        .each(function(d, i) {
            annotationXY = {
                x: +d3.select(this).attr("x") + margin.left,
                y: +d3.select(this).attr("y") + margin.top,
                w: +d3.select(this).attr("width")
            }
        });

    annotationXY.x = annotationXY.x + (annotationXY.w / 2);

    g.append("line")
        .attr("stroke", "#c8223a")
        .attr("stroke-width", 2)
        .attr("x1", annotationXY.x)
        .attr("y1", annotationXY.y - sizing.length - sizing.padding)
        .attr("x2", annotationXY.x)
        .attr("y2", annotationXY.y - sizing.padding);

    let x = annotationXY.x - (sizing.width / 2);
    let y = annotationXY.y - sizing.height - sizing.length - (2 * sizing.padding);

    g = g.append("g")
        .attr("transform","translate(" + x + "," + y + ")");

    g.append("rect")
        .attr("width", sizing.width)
        .attr("height", sizing.height)
        .attr("fill", "#7a7a7a")
        .style("opacity", 0.5)
        .text("foo");

    g.append("text")
        .style("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .selectAll("tspan")
        .data(text)
        .enter().append("tspan")
        .attr("x", sizing.width / 2)
        .attr("dy", "1.12em")
        .text(function(d) {return d});
}

function stacked_bar_annotate () {
    let div = control[control.current_scene].div_id;
    let svg = d3.select("#" + div + "-svg");

    svg.select(".svg-annotation").remove();
    let g = svg.append("g")
        .attr("class", "svg-annotation")
        .attr("opacity", 0);

    if ("annotations" in data[control.current_scene]) {
        data[control.current_scene].annotations
            .filter(function (d) {return data[control.current_scene].key_values.includes(d.key)})
            .forEach(function (d) {
                stacked_bar_annontate_helper(svg, g, d.key, d.text);
            })
    }

    g.moveToFront()
        .transition()
        .duration(500)
        .attr("opacity", 1);
}

function render_stacked_bar(ds, div) {
    let margin = {top: 40, right: 0, bottom: 17, left: 40};
    let width = parseInt(d3.selectAll("#" + div).style("width").replace('px', '')) - margin.left - margin.right;
    let height = parseInt(d3.selectAll("#" + div).style("height").replace('px', '')) - margin.top - margin.bottom;

    let svg = d3.select("#" + div).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "shadow")
        .attr("id", div + "-svg");

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // setup the tooltip
    let tooltip = svg.append("g")
        .attr("class", "tooltip")
        .style("display", "none");

    tooltip.append("rect")
        .attr("width", 90)
        .attr("height", 30)
        .attr("fill", "#7a7a7a")
        .style("opacity", 0.5);

    tooltip.append("text")
        .style("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .text(null);

    // set scales
    let x = d3.scaleBand()
        .rangeRound([0, width - 123])
        .paddingInner(0.05)
        .align(0.1);
    let y = d3.scaleLinear()
        .rangeRound([height, 0]);
    let z = d3.scaleOrdinal(d3.schemeCategory20);

    let dataset = apply_filter(ds);

    data[control.current_scene].key_values = dataset.map(function (d) {
        return d[ds.key]
    });

    // setup menus
    filterMenuSetup(ds, div);
    metricMenuSetup(ds, div);

    // setup the dataset
    let keys = ds.sorted_keys;
    let max_metric_sum = d3.max(dataset, function(d) {
        return d3.sum(keys, function(k) {
            return d[k];
        });
    });

    // Render the vis
    x.domain(dataset.map(function(d) { return d[ds.key]; }));
    y.domain([0, max_metric_sum]).nice();
    z.domain(keys);
    g.append("g")
        .attr("id", "chart")
        .selectAll("g")
        .data(d3.stack().keys(keys)(dataset))
        .enter().append("g")
        .attr("fill", function(d) { return z(d.key); })
        .on("mouseenter", function() { tooltip.style("display", null); })
        .on("mouseleave", function() { tooltip.style("display", "none"); })
        .on("mousemove", function(d) {
            let xPosition = d3.mouse(this)[0] - 5;
            let yPosition = d3.mouse(this)[1] - 1;
            let elements = document.querySelectorAll(':hover');
            element = elements[elements.length - 1].__data__;
            value = element[1] - element[0];
            tooltip
                .attr("transform", "translate(" + xPosition + "," + yPosition + ")")
                .moveToFront();
            let tspan = tooltip
                .select("text")
                .selectAll("tspan")
                .data([d.key, round(value, 2) + " " + ds.metric_name[ds.metric]]);

            tspan.enter().append("tspan").merge(tspan)
                .text(function(d) {return d})
                .attr("dy", function(d, i) { return ( i === 0)?"1.4em":"1.7em"})
                .attr("x", +tooltip.select("rect").attr("width") / 2);
        })
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("x", function(d) { return x(d.data[ds.key]); })
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .transition()
        .duration(1000)
        .on("end", stacked_bar_annotate)
        .delay(function (d, i) {
            return i * 50;
        })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        ;

    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#cecece")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text(ds.metric_name[ds.metric]);

    // Setup the legend
    var legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("fill", "#cecece")
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 10)
        .attr("width", 10)
        .attr("height", 19)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width - 15)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });
}