var title = "Weekly Infectious Diseases Cases in Singapore (2012-2022)";
var units = "count of cases";

//set the dimensions and margins of the graph
var margin = {top:100, right:30, bottom:30, left:30},
    width = 800 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;
var padding = 0.01;

//append the svg object to the body of the pageXOffset
var svg = d3.select("#disease_plot")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate("+margin.left+","+margin.top+")");

d3.json("./weekly-infectious-disease-bulletin-cases.json").then(function(data){
    // console.table(data)

    // var filteredData = data.filter(e=>e.disease==="Campylobacter enteritis");
    // console.table(filteredData);

    var casesByDisease = d3.group(data, d=>d.disease);
    console.log(casesByDisease);
    // console.log(Array.from(casesByDisease));

    var diseaseList = [];
    Array.from(casesByDisease).forEach(element => {
        diseaseList.push(element[0]);
    });
    console.log(diseaseList);

    //add disease to dropdown menu selection
    d3.select("#selectButton")
        .selectAll("myOptions")
            .data(diseaseList)
        .enter()
            .append("option")
        .text(function (d) { return d; }) 
        .attr("value", function (d) { return d; }) 

    //create a tooltip
    var tooltip = d3.select("#disease_plot")
        .append("div")
        .style("opacity", 0)
        .attr("id","tooltip")
        .attr("class", "tooltip")


    plot(diseaseList[0]);

    //when the button is changed, update the plot
    d3.select("#selectButton").on("change", function(d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        plot(selectedOption)
    })
    
    function plot(diseaseName){
        svg.selectAll("*").remove();

        var filteredData = data.filter(e=>e.disease===diseaseName);
        // console.table(filteredData);

        //labels of row and columns
        var years = [];
        var weeks = [];

        var finalData = [];
        
        filteredData.forEach(element => {
            var e = {
                year: parseFloat(element.epi_week.split("-")[0]),
                week: parseFloat(element.epi_week.split("-")[1].split("W")[1]),
                case: element.count_of_cases
            };
            years.push(e.year);
            weeks.push(e.week);
            finalData.push(e);
        });
        console.table(finalData);
        // console.log(years);
        // console.log(weeks);

        //extract the extent and median of case
        var extentCase = d3.extent(finalData,function(d){return d.case});
        var maxCase = extentCase[0];
        var minCase = extentCase[1];
        var medianCase = d3.mean(finalData, d=>d.case);
        console.log(maxCase, minCase, medianCase);


        //build x scales and axis:
        var x = d3.scaleBand()
            .range([0,width])
            .domain(weeks)
            .padding(padding);
        svg.append("g")
            .call(d3.axisTop(x))
            .call(g => g.select(".domain")
                .remove())
            .attr("color", "white")
            .append("text")
                .attr("dy", "-1rem")
                .attr("x", "0")
                .style("text-anchor", "end")
                .text("Week")
                .style("fill","white");

        //build y sclaes and axis
        var y = d3.scaleBand()
            .range([height,0])
            .domain(years)
            .padding(padding);
        svg.append("g")
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain")
                .remove())
            .attr("color", "white");

        //build colour scale
        var colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateWarm)
            .domain([maxCase, minCase]);

        // Three function that change the tooltip when user hover / move / leave a cell
        var mouseover = function(event, d) {
            tooltip.style("opacity", 1)
            d3.select(this)
                .style("stroke", "white")
                .transition().duration(200)
                .style("opacity", 1)
                
        }
        var mousemove = function(event, d) {
            console.log(event.pageX, event.pageY)
            // console.log('mouseover', event.target, this);
            tooltip
                .html(d.year + ", Week " + d.week + ": <br/>" +
                    "<br/> There are <b>" + d.case + "</b> " + diseaseName + " cases recorded.")
                .style("left", (event.pageX+20) + "px")
                .style("top", (event.pageY-margin.top) + "px")
        }
        var mouseleave = function(event, d) {
            tooltip.style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
        }

        //add the tiles
        svg.selectAll()
        .data(finalData)
        .join("rect")
            .attr("class", "tile")
            .style("position", "relative")
            .attr("x", function(d){return x(d.week)})
            .attr("y", function(d){return y(d.year)})
            .attr("width",x.bandwidth())
            .attr("height",y.bandwidth())
        .style("fill",function(d){return colorScale(d.case)})
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

        svg.append("text")
            .attr("dy", "-3rem")
            .attr("x", "0")
            .style("text-anchor", "start")
            .style("font-size", "10px")
            .text("Each epidemiological week begins on a Sunday and ends on Saturday.")
            .style("fill","white");


        svg.append("text")
            .attr("class","diseaseName")
            .attr("x",0)
            .attr("y",height+margin.bottom)
            .text(diseaseName)
            .style("fill","white");

        /* gradient legend */
        var barHeight = 16;
        var legendWidth = 300;
        var legendHeight = 50;
        
        var defs = svg.append("defs");

        //legend: append the linear gradient
        var linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");
        linearGradient.selectAll("stop")
            .data(colorScale.ticks().map((t,i,n)=>({offset: (100*i/n.length)+"%", color:colorScale(t)})))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d=>d.color)

        svg.append("g")
            .attr("id", "legend")
            .attr("transform", "translate(0," +(0-margin.top) + ")")
            .append("rect")
            .attr("width", legendWidth)
            .attr("height", barHeight)
            .style("fill", "url(#linear-gradient)")

        var legendGraph = d3.select("#legend")
        legendGraph.append("text")
            .attr("class","legendTitle")
            .attr("x",0)
            .attr("y",-5)
            .text("Weekly case count")
            .style("fill","white");

        //create tick marks
        var legendScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range([0, legendWidth])
        legendGraph.attr("class", "legend")
            .append("g")
            .attr("transform","translate(0,"+barHeight+")")
            .call(d3.axisBottom(legendScale)
                .ticks(legendWidth/40)
                .tickSize(-barHeight))
                .select(".domain")
                .remove();

    }


})