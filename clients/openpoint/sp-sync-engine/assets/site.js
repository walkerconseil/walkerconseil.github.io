/*
 * SP Sync Engine delivery pack: shared site chrome
 *
 * Single source of truth for the pack-wide top header and sidebar index.
 * Uses <body data-page="NN"> to work out which links are current. Adding,
 * removing, reordering or relabelling a document only ever requires editing
 * the PAGES/HOME/CTA config below. See plan/style-guide.md.
 *
 * HOME points at index.html, the pack landing page.
 */
(function () {
  var HOME = { id: "00", file: "index.html" };

  var PAGES = [
    { id: "01", file: "01-security-authority.html", label: "Security", sidebarLabel: "Security & Authority" },
    { id: "02", file: "02-sync-engine.html", label: "Sync Engine", sidebarLabel: "The Sync Engine" },
    { id: "03", file: "03-tool-adapters.html", label: "Adapters", sidebarLabel: "Tool Adapters" },
    { id: "04", file: "04-process.html", label: "Process", sidebarLabel: "Process" },
  ];

  // Get Started is pulled out of the plain tab list and styled as the
  // pack's one call to action.
  var CTA = { id: "05", file: "05-get-started.html", label: "Get Started", sidebarLabel: "Get Started" };

  var SIDEBAR_PAGES = PAGES.map(function (page) {
    return { id: page.id, number: page.id, file: page.file, label: page.sidebarLabel };
  }).concat([{ id: CTA.id, number: CTA.id, file: CTA.file, label: CTA.sidebarLabel }]);

  var HOME_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 11.5 12 4l9 7.5"/>' +
    '<path d="M5.5 9.5V19a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1V9.5"/>' +
    "</svg>";

  function renderHeader() {
    var mount = document.getElementById("top-header");
    if (!mount) return;

    var current = document.body.getAttribute("data-page");

    var homeClass = HOME.id === current ? ' class="home current"' : ' class="home"';
    var homeLink =
      '<a href="' + HOME.file + '"' + homeClass + ' title="Home">' + HOME_ICON + "Home</a>";

    var tabLinks = PAGES.map(function (page) {
      var currentClass = page.id === current ? ' class="current"' : "";
      return (
        '<a href="' + page.file + '"' + currentClass + ">" +
        "<b>" + page.id + "</b>" + page.label +
        "</a>"
      );
    }).join("");

    var ctaClass = CTA.id === current ? ' class="cta current"' : ' class="cta"';
    var ctaLink = '<a href="' + CTA.file + '"' + ctaClass + ">" + CTA.label + '<span class="cta-arrow" aria-hidden="true">›</span></a>';

    mount.innerHTML =
      '<span class="brand"><a class="op-master-brand" href="' + HOME.file + '" aria-label="Open Point home">' +
      '<img class="op-logo" src="https://www.openpoint.com/wp-content/uploads/2026/03/OPENPOINT_Logo_Green.svg" alt="Open Point"></a>' +
      '<a class="product-brand" href="' + HOME.file + '"><span class="sync-mark" aria-hidden="true"></span><span>SP Sync Engine</span></a></span>' +
      '<div class="nav-group">' +
      '<nav class="pack-nav">' + homeLink + tabLinks + "</nav>" +
      ctaLink +
      "</div>";
  }

  function renderSidebarIndex() {
    var mount = document.getElementById("sidebar-index");
    if (!mount) return;

    var current = document.body.getAttribute("data-page");
    var currentNumber = "";
    var pageLinks = SIDEBAR_PAGES.map(function (page) {
      var isCurrent = page.id === current;
      if (isCurrent) currentNumber = page.number;

      var currentClass = isCurrent ? " current" : "";
      var currentAttribute = isCurrent ? ' aria-current="page"' : "";

      return (
        '<a class="sidebar-page-link' + currentClass + '" href="' + page.file + '"' + currentAttribute + ">" +
        '<span class="sidebar-page-node" aria-hidden="true"></span>' +
        '<span class="sidebar-page-number">' + page.number + "</span>" +
        '<span class="sidebar-page-name">' + page.label + "</span>" +
        "</a>"
      );
    }).join("");

    mount.innerHTML =
      '<div class="label">SP Sync Engine</div>' +
      pageLinks +
      '<div class="sidebar-index-progress">' + currentNumber + " / 05</div>";
  }

  function renderContentFooter() {
    var mount = document.getElementById("content-footer");
    if (!mount) return;

    var current = document.body.getAttribute("data-page");
    var currentPage = SIDEBAR_PAGES.filter(function (page) {
      return page.id === current;
    })[0];
    if (!currentPage) return;

    mount.innerHTML =
      '<a class="content-footer-home" href="' + HOME.file + '">' + HOME_ICON + "Home</a>" +
      '<div class="content-footer-location">' +
      '<span class="content-footer-label">Current location</span>' +
      '<span class="content-footer-path">SP Sync Engine / <b>' + currentPage.number + " " + currentPage.label + "</b></span>" +
      "</div>";
  }

  function renderJourneyNavigation() {
    var mount = document.getElementById("journey-navigation");
    if (!mount) return;

    var current = document.body.getAttribute("data-page");
    var currentIndex = SIDEBAR_PAGES.findIndex(function (page) {
      return page.id === current;
    });
    if (currentIndex < 0) return;

    var previousPage = currentIndex > 0 ? SIDEBAR_PAGES[currentIndex - 1] : HOME;
    var nextPage = currentIndex < SIDEBAR_PAGES.length - 1 ? SIDEBAR_PAGES[currentIndex + 1] : HOME;
    var isFirstPage = currentIndex === 0;
    var isLastPage = currentIndex === SIDEBAR_PAGES.length - 1;
    var previousTitle = previousPage.number ? previousPage.number + " " + previousPage.label : "Home";
    var nextNumber = nextPage.number || "Home";
    var nextTitle = isLastPage ? "Return to SP Sync Engine" : nextPage.label;

    mount.innerHTML =
      '<a class="journey-previous" href="' + previousPage.file + '">' +
      '<span class="journey-label">' + (isFirstPage ? "Return to" : "Previous") + "</span>" +
      '<span class="journey-previous-title">' + previousTitle + "</span>" +
      "</a>" +
      '<a class="journey-next" href="' + nextPage.file + '">' +
      '<span class="journey-next-head">' +
      '<span class="journey-label">' + (isLastPage ? "Journey complete" : "Continue to " + nextNumber) + "</span>" +
      '<span class="journey-next-number">' + nextNumber + "</span>" +
      "</span>" +
      '<span class="journey-next-title">' + nextTitle + "</span>" +
      '<span class="journey-arrow" aria-hidden="true">&gt;</span>' +
      "</a>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderSidebarIndex();
    renderJourneyNavigation();
    renderContentFooter();
  });
})();
