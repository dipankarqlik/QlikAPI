define(["jquery", "text!./piescat.css", "./d3.min"], function ($, cssContent) {
  "use strict";
  $("<style>").html(cssContent).appendTo("head");
  return {
    initialProperties: {
      version: 1.0,
      qHyperCubeDef: {
        qDimensions: [],
        qMeasures: [],
        qInitialDataFetch: [
          {
            qWidth: 4,
            qHeight: 1000,
          },
        ],
      },
    },
    definition: {
      type: "items",
      component: "accordion",
      items: {
        dimensions: {
          uses: "dimensions",
          min: 1,
          max: 2,
        },
        measures: {
          uses: "measures",
          min: 2,
          max: 2,
        },
        sorting: {
          uses: "sorting",
        },
        settings: {
          uses: "settings",
        },
      },
    },
    snapshot: {
      canTakeSnapshot: true,
    },
    paint: function ($element, layout) {
      // console.log($element);
      // console.log(layout);

      //getting data array from QS object layout
      var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;

      //array to get measure labels
      var measureLabels = layout.qHyperCube.qMeasureInfo.map(function (d) {
        return d.qFallbackTitle;
      });

      //an array that invokes each row of qMatrix from layout:
      var data = qMatrix.map(function (d) {
        return {
          Dim1: d[0].qText, //pie
          Dim2: d[1].qText, //state
          Dim3: d[2].qText, //Sales
          Dim4: d[3].qText, //Profit
        };
      });

      var width = $element.width();

      var height = $element.height();

      // get the chart object id
      var id = "container_" + layout.qInfo.qId;

      // Check to see if the chart element has already been created
      if (document.getElementById(id)) {
        // empty contents if already created
        $("#" + id).empty();
      } else {
        // if not created, use id and size to create
        $element.append(
          $("<div />").attr("id", id).width(width).height(height)
        );
      }

      viz(data, measureLabels, width, height, id);
    },
  };
});

var viz = function (data, labels, width, height, id) {
  var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

  // append the svg object to the ID
  var svg = d3
    .select("#" + id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add X axis
  var x = d3.scale.linear().domain([0, 42]).range([0, width]);

  // Add Y axis
  var y = d3.scale.linear().domain([0, 11]).range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom");

  var yAxis = d3.svg.axis().scale(y).orient("left");

  var tooltip = d3
    .select("#my_dataviz")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text(labels[0]);

  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(labels[1]);

  var color = d3.scale.category10();

  var pie = d3.layout.pie().value(function (d) {
    return d.value;
  });

  //Tooltip related functions:
  var mouseover = function (d) {
    tooltip.style("opacity", 1);
  };

  var mousemove = function (d) {
    console.log(d);
    tooltip
      .html("Sales contribution: " + d.value + "%")
      .style("left", d3.mouse(this)[0] + 90 + "px")
      .style("top", d3.mouse(this)[1] + "px");
  };

  var mouseleave = function (d) {
    tooltip.transition().duration(200).style("opacity", 0);
  };

  svg
    .append("g")
    .selectAll("dot")
    .data(data)
    .enter()
    .append("g")
    .attr("transform", function (d) {
      return "translate(" + x(d.Dim3) + "," + y(d.Dim4) + ")";
    })
    .selectAll("whatever")
    .data(function (d) {
      return pie(d3.entries(d.Dim1.split(",")));
    })
    .enter()
    .append("path")
    .data(function (d) {
      let mymap = d.Dim1.split(",").map((e, i) => {
        return { key: i, value: e, size: d.Dim3 };
      });

      return pie(mymap);
    })
    .attr(
      "d",
      d3.svg
        .arc()
        .innerRadius(0)
        .outerRadius(function (d) {
          //using a customer radius for each pie-chart based on Sales value
          return d.data.size / 1.4;
        })
    )
    .attr("fill", function (d) {
      return color(d.data.key);
    })

    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  //Show the states:
  var node = svg.selectAll(".g").data(data).enter().append("g");

  node
    .append("text")
    .attr("x", function (d) {
      return x(d.Dim3);
    })
    .attr("y", function (d) {
      return y(d.Dim4);
    })
    .style("text-anchor", "beg")
    .style("font-size", "11px")
    .text(function (d) {
      return d.Dim2;
    });

  //Create a Legend
  var legend = svg
    .selectAll(".legend")
    .data(color.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", function (d, i) {
      return "translate(0," + i * 20 + ")";
    });

  // add rectangles to the legend group
  legend
    .append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

  // add text labels to the legend group
  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function (d) {
      return d;
    });
};
