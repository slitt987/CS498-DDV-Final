function noop_clear(scene, div) {}
function noop_render(d, div) {}

// When the user clicks on <div>, open the popup
function popupEssay() {
    var popup = document.getElementById("popupEssay");
    popup.classList.toggle("show");
}

function clear_scene(scene, div) {
    d3.select("#" + div).select("#" + div + "-svg").remove()
    let index = control.rendered_scenes.indexOf(scene);
    if (index > -1) {
        control.rendered_scenes.splice(index, 1);
    }
}

function renderScene() {
    let scene_control = control[control.current_scene];
    let div = scene_control.div_id;
    scene_control.clear(control.current_scene, div);
    scene_control.render(data[control.current_scene], div);
}

function filterMenuSetup(ds, div) {
    // setup the dropdown toggles
    if (ds.filter_key.length > 0) {
        let dropdown = d3.select("#" + div + "-filter_dropdown");
        if (dropdown.selectAll("select").empty()) {
            ds.filter_key.forEach(function (f, i) {
                let span = dropdown.append("span")
                    .text(f.toProperCase() + " - ")
                    .style("padding-left", "10px")
                    .style("padding-right", "10px");
                span.append("select")
                    .attr("id", div + "-" + f + "-filter-select")
                    .selectAll("option")
                    .data(data[control.current_scene].filter_values[i])
                    .enter()
                    .append("option")
                    .attr("value", function (d) {
                        return d;
                    })
                    .text(function (d) {
                        return d;
                    });

                span.on("change", function () {
                    let id = div + "-" + f + "-filter-select";
                    let filter = document.getElementById(id).value;
                    data[control.current_scene].filter[i] = filter;
                    renderScene()
                });
            })
        }
    }
}

function metricMenuSetup(ds, div) {
    // setup the metric toggles
    let toggles = d3.select("#" + div + "-metric_select");
    toggles.selectAll("a").remove();
    ds.metrics
        .filter(function (m) {
            return m in ds.metric_name
        })
        .forEach(function (m) {
            toggles.append("a")
                .attr("id", m)
                .attr("class", "metric-link")
                .attr("href", "#")
                .text(ds.metric_name[m])
                .classed("active", m === ds.metric)
                .on("click", function (d) {
                    let clickedMetric = d3.select(this).attr("id");
                    data[control.current_scene].metric = clickedMetric;
                    renderScene()
                })
        });
}

function createMenu() {
    Object.keys(control)
        .filter(function(key) {return typeof control[key] === "object"})
        .filter(function(key) {return "name" in control[key]})
        .filter(function(key) {return !d3.select("#" + key + "-content").empty()})
        .forEach(function(key){
            d3.select("#vis-nav")
                .append("a")
                .attr("id", key)
                .attr("class", "scene-link")
                .attr("href", "#")
                .text(control[key].name)
                .on("click", function(d) {
                    let clickedScene = d3.select(this).attr("id");
                    switchScene(clickedScene);
                })
        })
}

function createNextLink() {
    if (d3.select("#next").empty() &&
        nextSceneId(control.current_scene) in control) {
        d3.select("#vis-nav")
            .append("a")
            .attr("id", "next")
            .attr("class", "next-link")
            .attr("href", "#")
            .text("Next")
            .on("click", function(d) {
                let nextScene = nextSceneId(control.current_scene);
                switchScene(nextScene);
            })
            .style("opacity", 0)
            .transition().duration(500)
            .style("opacity", 1);
    }
}

function switchScene(newScene)
{
    // Adjust menu
    d3.selectAll(".scene-link").classed("active", false);
    d3.select("#" + newScene).classed("active", true);

    // switch div
    d3.selectAll("a.next-link").remove();

    // Render viz/set state
    let scene_control = control[newScene]
    control.current_scene = newScene

    d3.selectAll(".scene")
        .style("display", "none")
        .style("opacity", 0.0);

    d3.select("#" + newScene + "-content")
        .style("display", "block")
        .transition().delay(300).duration(500)
        .style("opacity", 1)
        .on("end", function(d){createNextLink()})

    // Render
    scene_control.clear(newScene, scene_control.div_id);
    if (!control.rendered_scenes.includes(newScene)) {
        scene_control.render(data[newScene], scene_control.div_id);
        control.rendered_scenes.push(newScene);
    };
}

function nextSceneId(scene) {
    let prefix = scene.replace(/[0-9]*/g, "");
    let id = parseInt(scene.replace(/[a-z-]*/ig, ""));
    return prefix + (id + 1)
}



