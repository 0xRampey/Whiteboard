function renderPDF(url, canvas, canvasContainer, options) {
  var pdfDoc;
  var state = 1;

  var options = options || {
    scale: 1
  };

  function renderPage(page) {
    var viewport = page.getViewport(options.scale);
    var ctx = canvas.getContext('2d');
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    page.render(renderContext);
  }

  function renderPages(pdfDo) {
    //for(var num = 1; num <= pdfDoc.numPages; num++)
    pdfDoc = pdfDo;
    pdfDoc.getPage(state).then(renderPage);
  }

  this.renderNextPage = function () {

    if (state < pdfDoc.numPages) {

      state = state + 1;
      pdfDoc.getPage(state).then(renderPage);
    } else {
      console.log("Reached end of pdf!");
    }
  }
  this.renderPrevPage = function () {

    if (state > 1) {
      state = state - 1;
      pdfDoc.getPage(state).then(renderPage);
    } else {
      console.log("Reached start of pdf!");
    }
  }
  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(renderPages);


}
module.exports = renderPDF;
