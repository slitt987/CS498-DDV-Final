function apply_filter(ds) {
    let dataset = [];

    if ("filter" in ds && ds.filter.length > 0) {
        dataset = ds.data
            .filter(function(v) {
                return !ds.filter_key
                    .map(function (d,i) {
                        return ds.filter[i] === "*" || ds.filter[i].toString() === v[d].toString();
                    })
                    .includes(false);
            });
    } else {
        dataset = ds.data;
    }

    dataset = sumarize_data(
        [ds.key, ds.metric_key],
        ds.sorted_keys,
        ds.other_keys,
        ds.metrics,
        dataset
    )

    return dataset.map(function(v) {
        let r = {};
        r[ds.key] = v[ds.key];
        ds.sorted_keys.forEach(function(k) {
            if (ds.metric.startsWith("avg_")) {
                r[k] = v[k][ds.metric] / v[k].cnt;
            } else {
                r[k] = v[k][ds.metric];
            }
        });
        return r;
    });
}

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


function configure_data(keys, max_keys, filter_cat, sort_metric, data) {
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

    let filter_key = keys.slice(2,99);
    if (filter_cat) {
        filter_key.push(keys[1]);
    }

    let filter_values = filter_key.map(function (k) {
        return ["*"].concat(d3.nest()
            .key(function (d) {return d[k]})
            .rollup(function(v) { return d3.mean(v, function(d) { return d[sort_metric]; }); })
            .entries(data)
            .sort(function (a, b) {
                if (k === "year") {
                    return +b.key - +a.key;
                } else {
                    return +b.value - +a.value
                }
            })
            .map(function (d) {return d.key}));
    });

    let filter = filter_key.map(function(d) {return "*"});

    return {
        key: keys[0],
        metric_key: keys[1],
        filter_key: filter_key,
        filter: filter,
        sorted_keys: sorted_keys,
        other_keys: other_keys,
        filter_values: filter_values,
        data: data,
        metrics: metrics
    };
}
