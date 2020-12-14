// --- Global Variables ---
const BASE_URL = `https://api.currentsapi.services/v1`;
const KEY = `apiKey=o8gXrGXN_nD-Foi_SJORnweKge1A3tEUqOHWNZA7QqxsIdN7`;
let lastSearchURL = "";
// --- Main ---
bootstrap();
// --- Click Handlers/Listeners ---
$("#search").on("submit", async function (event) {
  event.preventDefault();
  searchAPI();
});

$(".news-cards").on("click", ".news-card", function () {
  const data = $(this).data("article");
  createArticleModal(data);
  $(".article-modal").show();
});

$(".modal").click(function (event) {
  if (!$(event.target).is(".modal-content")) {
    $(".article-modal").hide();
  }
});

$(".article-details").on("click", "span", function () {
  $(".article-modal").hide();
});

$(".article-details").on("click", ".categories a", async function (event) {
  event.preventDefault();
  const selectedCategory = $(this).html();
  lastSearchURL = `${BASE_URL}/search?keywords=${selectedCategory}&${KEY}`;
  const results = await fetchData(lastSearchURL);
  updateContent(results);
});

$(".pagination .next, .pagination .previous").on("click", async function () {
  let { page } = await fetchData(lastSearchURL);
  if ($(".pagination").data("currentPage") == null) {
    const results = await fetchData(
      ` ${lastSearchURL}&page_number=${(page = $(this).hasClass("next")
        ? page + 1
        : page - 1)}`
    );
    $(".pagination").data("currentPage", page);
    updateContent(results);
  } else {
    page = $(".pagination").data("currentPage");
    const results = await fetchData(
      ` ${lastSearchURL}&page_number=${(page = $(this).hasClass("next")
        ? page + 1
        : page - 1)}`
    );
    $(".pagination").data("currentPage", page);
    updateContent(results);
  }
});

// --- Functions ---
//Searches inside the api using a built search url.
async function searchAPI() {
  try {
    lastSearchURL = $("#search-field").val()
      ? createSearchURL(`/search?keywords=${$("#search-field").val()}`)
      : createSearchURL(`/latest-news?`);
    console.log(lastSearchURL);
    const results = await fetchData(lastSearchURL);
    updateContent(results);
  } catch (error) {
    console.log(error);
  }
}

//Creates a search url using a passed endpoint url.
function createSearchURL(endpointURL) {
  return encodeURI(
    `${BASE_URL}${endpointURL}&category=${$(
      "#select-categories"
    ).val()}&languages=${$("#select-language").val()}&regions=${$(
      "#select-region"
    ).val()}&start_date=${$("#start-date").val()}&end_date=${$(
      "#end-date"
    ).val()}&${KEY}`
  );
}

//Prepopoulates the passed data from the url and given string label.
async function fetchAndLocallyStoreData(url, label) {
  if (localStorage.getItem(label)) {
    return JSON.parse(localStorage.getItem([label]));
  }
  const filters = await fetchData(url);
  localStorage.setItem(label, JSON.stringify(filters));
  return filters;
}

//Fetches data from the passed url/api.
async function fetchData(url) {
  changeActiveState($("#loading"));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  } finally {
    changeActiveState($("#loading"));
  }
}

//Changes the state of the passed element by adding or removing .active.
function changeActiveState(element) {
  $(element).hasClass("active")
    ? $(element).removeClass("active")
    : $(element).addClass("active");
}

//Fetches the categories for the search filter options.
async function prefetchCategoryLists() {
  try {
    const [categories, languages, regions] = await Promise.all([
      fetchAndLocallyStoreData(
        `${BASE_URL}/available/categories?${KEY}`,
        `categories`
      ),
      fetchAndLocallyStoreData(
        `${BASE_URL}/available/languages?${KEY}`,
        `languages`
      ),
      fetchAndLocallyStoreData(
        `${BASE_URL}/available/regions?${KEY}`,
        `regions`
      ),
    ]);

    //Creates category options.
    $(".categories-count").text(`(${categories.categories.length}):`);
    categories.categories.forEach((category) => {
      $(`#select-categories`).append(createOptionTag(category, category));
    });

    //Creates language options.
    $(".language-count").text(`(${Object.keys(languages.languages).length}):`);
    const languageKeys = Object.keys(languages.languages);
    const languageValues = Object.values(languages.languages);
    languageValues.forEach((option, index) => {
      const display = languageKeys[index];
      $(`#select-language`).append(createOptionTag(option, display));
    });

    //Creates region options.
    $(".region-count").text(`(${Object.keys(regions.regions).length}):`);
    const regionKeys = Object.keys(regions.regions);
    const regionValues = Object.values(regions.regions);
    regionValues.forEach((option, index) => {
      const display = regionKeys[index];
      $(`#select-region`).append(createOptionTag(option, display));
    });
  } catch (error) {
    console.error(error);
  }
}

//Creates an option tag for menus from the passed option.
function createOptionTag(option, display) {
  return $(`
  <option value="${option}">${display}</option>
  `);
}
//Renders the search preview element from the passed record.
function renderPreview(article) {
  const { image, title } = article;
  return $(`
  <div class="card news-card">
  ${
    image == "None"
      ? `<img class= "card-image" src="images/news-image-placeholder.png" />`
      : `<img class= "card-image" src="${image}" />`
  }
    ${
      checkForUndefined(title)
        ? ""
        : `<h5 class="card-content headline">${title}</h5>`
    }
  </div>`).data("article", article);
}

//Updates the preview aside to show the results of the search.
function updateContent({ news, page }) {
  const root = $(".news-cards");
  updatePagination(page);
  $(root).empty();
  $(".welcome-page").empty();
  news.forEach((article) => {
    $(root).append(renderPreview(article));
  });
}

//Creates the article details for the modal window.
function createArticleModal({
  author,
  category,
  description,
  image,
  language,
  published,
  title,
  url,
}) {
  $(".article-details").empty();
  $(".article-details").append(
    $(`<span class="close">&times;</span>
    ${
      image == "None"
        ? `<img class= "article-image" src="images/news-image-placeholder.png" />`
        : `<a href="${image}" target="_blank"><img class= "article-image" src="${image}" /></a>`
    }${checkForUndefined(title) ? "" : `<h3 class="title">${title}</h3>`}
    ${
      checkForUndefined(author)
        ? ""
        : `<h5 class="author">Author: ${author}</h5>`
    }
    ${
      checkForUndefined(url)
        ? ""
        : `<p class="original-article"><a href="${url}" target="_blank">Original Article</a></p>`
    }
    ${
      checkForUndefined(description)
        ? ""
        : `<p class="description">${description}</p>`
    }
    <section class="modal-footer flex-container">
    ${
      checkForUndefined(category)
        ? ""
        : `<p class="categories">Categories: <a href="#">${category.join(
            `</a>, <a href="#">`
          )}</a></p>`
    }
    ${
      checkForUndefined(language)
        ? ""
        : `<p class="langauge">Language: ${language}</p>`
    }
    ${
      checkForUndefined(published)
        ? ""
        : `<p class="published-date-time">Publish Date: ${published}</p>`
    }
    </section>
  `)
  );
}

//Disables and enables pagination buttons.
function updatePagination(page) {
  if (page >= 1) {
    $(".next").attr("disabled", false);
  }

  if (page <= 1) {
    $(".previous").attr("disabled", true);
  } else {
    $(".previous").attr("disabled", false);
  }
}

//Checks a passed variable for null/undefined.
function checkForUndefined(variable) {
  return variable != null ? false : true;
}

async function bootstrap() {
  prefetchCategoryLists();
}
