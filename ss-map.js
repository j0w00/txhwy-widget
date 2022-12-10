import { texasPath } from "./js/texas-svg.js";

// add map styles
$("head").append(
  '<link rel="stylesheet" type="text/css" href="./style.min.css">'
);

// get map json/data
async function getMapData() {
  return await fetch("./data/data.json")
    .then((response) => (response.ok ? response.json() : "Error"))
    .then((data) => data)
    .catch((error) => error);
}

async function init() {
  const mapData = await getMapData();

  // initial state
  let selectedMap = "map1";
  let selectedPin = "pin1";
  let currentHighlight = 0;

  // render data dependent elements
  initialRender();

  // elements
  const body = document.body;
  const ssMapContainer = document.getElementById("state-services-map");
  const accordionTabs = document.getElementById("ss-map__tabs");
  const modal = document.getElementById("ss-map__modal");
  const highlightModal = new bootstrap.Modal(modal);
  const modalTitleEls = document.querySelectorAll(".modal-title");
  const slider = document.getElementById("ss-map__slider");
  const mapGraphics = document.querySelectorAll(".ss-map__graphic");
  const carouselItems = document.querySelectorAll(".carousel-item");
  const accordionButtons = document.querySelectorAll(".accordion-button");
  const accordionContentEls = document.querySelectorAll(".accordion-collapse");

  // update dom
  setMapColors();
  setActiveAccordion();
  setActiveMap();
  setActiveSlide();

  // event listeners
  ssMapContainer.addEventListener("click", handleMapPinClick);
  accordionTabs.addEventListener("show.bs.collapse", handleAccordionOpen);
  accordionTabs.addEventListener("hide.bs.collapse", handleAccordionClose);
  slider.addEventListener("slide.bs.carousel", handleSliderClick);
  modal.addEventListener("hidden.bs.modal", handleModalClose);

  // handle map pin click
  function handleMapPinClick(event) {
    if (event.target.classList?.contains("ss-map__pin")) {
      selectedPin = event.target.dataset?.pin;

      // get index of first highlight for this pin
      currentHighlight = mapData?.highlights.findIndex((highlight) => {
        return (
          highlight.parentMap === selectedMap &&
          highlight.parentPin === selectedPin
        );
      });

      setModalTitle();
      setActiveSlide();
      showModal();
    }
  }

  // handle accordion tab open
  function handleAccordionOpen(event) {
    const heading = event.target.previousElementSibling;
    heading.classList.add("accordion-open");
    selectedMap = heading.firstElementChild.dataset?.mapId;
    setActiveMap();
  }

  // handle accordion tab close
  function handleAccordionClose(event) {
    const heading = event.target.previousElementSibling;
    heading.classList.remove("accordion-open");
  }

  // handle slider controls click
  function handleSliderClick(event) {
    currentHighlight = event.to;
    selectedMap = mapData?.highlights[currentHighlight]?.parentMap;
    selectedPin = mapData?.highlights[currentHighlight]?.parentPin;
    setModalTitle();
    setActiveAccordion();
    setActiveMap();
    highlightModal.handleUpdate();
  }

  // handle modal close
  function handleModalClose() {
    body.classList.remove("map-modal-open");
  }

  // initial render to dom
  function initialRender() {
    let maps = "";
    let tabs = "";
    let highlights = "";

    // loop through maps
    mapData?.maps?.forEach(
      ({ id: mapId, title, description, color, pins }) => {
        let mapPins = "";

        // loop through this map's pins
        pins.forEach(({ id: pinId, title, coordinates }) => {
          // get highlights
          const highlights = getPinHighlights(mapId, pinId);
          const highlightCount = highlights?.length ?? 0;

          // create html for this pin
          if (highlightCount > 0) {
            mapPins += `<button
          class="ss-map__pin ${highlightCount > 1 ? `pin--count` : ``}"
          data-pin="${pinId}"
          data-highlight-count="${highlightCount > 1 ? highlightCount : ``}"
          style="left: ${coordinates[0]}%; bottom: ${coordinates[1]}%;">
            <i class="fas fa-plus"></i>
        </button>`;
          }
        });

        // create html for this map
        const singleMap = `<div
      class="ss-map__graphic"
      id="ss-map__${mapId}"
      style="--map-color: ${color}; display: none;">
      ${texasPath}
      ${mapPins}
    </div>`;
        maps += singleMap;

        // create html for this map's accordion tab
        const tab = `<div
    class="accordion-item"
    style="--map-color: ${color}; --map-color-light: ${color}40;">
      <h3 class="accordion-header" id="heading-${mapId}">
        <button
          class="accordion-button"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#collapse-${mapId}"
          aria-expanded="true"
          aria-controls="collapse-${mapId}"
          data-map-id="${mapId}"
          style="background-color: ${color};">
          ${title}
        </button>
      </h3>
      <div
        id="collapse-${mapId}"
        class="accordion-collapse collapse"
        aria-labelledby="heading-${mapId}"
        data-bs-parent="#ss-map__tabs"
        data-map-id="${mapId}">
          <div class="accordion-body">
            <div class="accordion-description">
              ${description}
            </div>
            <div class="accordion-map" style="display: none">
              <div class="ss-map__maps--mobile">
                <div class="ss-map__graphic--mobile">
                  ${texasPath}
                  <div class="ss-map__overlay">${mapPins}</div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>`;
        tabs += tab;
      }
    );

    // loop through highlights
    mapData?.highlights?.forEach(
      (
        { title, subTitle, body, bids, website, image, parentMap, parentPin },
        idx
      ) => {
        // highlight action btns
        const actions = `<div class="item__actions container-fluid py-3">
            ${
              bids
                ? `<div class="item__bids mb-2 mb-md-0 me-md-2">
                <h6 class="mb-md-0 me-md-3">Bid Proposals</h6>
                ${bids
                  ?.map((bid) => {
                    return `<a
                        href="${bid.link}"
                        target="_blank"
                        class="btn btn--action mb-2 mb-md-0 me-md-2">
                        ${bid.title}
                        <i class="fa-solid fa-share"></i>
                    </a>`;
                  })
                  .join("")}
            </div>`
                : ``
            }
            ${
              website
                ? `<div class="item__website">
                <h6 class="mb-md-0 me-md-3">More Information</h6>
                <a
                    href="${website}"
                    target="_blank"
                    class="btn btn--action mb-2 mb-md-0 me-md-2">
                    Website
                </a>
            </div>`
                : ``
            }
        </div>`;

        // create html for this highlight
        const highlight = `<div
        class="carousel-item"
        data-highlight-id="${idx}">
        <div class="carousel-item__inner">
          <div class="carousel-item__grid">
            <div
            class="item__header container-fluid py-3"
            style="background-color: var(--color-${parentMap});">
              <h5>${title}</h5>
              <h6>${subTitle}</h6>
            </div>
            <div class="item__image" style="background-image:url('${image}');"></div>
            <div class="item__body container-fluid py-3">${body}</div>
          </div>
          ${actions}
        </div>
      </div>`;
        highlights += highlight;
      }
    );

    const initialHTMLElements = `<div class="container-md py-5">
    <div class="row">
      <div class="col-md-6 pe-md-5 ss-map__maps">${maps}</div>
      <div class="col-md-6 ps-lg-5 ss-map__body">
        <h2>${mapData?.sectionTitle}</h2>
        <div class="accordion" id="ss-map__tabs">${tabs}</div>
      </div>
    </div>
  </div>

  <div
  class="modal fade"
  id="ss-map__modal"
  tabindex="-1"
  aria-labelledby="modal-label"
  aria-hidden="true"
  >
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">Modal</h4>
          <div class="modal-actions">
            <button
              type="button"
              class="btn btn--modal-action"
              data-bs-target="#ss-map__slider"
              data-bs-slide="prev"
            >
              <i class="fa-solid fa-angle-left"></i>
              <span class="visually-hidden">Previous</span>
            </button>
            <button
              type="button"
              class="btn btn--modal-action"
              data-bs-target="#ss-map__slider"
              data-bs-slide="next"
            >
              <i class="fa-solid fa-angle-right"></i>
              <span class="visually-hidden">Next</span>
            </button>
            <button
              type="button"
              class="btn btn--modal-action"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i class="fa-solid fa-xmark"></i>
              <span class="visually-hidden">Close</span>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div
            id="ss-map__slider"
            class="carousel slide"
            data-bs-interval="false"
          >
            <div class="carousel-inner">${highlights}</div>
          </div>
        </div>
        <div class="modal-footer">
          <h4 class="modal-title">Modal</h4>
          <div class="modal-actions">
            <button
              type="button"
              class="btn btn--modal-action"
              data-bs-target="#ss-map__slider"
              data-bs-slide="prev"
            >
              <i class="fa-solid fa-angle-left"></i>
              <span class="visually-hidden">Previous</span>
            </button>
            <button
              type="button"
              class="btn btn--modal-action"
              data-bs-target="#ss-map__slider"
              data-bs-slide="next"
            >
              <i class="fa-solid fa-angle-right"></i>
              <span class="visually-hidden">Next</span>
            </button>
            <button
              type="button"
              class="btn btn--modal-action"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <i class="fa-solid fa-xmark"></i>
              <span class="visually-hidden">Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;

    $("#state-services-map").append(initialHTMLElements);
  }

  // add map color attributes to container
  function setMapColors() {
    mapData?.maps?.forEach(
      ({ id: mapId, title, description, color, pins }) => {
        const dataStr = `--color-${mapId}`;
        ssMapContainer.style.setProperty(dataStr, color);
      }
    );
  }

  // open active accordion tab
  function setActiveAccordion() {
    accordionButtons.forEach((item) => {
      const mapId = item.dataset?.mapId;
      mapId !== selectedMap
        ? item.classList?.add("collapsed")
        : item.classList?.remove("collapsed");
    });

    accordionContentEls.forEach((item) => {
      const mapId = item.dataset?.mapId;
      const prevClassList = item.previousElementSibling.classList;

      if (mapId === selectedMap) {
        item.classList?.add("show");
        prevClassList.add("accordion-open");
      } else {
        item.classList?.remove("show");
        prevClassList.remove("accordion-open");
      }
    });
  }

  // display selected map
  function setActiveMap() {
    mapGraphics.forEach((mapGraphic) => {
      const needle = `ss-map__${selectedMap}`;
      const mapId = mapGraphic.id;
      mapGraphic.style.display = mapId === needle ? "block" : "none";
    });
  }

  // update active class on slides
  function setActiveSlide() {
    carouselItems.forEach((slide) => {
      const highlightId = slide.dataset?.highlightId;

      highlightId == currentHighlight
        ? slide.classList?.add("active")
        : slide.classList?.remove("active");
    });
  }

  // update modal title
  function setModalTitle() {
    const selectedMapObject = mapData?.maps.find(
      (map) => map.id === selectedMap
    );
    const selectedPinObject = selectedMapObject?.pins.find(
      (pin) => pin.id === selectedPin
    );
    const currentHighlightObject = mapData?.highlights[currentHighlight];
    const highlights = getPinHighlights(selectedMap, selectedPin);
    const highlightCount = highlights?.length ?? 0;

    let currentGroupIndex = highlights.findIndex((highlight) => {
      return highlight === currentHighlightObject;
    });

    currentGroupIndex++;

    modalTitleEls.forEach((title) => {
      const modalTitle =
        highlightCount > 1
          ? `${selectedPinObject?.title} (${currentGroupIndex} of ${highlightCount})`
          : selectedPinObject?.title;
      title.innerText = modalTitle;
    });
  }

  // show modal
  function showModal() {
    highlightModal.show();

    // move backdrop to section container
    const modalBackdrop = document.querySelector(".modal-backdrop");
    ssMapContainer.append(modalBackdrop);

    // update body classes
    body.style.paddingRight = "";
    body.style.overflow = "";
    body.classList.add("map-modal-open");
  }

  // get map/pin's highlights
  function getPinHighlights(map, pin) {
    return mapData?.highlights.filter(
      (highlight) => highlight.parentMap === map && highlight.parentPin === pin
    );
  }
}

init();
