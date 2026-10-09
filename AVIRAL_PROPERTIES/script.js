const KEY = "aviralProperties";

let properties = JSON.parse(localStorage.getItem(KEY) || "[]");
let editingId = null;

function $(id) {
    return document.getElementById(id);
}

function saveData() {
    localStorage.setItem(KEY, JSON.stringify(properties));
    updateCount();
    refreshSelects();
}

function updateCount() {
    $("totalCount").textContent = properties.length;
}

function showPanel(id) {
    $("dashboard").classList.add("hidden");

    document.querySelectorAll(".panel").forEach(panel => {
        panel.classList.add("hidden");
    });

    $(id).classList.remove("hidden");

    const titles = {
        addPanel: "Add Property",
        viewPanel: "All Properties",
        searchPanel: "Search Property",
        updatePanel: "Update Property",
        deletePanel: "Delete Property"
    };

    $("pageTitle").textContent = titles[id] || "Dashboard";

    if (id === "updatePanel" || id === "deletePanel") {
        refreshSelects();
    }

    if (id === "searchPanel") {
        $("searchInput").value = "";
        renderProperties($("searchResults"), properties);
    }
}

function goHome() {
    document.querySelectorAll(".panel").forEach(panel => {
        panel.classList.add("hidden");
    });

    $("dashboard").classList.remove("hidden");
    $("pageTitle").textContent = "Dashboard";
    $("addForm").reset();
    $("updateForm").reset();
    $("updateForm").classList.add("hidden");
    $("updateSelect").value = "";
    editingId = null;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function readPhoto(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.size) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image file."));
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            reject(new Error("Photo must be 2 MB or smaller."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read photo."));
        reader.readAsDataURL(file);
    });
}

function formData(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.photo;
    return data;
}

$("addForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
        const data = formData(this);
        const photo = await readPhoto(this.elements.photo.files[0]);

        properties.push({
            id: Date.now(),
            ...data,
            photo
        });

        saveData();
        this.reset();

        alert("Property added successfully!");
        viewProperties();
    } catch (error) {
        alert(error.message);
    }
});

function propertyCard(p) {
    const photo = p.photo
        ? `<img src="${p.photo}" alt="Property photo">`
        : "";

    return `
        <article class="property-card">
            ${photo}
            <div class="property-info">
                <h3>${escapeHTML(p.plot)}</h3>
                <p><b>Owner:</b> ${escapeHTML(p.owner)}</p>
                <p><b>Size:</b> ${escapeHTML(p.size)}</p>
                <p><b>Phone:</b> ${escapeHTML(p.phone)}</p>
                <p><b>Location:</b> ${escapeHTML(p.location)}</p>
                <p><b>Type:</b> ${escapeHTML(p.type)}</p>
                <p><b>Address:</b> ${escapeHTML(p.address)}</p>
                <p class="price">${money(p.price)}</p>
            </div>
        </article>
    `;
}

function renderProperties(container, list) {
    if (list.length === 0) {
        container.innerHTML =
            '<p class="empty-message">No properties found.</p>';
        return;
    }

    container.innerHTML = list.map(propertyCard).join("");
}

function viewProperties() {
    showPanel("viewPanel");
    renderProperties($("propertyList"), properties);
}

$("searchInput").addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();

    const results = properties.filter(p => {
        const allData = [
            p.plot, p.size, p.owner, p.phone,
            p.location, p.type, p.address, p.price
        ].join(" ").toLowerCase();

        return allData.includes(query);
    });

    renderProperties($("searchResults"), results);
});

function refreshSelects() {
    const options = properties.map(p =>
        `<option value="${p.id}">${escapeHTML(p.plot)} - ${escapeHTML(p.owner)}</option>`
    ).join("");

    $("updateSelect").innerHTML =
        '<option value="">Select property</option>' + options;

    $("deleteSelect").innerHTML =
        '<option value="">Select property</option>' + options;
}

$("updateSelect").addEventListener("change", function () {
    const p = properties.find(item => item.id === Number(this.value));
    const form = $("updateForm");

    editingId = p ? p.id : null;

    if (!p) {
        form.classList.add("hidden");
        return;
    }

    form.classList.remove("hidden");

    ["plot", "size", "owner", "phone", "location",
     "type", "price", "address"].forEach(name => {
        form.elements[name].value = p[name] ?? "";
    });

    form.elements.photo.value = "";
});

$("updateForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const index = properties.findIndex(p => p.id === editingId);

    if (index === -1) {
        alert("Please select a property first.");
        return;
    }

    try {
        const data = formData(this);
        const file = this.elements.photo.files[0];

        const photo = file && file.size
            ? await readPhoto(file)
            : properties[index].photo;

        properties[index] = {
            ...properties[index],
            ...data,
            photo
        };

        saveData();
        alert("Property updated successfully!");
        viewProperties();
    } catch (error) {
        alert(error.message);
    }
});

function deleteSelected() {
    const id = Number($("deleteSelect").value);
    const p = properties.find(item => item.id === id);

    if (!p) {
        alert("Please select a property first.");
        return;
    }

    if (!confirm("Delete property " + p.plot + "?")) {
        return;
    }

    properties = properties.filter(item => item.id !== id);
    saveData();

    alert("Property deleted successfully!");
}

function deleteAll() {
    if (properties.length === 0) {
        alert("No properties to delete.");
        return;
    }

    if (!confirm("Are you sure you want to delete ALL properties?")) {
        return;
    }

    properties = [];
    saveData();

    alert("All properties deleted.");
}

function exitDashboard() {
    if (!confirm("Do you want to exit the dashboard?")) {
        return;
    }

    document.querySelectorAll(".panel").forEach(panel => {
        panel.classList.add("hidden");
    });

    $("dashboard").classList.add("hidden");
    $("pageTitle").textContent = "Goodbye!";
}

updateCount();
refreshSelects();
