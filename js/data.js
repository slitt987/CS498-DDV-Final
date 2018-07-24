function sumarize_data(keys, sorted_keys, other_keys, metrics, data) {
    // first lets remove the "other" keys
    let key_data = data.map(function(d) {
        let r = d;
        if (other_keys.includes(d[keys[1]])) {
            r[keys[1]] = "Other";
        };
        return r;
    });

    // next lets summarize the data according to the keys
    key_data = d3.nest()
        .key(function(d) {
            return keys.map(function(k) {
                return d[k];
            });
        })
        .rollup(function(v) {
            let r = {};
            keys.forEach(function(k){
                r[k] = d3.max(v, function(d) {return d[k]});
            });
            metrics.forEach(function(m){
                r[m] = d3.sum(v, function(d) {return d[m]});
            });
            return r;
        })
        .entries(key_data)
        .map(function(d) {return d.value});

    // now pivot the data
    key_data = d3.nest()
        .key(function(d) {
            let r = [d[keys[0]]];
            keys.slice(2,99).forEach(function (k) {
                r.push(d[k])
            });
            return r.join("|");
        })
        .sortKeys(d3.ascending)
        .entries(key_data)
        .map(function(d) {
            let r = {};
            r[keys[0]] = d.key.split('|')[0];
            keys.slice(2,99).forEach(function (k) {
               r[k] = d.values[0][k];
            });
            d.values.forEach(function(v) {
                let c = {};
                metrics.forEach(function(m) {
                    c[m] = v[m];
                });
                r[v[keys[1]]] = c;
            });
            // add missing keys
            sorted_keys
                .filter(function(k) {return !(k in r)})
                .forEach(function(k) {
                    let c = {};
                    metrics.forEach(function(m) {
                        c[m] = 0;
                    });
                    r[k] = c;
                });
            return r;
        });
    return key_data;
}


function pivot_data(keys, max_keys, hier_depth, sort_metric, data) {
    let key_sort = {};

    // Organize the keys
    let key_list = data.map(function(d) {
        let out = {cnt: d[sort_metric]};
        out[keys[1]] = d[keys[1]];
        return out;
    });

    key_list = d3.nest()
        .key(function(d) {return d[keys[1]]})
        .rollup(function(v) { return d3.mean(v, function(d) { return d[sort_metric]; }); })
        .entries(key_list)
        .sort(function(a, b) {return (a.value - b.value) * -1});

    key_list.slice(0,max_keys).forEach(function(d) {key_sort[d.key] = d.value});
    let other_keys = key_list.slice(max_keys, 999).map(function(d) {return d.key});
    let sorted_keys = Object.keys(key_sort)
        .sort(function(a, b){
            return (key_sort[a] - key_sort[b]) * -1
        });

    if (other_keys.length > 0) {
        sorted_keys.push("Other");
    };

    let metrics = Object.keys(data[0])
        .filter(function(d) {return !keys.includes(d)});

    let key_data = sumarize_data(keys, sorted_keys, other_keys, metrics, data);
    let summary_data = [];
    let filter_values = [];
    if (keys.length > hier_depth) {
        summary_data = sumarize_data(keys.slice(0,hier_depth), sorted_keys, other_keys, metrics, data)
            .map(function (d) {
                let r = d;
                r[keys[keys.length - 1]] = "*"
                return r;
            });
        key_values = summary_data.map(function (d) {
            return d[keys[0]];
        });

        filter_values = ["*"].concat(d3.nest()
            .key(function (d) {return d[keys[keys.length - 1]]})
            .rollup(function(v) { return d3.mean(v, function(d) { return d[sort_metric]; }); })
            .entries(key_data)
            .map(function (d) {return d.key})
        )
    } else {
        key_values = key_data.map(function (d) {
            return d[keys[0]];
        });
    }

    key_data = key_data.concat(summary_data);

    return {
        key: keys[0],
        filter_key: keys.slice(hier_depth,99),
        sorted_keys: sorted_keys,
        filter_values: [filter_values],
        data: key_data,
        metrics: metrics
    };
}
