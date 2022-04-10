// create DB variable for connection
let db;

const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// Create function for submit of new transaction
function saveRecord(record) {
  // open a new transaction with the database
  const transaction = db.transaction(["new_transaction"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_transaction");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access your object store
  const budgetObjectStore = transaction.objectStore("new_transaction");

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // POST if there is data in indexedDb's store
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // access the new transaction object store
          const budgetObjectStore = transaction.objectStore("new_transaction");
          // clear all items in your store
          budgetObjectStore.clear();

          alert("All saved budget transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}
// Add browser event listener to check for change in network status
window.addEventListener("online", uploadTransaction);
