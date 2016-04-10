'use strict';

var React = require('react');
var d3 = require('d3');
var DataSeries = require('./DataSeries');
var utils = require('../utils');

var { Chart, XAxis, YAxis, Tooltip } = require('../common');
var { CartesianChartPropsMixin, DefaultAccessorsMixin, ViewBoxMixin, TooltipMixin } = require('../mixins');

module.exports = React.createClass({

  mixins: [CartesianChartPropsMixin, DefaultAccessorsMixin, ViewBoxMixin, TooltipMixin],

  displayName: 'BarChart',

  propTypes: {
    chartClassName:         React.PropTypes.string,
    data:                   React.PropTypes.array.isRequired,
    hoverAnimation:         React.PropTypes.bool,
    height:                 React.PropTypes.number,
    margins:                React.PropTypes.object,
    rangeRoundBandsPadding: React.PropTypes.number,
    // https://github.com/mbostock/d3/wiki/Stack-Layout#offset
    stackOffset:            React.PropTypes.oneOf(['silhouette', 'expand', 'wigget', 'zero']),
    valuesAccessor:         React.PropTypes.func,
    title:                  React.PropTypes.string,
    width:                  React.PropTypes.number,
    xAxisClassName:         React.PropTypes.string,
    yAxisClassName:         React.PropTypes.string,
    yAxisTickCount:         React.PropTypes.number,
  },

  getDefaultProps() {
    return {
      chartClassName:         'rd3-barchart',
      hoverAnimation:         true,
      margins:                { top: 10, right: 20, bottom: 40, left: 45 },
      rangeRoundBandsPadding: 0.25,
      stackOffset:            'zero',
      valuesAccessor:         d => d.values,
      xAxisClassName:         'rd3-barchart-xaxis',
      yAxisClassName:         'rd3-barchart-yaxis',
      yAxisTickCount:         4,
    };
  },

  _getStackedValuesMaxY(_data) {
    // in stacked bar chart, the maximum height we need for
    // yScale domain is the sum of y0 + y
    var { valuesAccessor } = this.props;
    return d3.max(_data, function (d) {
      return d3.max(valuesAccessor(d), function (d) {
        // where y0, y is generated by d3.layout.stack()
        return d.y0 + d.y;
      });
    });
  },

  _getStackedValuesMinY(_data) {
    var { valuesAccessor } = this.props;
    return d3.min(_data, function (d) {
      return d3.min(valuesAccessor(d), function (d) {
        // where y0, y is generated by d3.layout.stack()
        return d.y0 + d.y;
      });
    });
  },

  _getLabels(firstSeries) {
    // we only need first series to get all the labels
    var { valuesAccessor, xAccessor } = this.props;
    return valuesAccessor(firstSeries).map(xAccessor);
  },

  _stack() {
    // Only support columns with all positive or all negative values
    // https://github.com/mbostock/d3/issues/2265
    var { stackOffset, xAccessor, yAccessor, valuesAccessor } = this.props;
    return d3.layout.stack()
                    .offset(stackOffset)
                    .x(xAccessor)
                    .y(yAccessor)
                    .values(valuesAccessor);
  },

  render() {

    var props = this.props;
    var yOrient = this.getYOrient();

    var _data = this._stack()(props.data);

    var { innerHeight, innerWidth, trans, svgMargins } = this.getDimensions();

    var xScale = d3.scale.ordinal()
      .domain(this._getLabels(_data[0]))
      .rangeRoundBands([0, innerWidth], props.rangeRoundBandsPadding);

    var yScale = d3.scale.linear()
      .range([innerHeight, 0])
      .domain([Math.min(0, this._getStackedValuesMinY(_data)), this._getStackedValuesMaxY(_data)]);

    var series = props.data.map((item) => item.name);

    return (
      <span>
        <Chart
          viewBox={this.getViewBox()}
          legend={props.legend}
          data={props.data}
          margins={props.margins}
          colors={props.colors}
          colorAccessor={props.colorAccessor}
          width={props.width}
          height={props.height}
          title={props.title}
          shouldUpdate={!this.state.changeState}
        >
          <g transform={trans} className={props.chartClassName}>
            <YAxis
              yAxisClassName={props.yAxisClassName}
              yAxisTickValues={props.yAxisTickValues}
              yAxisLabel={props.yAxisLabel}
              yAxisLabelOffset={props.yAxisLabelOffset}
              yScale={yScale}
              margins={svgMargins}
              yAxisTickCount={props.yAxisTickCount}
              tickFormatting={props.yAxisFormatter}
              width={innerWidth}
              height={innerHeight}
              horizontalChart={props.horizontal}
              xOrient={props.xOrient}
              yOrient={yOrient}
              gridHorizontal={props.gridHorizontal}
              gridHorizontalStroke={props.gridHorizontalStroke}
              gridHorizontalStrokeWidth={props.gridHorizontalStrokeWidth}
              gridHorizontalStrokeDash={props.gridHorizontalStrokeDash}
            />
            <XAxis
              xAxisClassName={props.xAxisClassName}
              xAxisTickValues={props.xAxisTickValues}
              xAxisLabel={props.xAxisLabel}
              xAxisLabelOffset={props.xAxisLabelOffset}
              xScale={xScale}
              margins={svgMargins}
              tickFormatting={props.xAxisFormatter}
              width={innerWidth}
              height={innerHeight}
              horizontalChart={props.horizontal}
              xOrient={props.xOrient}
              yOrient={yOrient}
              gridVertical={props.gridVertical}
              gridVerticalStroke={props.gridVerticalStroke}
              gridVerticalStrokeWidth={props.gridVerticalStrokeWidth}
              gridVerticalStrokeDash={props.gridVerticalStrokeDash}
            />
            <DataSeries
              yScale={yScale}
              xScale={xScale}
              margins={svgMargins}
              _data={_data}
              series={series}
              width={innerWidth}
              height={innerHeight}
              colors={props.colors}
              colorAccessor={props.colorAccessor}
              hoverAnimation={props.hoverAnimation}
              valuesAccessor={props.valuesAccessor}
              onMouseOver={this.onMouseOver}
              onMouseLeave={this.onMouseLeave}
    />
          </g>
        </Chart>
        {(props.showTooltip ? <Tooltip {...this.state.tooltip} /> : null)}
      </span>
    );
  }

});
