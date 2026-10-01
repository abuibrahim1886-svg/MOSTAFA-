const fs = require('fs');
const path = require('path');
// Since syncStore is not exported, I can't directly read it.
// But I can try to read the data from MongoDB directly if I knew how, 
// or just look at how server.ts saves it.

// Let's just create a new endpoint in server.ts to return the current syncStore
console.log("Not possible to directly read syncStore from another file.");
