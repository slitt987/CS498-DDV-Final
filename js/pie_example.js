function render_scene1(d, div) {
    let pie=d3.pie()
        .value(function(d){return parseFloat(d.percent)})
        .sort(null)
        .padAngle(.03);

    let w = parseInt(d3.selectAll("#" + div).style("width").replace('px', ''));
    let h = parseInt(d3.selectAll("#" + div).style("height"));

    let outerRadius=w/2;
    let innerRadius=100;

    let color = d3.scaleOrdinal(d3.schemeCategory20);

    let arc=d3.arc()
        .outerRadius(outerRadius)
        .innerRadius(innerRadius);

    let svg=d3.select("#" + div)
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "shadow")
        .attr("id", div + "-svg")
        .append('g')
        .attr("transform", "translate(" + w/2 + "," + h/2 + ")");
    let path=svg.selectAll('path')
        .data(pie(d))
        .enter()
        .append('path')
        .attr("d", arc)
        .attr("fill", function (d,i) {
            return color(d.data.name);
        });

    path.transition()
        .duration(1000)
        .attrTween('d', function(d) {
            let interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
            return function(t) {
                return arc(interpolate(t));
            };
        });


    let restOfTheData=function(){
        let text=svg.selectAll('text')
            .data(pie(d))
            .enter()
            .append("text")
            .transition()
            .duration(200)
            .attr("transform", function (d) {
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("dy", ".4em")
            .attr("text-anchor", "middle")
            .text(function(d){
                return d.data.percent+"%";
            })
            .style("fill", "#fff")
            .style("font-size", "10px");

        let legendRectSize=20;
        let legendSpacing=7;
        let legendHeight=legendRectSize+legendSpacing;


        let legend=svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr("class", "legend")
            .attr("transform", function (d,i) {
                //Just a calculation for x & y position
                return 'translate(-35,' + ((i*legendHeight)-65) + ')';
            });
        legend.append('rect')
            .attr("width", legendRectSize)
            .attr("height", legendRectSize)
            .attr("rx", 20)
            .attr("ry", 20)
            .style("fill", color)
            .style("stroke", color);

        legend.append('text')
            .attr("x", 30)
            .attr("y", 15)
            .text(function(d){
                return d;
            })
            .style("fill", "#929DAF")
            .style("font-size", "14px");
    };

    setTimeout(restOfTheData,1000);
}

