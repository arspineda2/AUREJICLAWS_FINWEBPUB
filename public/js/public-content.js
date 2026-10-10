document.addEventListener("components:loaded", loadPublicContent);

async function loadPublicContent() {
  try {
    const response = await fetch("/api/site-content");
    const result = await response.json();
    if (!response.ok || !result.success || !result.content) {
      throw new Error(result.message || "Site content could not be loaded.");
    }
    renderHeroSlides(result.content.heroSlides);
    renderInstagramPosts(result.content);
    renderServiceMenu(result.content.serviceMenu);
    renderContactDetails(result.content.contact);
  } catch (error) {
    console.error("Public site content could not be loaded:", error);
  }
}

function publicImageUrl(value) {
  return value.startsWith("/") ? value : `/${value}`;
}

function publicPageUrl(value) {
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

function renderHeroSlides(slides) {
  const slider = document.querySelector(".hero-slider");
  const dotsContainer = document.querySelector(".slider-dots");
  if (!slider || !dotsContainer || !Array.isArray(slides) || !slides.length) return;

  slider.replaceChildren();
  dotsContainer.replaceChildren();
  slides.forEach((slide, index) => {
    const panel = document.createElement("div");
    panel.className = `slide${index === 0 ? " active" : ""}`;
    panel.style.backgroundImage = `url("${publicImageUrl(slide.imageUrl)}")`;

    const content = document.createElement("div");
    content.className = "hero-content";
    const title = document.createElement("h1");
    title.className = "hero-title";
    title.textContent = slide.title;
    const description = document.createElement("p");
    description.className = "hero-description";
    description.textContent = slide.description;
    content.append(title, description);
    if (slide.buttonText) {
      const link = document.createElement("a");
      link.className = "btn btn-primary";
      link.href = publicPageUrl(slide.buttonHref);
      link.textContent = slide.buttonText;
      content.appendChild(link);
    }
    panel.appendChild(content);
    slider.appendChild(panel);

    const dot = document.createElement("button");
    dot.className = `dot${index === 0 ? " active" : ""}`;
    dot.dataset.index = String(index);
    dot.setAttribute("aria-label", `Slide ${index + 1}`);
    dotsContainer.appendChild(dot);
  });

  let currentIndex = 0;
  let slideTimer;
  const panels = [...slider.querySelectorAll(".slide")];
  const dots = [...dotsContainer.querySelectorAll(".dot")];
  const showSlide = (index) => {
    panels[currentIndex].classList.remove("active");
    dots[currentIndex].classList.remove("active");
    currentIndex = index;
    panels[currentIndex].classList.add("active");
    dots[currentIndex].classList.add("active");
  };
  const startAutoSlide = () => {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => showSlide((currentIndex + 1) % panels.length), 8000);
  };
  dots.forEach((dot) => dot.addEventListener("click", () => {
    showSlide(Number(dot.dataset.index));
    startAutoSlide();
  }));
  startAutoSlide();
}

function renderInstagramPosts(content) {
  const gallery = document.querySelector(".gallery-grid");
  if (!gallery || !Array.isArray(content.instagramPosts)) return;
  gallery.replaceChildren();
  content.instagramPosts.forEach((post, index) => {
    const link = document.createElement("a");
    link.className = index === 0 ? "gallery-reelitem" : "gallery-item";
    link.href = post.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const image = document.createElement("img");
    image.src = publicImageUrl(post.imageUrl);
    image.alt = `Aureji Claws Instagram ${index === 0 ? "reel" : "post"} ${index + 1}`;
    const label = document.createElement("span");
    label.className = "view-post-text";
    label.textContent = index === 0 ? "View Reel" : "View Post";
    link.append(image, label);
    gallery.appendChild(link);
  });

  const handle = document.querySelector(".instagram-handle");
  if (handle && content.contact?.instagram) {
    handle.href = `https://instagram.com/${content.contact.instagram.replace(/^@/, "")}`;
    handle.lastChild.textContent = `\n          @${content.contact.instagram.replace(/^@/, "")}\n        `;
  }
}

function renderServiceMenu(menu) {
  const container = document.getElementById("serviceCategories");
  if (!container || !menu || !Array.isArray(menu.categories)) return;
  const title = document.getElementById("serviceMenuTitle");
  const note = document.getElementById("serviceMenuNote");
  const button = document.getElementById("serviceMenuButton");
  if (title) title.textContent = menu.title;
  if (note) note.textContent = menu.note;
  if (button) button.textContent = menu.buttonText;

  container.replaceChildren();
  menu.categories.forEach((category) => {
    const section = document.createElement("section");
    section.className = "service-section";
    const heading = document.createElement("h2");
    heading.className = "category-title";
    heading.textContent = category.title;
    const list = document.createElement("ul");
    list.className = "price-list";
    category.items.forEach((item) => {
      const row = document.createElement("li");
      const name = document.createElement("span");
      name.className = "item-name";
      name.textContent = item.name;
      const price = document.createElement("span");
      price.className = "item-price";
      price.textContent = item.price;
      row.append(name, price);
      list.appendChild(row);
    });
    section.append(heading, list);
    container.appendChild(section);
  });

  const serviceSelect = document.getElementById("service");
  if (serviceSelect) {
    const placeholder = new Option("Select a service", "", true, true);
    placeholder.disabled = true;
    serviceSelect.replaceChildren(placeholder);
    menu.categories.forEach((category) => {
      if (!category.items.length) return;
      const group = document.createElement("optgroup");
      group.label = category.title.replace(/:$/, "");
      category.items.forEach((item) => group.appendChild(new Option(item.name, item.id)));
      serviceSelect.appendChild(group);
    });
  }
}

function renderContactDetails(contact) {
  if (!contact) return;
  document.querySelectorAll('[data-site-contact="email"]').forEach((email) => {
    email.href = `mailto:${contact.email}`;
    email.textContent = contact.email;
  });
  document.querySelectorAll('[data-site-contact="phone"]').forEach((phone) => {
    phone.textContent = contact.phone;
  });
  const instagram = document.getElementById("contactInstagram");
  if (instagram) {
    instagram.href = `https://instagram.com/${contact.instagram.replace(/^@/, "")}`;
    instagram.textContent = `@${contact.instagram.replace(/^@/, "")}`;
  }
}
