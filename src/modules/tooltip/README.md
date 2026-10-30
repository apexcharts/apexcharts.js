### AxesTooltip.js
This file deals with the x-axis and y-axis tooltips.

### Intersect.js
This file deals with functions related to intersecting tooltips (tooltips that appear when user hovers directly over a data-point whether).

Where markers of several series are drawn at the hovered marker's spot (`../CoincidentMarkers.js`), an intersect tooltip lists each of those series, and `markerClick` and `dataPointSelection` name them as `coincident` beside the topmost point. `click` carries `coincident` too on the SVG renderer; on the canvas renderer its target is the canvas, so only `markerClick` carries it there.

### Labels.js
This file deals with printing actual text on the tooltip.

### Marker.js
This file deals with the markers that appear near tooltip in line/area charts.  These markers helps the user to associate the data-points and the values that are shown in the tooltip

### Position.js
This file deals with positioning of the tooltip.

### Tooltip.js
This is the primary file which is an entry point for all tooltip related functionality.

### Utils.js
Helper functions related to tooltips.
