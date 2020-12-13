<template lang="pug">
iframe(sandbox="allow-downloads allow-scripts", frameborder="0", ref="iframe")
</template>

<script>
export default {
  name: 'apexcharts-iframe',
  props: ['version', 'code', 'height'],
  mounted() {
    this.update();

    // Automatically adjust iframe height depending on the chart
    if (this.height === 'auto') {
      window.onmessage = e => {
        if (typeof e.data === 'object' && e.data.height) {
          let height;
          if (e.data.error) {
            const stackLines = e.data.errorStack.split('\n').slice(0, -2);
            let stackHtml = '';
            for (const stackLine of stackLines) {
              const m = stackLine.match(/^([^@]+)@(.*):(\d+):(\d+)$/);
              const urlParts = m[2].split('/');
              const filename = urlParts[urlParts.length-1];
              stackHtml += `<div><a onclick='window.top.postMessage({url: ${JSON.stringify(m[2])}, line: ${m[3]}, column: ${m[4]}}, "*")'>${m[1]} ${filename} (${m[3]}:${m[4]})</a></div>`;
            }

            this.$refs.iframe.src = "data:text/html;charset=utf-8," + escape(`
            <!doctype html>
            <html lang="en">
              <head>
                <style>
                  a { cursor: pointer; color: #413aa4; }
                  a:hover { color: #069678; }
                </style>
              </head>
              <body>
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 100%; height: 100%; overflow: auto;">
                  <h3 style="color: red;">${e.data.error}</h3>
                  ${stackHtml}
                </div>
              </body>
            </html>`);
            height = 200;
          } else {
            height = Math.min($(window).height()-20, e.data.height+10);
          }
          $(this.$refs.iframe).css('height', `${height}px`);
        }

        if (typeof e.data === 'object' && e.data.line) {
          fetch(e.data.url)
            .then(response => response.blob())
            .then(blob => blob.text())
            .then(source => {
                window.openSidebar({
                  type: 'sidebar',
                  name: 'code-sidebar',
                  code: source,
                  line: e.data.line,
                  column: e.data.column,
                });
            });
        }
      };
    }
  },
  methods: {
    update() {
      this.$refs.iframe.src = "data:text/html;charset=utf-8," + escape(getHtml(this.code, this.version));
    },
  },
  watch: {
    code: 'update',
    version: 'update',
  },
};


const getHtml = (code, version) => {
  // A not minified version was not available until 1.4.7
  const [major, minor, patch] = version.split('.');
  let minified = major === '1' && (Number(minor) < 4 || (minor === '4' && patch <= '6'));
  const libraryUrl = `https://cdn.jsdelivr.net/npm/apexcharts@${version}/dist/apexcharts${minified ? '.min' : ''}.js`;

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <style>
      .apexcharts-canvas {
        margin: 0 auto;
      }
      #chart {
        max-width: 650px;
        margin: 0 auto;
      }
    </style>
  </head>

  <body>
    <div id="chart"></div>

    <`+`script src="${libraryUrl}"></`+`script>
    <`+`script>
      function update(error) {
        window.top.postMessage({
          height: document.documentElement.getBoundingClientRect().height,
          error: error && error.message,
          errorStack: error && error.stack,
        }, '*');
      }

      var elem = document.getElementById('chart');
      try {
        var chart = new ApexCharts(elem, ${code});
        chart.render()
          .then(function() {
            update();
          })
          .catch(function(err) {
            update(err);
          });
      } catch (e) {
        update(e);
      }
    </`+`script>
  </body>
</html>`;
};
</script>