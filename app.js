const express = require('express');
const path = require('path'); // Core Node.js module for working with file paths
const methodOverride = require('method-override'); // For PUT/DELETE from forms
const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
// Set EJS as the view engine
app.set('view engine', 'ejs');
// Set the directory for EJS views
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON bodies (for API, though forms will use urlencoded)
app.use(express.json());
// Middleware to parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Middleware for method-override (to use PUT/DELETE from forms)
// It looks for a _method query parameter
app.use(methodOverride('_method'));

// Serve static files (like CSS, client-side JS if you add any)
app.use(express.static(path.join(__dirname, 'public')));


// --- In-memory "database" ---
let items = [
    { id: 1, name: "Laptop", description: "A powerful computing device" },
    { id: 2, name: "Keyboard", description: "Mechanical keyboard with RGB" }
];
let currentId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;


// --- UI Routes ---

// Root route: Display all items
app.get('/', (req, res) => {
    res.redirect('/ui/items'); // Redirect to the main items UI page
});

app.get('/ui/items', (req, res) => {
    res.render('items/index', { items: items, pageTitle: "All Items" });
});

// Show form to create a new item
app.get('/ui/items/new', (req, res) => {
    res.render('items/new', { pageTitle: "Add New Item" });
});

// Show form to edit an existing item
app.get('/ui/items/:id/edit', (req, res) => {
    const itemId = parseInt(req.params.id);
    const item = items.find(i => i.id === itemId);
    if (item) {
        res.render('items/edit', { item: item, pageTitle: `Edit Item: ${item.name}` });
    } else {
        res.status(404).send("Item not found for editing"); // Or render an error page
    }
});


// --- API/Action Routes (these are hit by form submissions or API calls) ---

// CREATE: Add a new item (handles form submission from /ui/items/new)
app.post('/items', (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        // For API calls, send JSON. For UI, maybe render form with error.
        if (req.accepts('html')) {
            return res.render('items/new', {
                pageTitle: "Add New Item",
                error: "Name is required",
                name: name,
                description: description
            });
        }
        return res.status(400).json({ message: "Name is required" });
    }
    const newItem = { id: currentId++, name, description: description || "" };
    items.push(newItem);
    console.log(`Created item: ${JSON.stringify(newItem)}`);

    if (req.accepts('html')) {
        res.redirect('/ui/items'); // Redirect to the list after creating
    } else {
        res.status(201).json(newItem); // API response
    }
});

// READ: Get all items (API endpoint)
app.get('/items', (req, res) => {
    console.log(`Fetching all items. Count: ${items.length}`);
    res.json(items); // This is the API endpoint
});

// READ: Get a single item by ID (API endpoint)
app.get('/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const item = items.find(i => i.id === itemId);
    if (item) {
        console.log(`Fetching item by ID: ${itemId}. Found: ${JSON.stringify(item)}`);
        res.json(item); // API response
    } else {
        console.log(`Fetching item by ID: ${itemId}. Not found.`);
        res.status(404).json({ message: "Item not found" }); // API response
    }
});

// UPDATE: Modify an existing item by ID (handles form submission from /ui/items/:id/edit)
// Note: HTML forms use POST, but method-override changes it to PUT
app.put('/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const { name, description } = req.body;
    const itemIndex = items.findIndex(i => i.id === itemId);

    if (itemIndex !== -1) {
        if (!name) {
            if (req.accepts('html')) {
                const item = items[itemIndex];
                return res.render('items/edit', {
                    item: { ...item, name: '', description: description }, // Send back potentially invalid data
                    pageTitle: `Edit Item: ${items[itemIndex].name}`,
                    error: "Name cannot be empty for update"
                });
            }
            return res.status(400).json({ message: "Name cannot be empty for update" });
        }
        items[itemIndex] = { ...items[itemIndex], name, description: description !== undefined ? description : items[itemIndex].description };
        console.log(`Updated item ID ${itemId}: ${JSON.stringify(items[itemIndex])}`);

        if (req.accepts('html')) {
            res.redirect('/ui/items'); // Redirect to the list after updating
        } else {
            res.json(items[itemIndex]); // API response
        }
    } else {
        console.log(`Updating item ID: ${itemId}. Not found.`);
        if (req.accepts('html')) {
            res.status(404).send("Item not found for update");
        } else {
            res.status(404).json({ message: "Item not found" }); // API response
        }
    }
});

// DELETE: Remove an item by ID (handles form submission with method-override)
app.delete('/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = items.findIndex(i => i.id === itemId);

    if (itemIndex !== -1) {
        const deletedItem = items.splice(itemIndex, 1);
        console.log(`Deleted item ID ${itemId}: ${JSON.stringify(deletedItem[0])}`);

        if (req.accepts('html')) {
            res.redirect('/ui/items'); // Redirect to the list after deleting
        } else {
            res.status(200).json({ message: "Item deleted successfully", item: deletedItem[0] });
        }
    } else {
        console.log(`Deleting item ID: ${itemId}. Not found.`);
        if (req.accepts('html')) {
            res.status(404).send("Item not found for deletion");
        } else {
            res.status(404).json({ message: "Item not found" });
        }
    }
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Server running. UI available at http://localhost:${port}/ui/items`);
    console.log(`API base URL: http://localhost:${port}/items`);
});