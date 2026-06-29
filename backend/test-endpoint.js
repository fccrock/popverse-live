const fetch = require("node-fetch");

async function test() {
  try {
    // 1. Get a user
    const userRes = await fetch("http://localhost:5000/api/users/cinemaphile");
    const user = await userRes.json();
    console.log("User:", user);

    // 2. Create a collection
    const createRes = await fetch("http://localhost:5000/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "cinemaphile",
        title: "Test Collection",
        description: ""
      })
    });
    const collection = await createRes.json();
    console.log("Created collection:", collection.id);

    // 3. Add an item
    const itemRes = await fetch(`http://localhost:5000/api/collections/${collection.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId: 12345,
        mediaType: "movie",
        title: "Test Movie",
        posterPath: "/test.jpg",
        year: "2023"
      })
    });
    const itemText = await itemRes.text();
    console.log("Add item response:", itemRes.status, itemText);

  } catch (err) {
    console.error(err);
  }
}
test();
