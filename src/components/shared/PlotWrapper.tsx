import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

// Handle CJS default export interop
const factory = typeof createPlotlyComponent === 'function'
  ? createPlotlyComponent
  : (createPlotlyComponent as unknown as { default: typeof createPlotlyComponent }).default;

const Plot = factory(Plotly);
export default Plot;
