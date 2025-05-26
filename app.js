const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory "database"
let items = [
    { id: 1, name: "Laptop", description: "A powerful computing device" },
    { id: 2, name: "Keyboard", description: "Mechanical keyboard with RGB" }
];
let currentId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;

// --- CRUD Endpoints ---

// CREATE: Add a new item
app.post('/items', (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    const newItem = { id: currentId++, name, description: description || "" };
    items.push(newItem);
    console.log(`Created item: ${JSON.stringify(newItem)}`);
    res.status(201).json(newItem);
});

// READ: Get all items
app.get('/items', (req, res) => {
    console.log(`Fetching all items. Count: ${items.length}`);
    res.json(items);
});

// READ: Get a single item by ID
app.get('/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const item = items.find(i => i.id === itemId);
    if (item) {
        console.log(`Fetching item by ID: ${itemId}. Found: ${JSON.stringify(item)}`);
        res.json(item);
    } else {
        console.log(`Fetching item by ID: ${itemId}. Not found.`);
        res.status(404).json({ message: "Item not found" });
    }
});

// UPDATE: Modify an existing item by ID
app.put('/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const { name, description } = req.body;
    const itemIndex = items.findIndex(i => i.id === itemId);

    if (itemIndex !== -1) {
        if (!name) {
            return res.status(400).json({ message: "Name cannot be empty for update" });
        }
        items[itemIndex] = { ...items[itemIndex], name, description: description !== undefined ? description : items[itemIndex].description };
        console.log(`Updated item ID ${itemId}: ${JSON.stringify(items[itemIndex])}`);
        res.json(items[itemIndex]);
    } else {
        console.log(`Updating item ID: ${itemId}. Not found.`);
        res.status(404).json({ message: "Item not found" });
    }
});

// DELETE: Remove an item by ID
app.delete('/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = items.findIndex(i => i.id === itemId);

    if (itemIndex !== -1) {
        const deletedItem = items.splice(itemIndex, 1);
        console.log(`Deleted item ID ${itemId}: ${JSON.stringify(deletedItem[0])}`);
        res.status(200).json({ message: "Item deleted successfully", item: deletedItem[0] });
        // res.status(204).send(); // Alternatively, send no content
    } else {
        console.log(`Deleting item ID: ${itemId}. Not found.`);
        res.status(404).json({ message: "Item not found" });
    }
});

// --- Start the server ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});