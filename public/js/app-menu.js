var jQuery = $ = require('jQuery');
var BackboneViews = require('./backbone-views');
var appUtilities = require('./app-utilities');
var painter = require('./painter');

// Handle sbgnviz menu functions which are to be triggered on events
module.exports = function () {
  var dynamicResize = appUtilities.dynamicResize.bind(appUtilities);

  var layoutPropertiesView, generalPropertiesView, pathsBetweenQueryView;

  function loadSample(filename) {
    return sbgnviz.loadSample(filename, 'samples/');
  }

  $(document).ready(function ()
  {
    console.log('init the sbgnviz template/page');

    layoutPropertiesView = appUtilities.layoutPropertiesView = new BackboneViews.LayoutPropertiesView({el: '#layout-properties-table'});
    generalPropertiesView = appUtilities.generalPropertiesView = new BackboneViews.GeneralPropertiesView({el: '#general-properties-table'});
    pathsBetweenQueryView = appUtilities.pathsBetweenQueryView = new BackboneViews.PathsBetweenQueryView({el: '#query-pathsbetween-table'});

    toolbarButtonsAndMenu();

    loadSample('neuronal_muscle_signalling.xml');

    $(window).on('resize', dynamicResize);
    dynamicResize();

  });

  // Events triggered by sbgnviz module
  $(document).on('sbgnvizLoadSample sbgnvizLoadFile', function(event, filename) {
    appUtilities.setFileContent(filename);
  });

  $(document).on('sbgnvizUpdateEnd', function(event) {
    appUtilities.resetUndoRedoButtons();
  });

  function toolbarButtonsAndMenu() {

    $("#load-file, #load-file-icon").click(function () {
      $("#file-input").trigger('click');
    });

    $("#file-input").change(function () {
      if ($(this).val() != "") {
        var file = this.files[0];
        sbgnviz.loadSBGNMLFile(file);
        $(this).val("");
      }
    });

    $('#graph-load').click(function () {
      $('#graph-input').trigger('click');
    });

    $('#graph-input').change(function () {
      if ($(this).val() != "") {
        var file = this.files[0];
        sbgnviz.loadSBGNMLFile(file);
        $(this).val("");
      }
    });

    $('#data-load').click(function () {
      $('#data-input').trigger('click');
    });

    $('#data-input').change(function () {
      if ($(this).val() != "") {
        var file = this.files[0];
        // painter.visualizeData(file);
        var data = painter.generateRandomWellFormedData();
        var colorMap = painter.mapColors(data);
        // console.log(colorMap);
        painter.applyColors(colorMap);
        $(this).val("");
      }
    });

    var selectorToSampleFileName = {
      "#load-sample1" : 'neuronal_muscle_signalling.xml',
      "#load-sample2" : 'CaM-CaMK_dependent_signaling_to_the_nucleus.xml',
      "#load-sample3" : 'activated_stat1alpha_induction_of_the_irf1_gene.xml',
      "#load-sample4" : 'glycolysis.xml',
      "#load-sample5" : 'mapk_cascade.xml',
      "#load-sample6" : 'polyq_proteins_interference.xml',
      "#load-sample7" : 'insulin-like_growth_factor_signaling.xml',
      "#load-sample8" : 'atm_mediated_phosphorylation_of_repair_proteins.xml',
      "#load-sample9" : 'vitamins_b6_activation_to_pyridoxal_phosphate.xml'
    };

    for ( var selector in selectorToSampleFileName ) {
      (function(selector){
        $(selector).click(function (e) {
          loadSample(selectorToSampleFileName[selector]);
        });
      })(selector);
    }

    $("#delete-selected-smart, #delete-selected-smart-icon").click(function (e) {
      sbgnviz.deleteElesSmart(cy.elements(':selected'));
    });

    $("#highlight-neighbors-of-selected, #highlight-neighbors-of-selected-icon").click(function (e) {
      sbgnviz.highlightNeighbours(cy.elements(':selected'));
    });

    $("#highlight-search-menu-item").click(function (e) {
      $("#search-by-label-text-box").focus();
    });

    $("#highlight-processes-of-selected").click(function (e) {
      sbgnviz.highlightProcesses(cy.elements(':selected'));
    });

    $("#remove-highlights, #remove-highlights-icon").click(function (e) {
      sbgnviz.removeHighlights();
    });

    $("#collapse-selected,#collapse-selected-icon").click(function (e) {
      sbgnviz.collapseNodes(cy.nodes(":selected"));
    });

    $("#expand-selected,#expand-selected-icon").click(function (e) {
      sbgnviz.expandNodes(cy.nodes(":selected"));
    });

    $("#collapse-complexes").click(function (e) {
      sbgnviz.collapseComplexes();
    });
    $("#expand-complexes").click(function (e) {
      sbgnviz.expandComplexes
    });

    $("#collapse-all").click(function (e) {
      sbgnviz.collapseAll();
    });

    $("#expand-all").click(function (e) {
      sbgnviz.expandAll();
    });

    $("#perform-layout, #perform-layout-icon").click(function (e) {
      // TODO think whether here is the right place to start the spinner
      sbgnviz.startSpinner("layout-spinner");

      // If 'animate-on-drawing-changes' is false then animate option must be 'end' instead of false
      // If it is 'during' use it as is
      var preferences = {
        animate: appUtilities.getGeneralProperties().animateOnDrawingChanges ? 'end' : false
      };
      if (appUtilities.getLayoutProperties().animate == 'during') {
        delete preferences.animate;
      }
      layoutPropertiesView.applyLayout(preferences);
    });

    $("#undo-last-action, #undo-icon").click(function (e) {
      cy.undoRedo().undo();
    });

    $("#redo-last-action, #redo-icon").click(function (e) {
      cy.undoRedo().redo();
    });

    $("#save-as-png").click(function (evt) {
      sbgnviz.saveAsPng(); // the default filename is 'network.png'
    });

    $("#save-as-jpg").click(function (evt) {
      sbgnviz.saveAsJpg(); // the default filename is 'network.jpg'
    });

    //TODO: could simply keep/store original input SBGN-ML data and use it here instead of converting from JSON
    $("#save-as-sbgnml, #save-icon").click(function (evt) {
      var filename = document.getElementById('file-name').innerHTML;
      sbgnviz.saveAsSbgnml(filename);
    });

    appUtilities.sbgnNetworkContainer.on("click", ".biogene-info .expandable", function (evt) {
      var expanderOpts = {slicePoint: 150,
        expandPrefix: ' ',
        expandText: ' (...)',
        userCollapseText: ' (show less)',
        moreClass: 'expander-read-more',
        lessClass: 'expander-read-less',
        detailClass: 'expander-details',
        expandEffect: 'fadeIn',
        collapseEffect: 'fadeOut'
      };
      $(".biogene-info .expandable").expander(expanderOpts);
      expanderOpts.slicePoint = 2;
      expanderOpts.widow = 0;
    });
  }
};
