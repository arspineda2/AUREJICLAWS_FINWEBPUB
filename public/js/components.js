// Fetch one shared HTML fragment and replace its placeholder with the fragment markup.
async function loadComponent(placeholder) {
  const componentPath = placeholder.dataset.include;

  try {
    const response = await fetch(componentPath);
    if (!response.ok) {
      throw new Error(`Could not load ${componentPath}: HTTP ${response.status}`);
    }

    placeholder.outerHTML = await response.text();
  } catch (error) {
    // Keep the page usable while making a missing component visible to users and developers.
    console.error(error);
    placeholder.textContent = "This page component could not be loaded.";
    placeholder.setAttribute("role", "alert");
  }
}

// Load all declared fragments, then highlight the navigation link for this page.
async function loadPageComponents() {
  const placeholders = [...document.querySelectorAll("[data-include]")];
  await Promise.all(placeholders.map(loadComponent));

  // Components must be loaded before querying their navigation links.
  const currentPage = window.location.pathname.split("/").pop() || "HomePage.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const linkPage = new URL(link.href).pathname.split("/").pop();
    if (linkPage === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  // Let page scripts initialize after shared header controls have been inserted.
  document.dispatchEvent(new Event("components:loaded"));
}

// Start loading the shared header and footer when this script runs.
loadPageComponents();
