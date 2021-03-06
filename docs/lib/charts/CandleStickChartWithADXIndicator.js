
import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
	BarSeries,
	AreaSeries,
	CandlestickSeries,
	LineSeries,
	ADXSeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
	CrossHairCursor,
	EdgeIndicator,
	CurrentCoordinate,
	MouseCoordinateX,
	MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
	OHLCTooltip,
	MovingAverageTooltip,
	ADXTooltip,
	SingleValueTooltip,
} from "react-stockcharts/lib/tooltip";
import { ema, adx, sma, atr } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";


const adxAppearance = {
	stroke: Object.assign({},
		ADXSeries.defaultProps.stroke)
};

class CandleStickChartWithADXIndicator extends React.Component {
	render() {
		const ema26 = ema()
			.id(0)
			.options({ windowSize: 26 })
			.merge((d, c) => { d.ema26 = c; })
			.accessor(d => d.ema26);

		const ema12 = ema()
			.id(1)
			.options({ windowSize: 12 })
			.merge((d, c) => { d.ema12 = c; })
			.accessor(d => d.ema12);

		const smaVolume50 = sma()
			.id(3)
			.options({ windowSize: 50, sourcePath: "volume" })
			.merge((d, c) => { d.smaVolume50 = c; })
			.accessor(d => d.smaVolume50);

		const rsiCalculator = adx()
			.options({ windowSize: 14 })
			.merge((d, c) => { d.adx = c; })
			.accessor(d => d.adx);

		const atr14 = atr()
			.options({ windowSize: 14 })
			.merge((d, c) => { d.atr14 = c; })
			.accessor(d => d.atr14);

		const { type, data: initialData, width, ratio } = this.props;

		const calculatedData = ema26(ema12(smaVolume50(rsiCalculator(atr14(initialData)))));
		const xScaleProvider = discontinuousTimeScaleProvider
			.inputDateAccessor(d => d.date);
		const {
			data,
			xScale,
			xAccessor,
			displayXAccessor,
		} = xScaleProvider(calculatedData);

		const start = xAccessor(last(data));
		const end = xAccessor(data[Math.max(0, data.length - 150)]);
		const xExtents = [start, end];

		return (
			<ChartCanvas height={600}
				width={width}
				ratio={ratio}
				margin={{ left: 70, right: 70, top: 20, bottom: 30 }}
				type={type}
				seriesName="MSFT"
				data={data}
				xScale={xScale}
				xAccessor={xAccessor}
				displayXAccessor={displayXAccessor}
				xExtents={xExtents}
			>

				<Chart id={1} height={300}
					yExtents={[d => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
					padding={{ top: 10, bottom: 20 }}
				>
					<XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
					<YAxis axisAt="right" orient="right" ticks={5} />

					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<CandlestickSeries />
					<LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()} />
					<LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()} />

					<CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />
					<CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />

					<EdgeIndicator itemType="last" orient="right" edgeAt="right"
						yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />

					<OHLCTooltip origin={[-40, 0]} visible={false} />

					<MovingAverageTooltip
						onClick={e => console.log(e)}
						origin={[-38, 15]}
						options={[
							{
								yAccessor: ema26.accessor(),
								type: "EMA",
								stroke: ema26.stroke(),
								windowSize: ema26.options().windowSize,
							},
							{
								yAccessor: ema12.accessor(),
								type: "EMA",
								stroke: ema12.stroke(),
								windowSize: ema12.options().windowSize,
							},
						]}
					/>

				</Chart>
				<Chart id={2} height={150}
					yExtents={[d => d.volume, smaVolume50.accessor()]}
					origin={(w, h) => [0, h - 400]}
				>
					<YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")} />

					<MouseCoordinateY
						at="left"
						orient="left"
						displayFormat={format(".4s")} />

					<BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />
					<AreaSeries yAccessor={smaVolume50.accessor()} stroke={smaVolume50.stroke()} fill={smaVolume50.fill()} />
				</Chart>
				<Chart id={3}
					yExtents={[0, 200]}
					height={125} origin={(w, h) => [0, h - 250]}
				>
					<XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
					<YAxis axisAt="right"
						orient="right"
						tickValues={[0, 50, 100]} />
					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<ADXSeries yAccessor={d => d.adx} />

					<ADXTooltip origin={[-38, 15]}
						yAccessor={d => d.adx}
						apperance={{
							fill: "none",
							hoverStrokeWidth: 4,
							stroke: {
								ALine: "#ff0001",
								dLine: "#EA2BFF",
								kLine: "#74D400",	
							},
							strokeDasharray: "Solid",
							strokeOpacity: 1,
							strokeWidth: 1,
							windowSize: 14,
						}}
						options={rsiCalculator.options()} />
				</Chart>
				<Chart id={8}
					yExtents={atr14.accessor()}
					height={125} origin={(w, h) => [0, h - 125]} padding={{ top: 10, bottom: 10 }}
				>
					<XAxis axisAt="bottom" orient="bottom" />
					<YAxis axisAt="right" orient="right" ticks={2} />

					<MouseCoordinateX
						at="bottom"
						orient="bottom"
						displayFormat={timeFormat("%Y-%m-%d")} />
					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<LineSeries yAccessor={atr14.accessor()} stroke={atr14.stroke()} />
					<SingleValueTooltip
						yAccessor={atr14.accessor()}
						yLabel={`ATR (${atr14.options().windowSize})`}
						yDisplayFormat={format(".2f")}
						/* valueStroke={atr14.stroke()} - optional prop */
						/* labelStroke="#4682B4" - optional prop */
						origin={[-40, 15]} />
				</Chart>
				<CrossHairCursor />
			</ChartCanvas>
		);
	}
}

CandleStickChartWithADXIndicator.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChartWithADXIndicator.defaultProps = {
	type: "svg",
};
CandleStickChartWithADXIndicator = fitWidth(CandleStickChartWithADXIndicator);

export default CandleStickChartWithADXIndicator;
