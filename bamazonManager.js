var inquirer = require("inquirer");
var mysql = require("mysql");

var connection = mysql.createConnection
    (
        {
            host: "localhost",
            port: 8889,
            user: "root",
            password: "root",
            database: "bamazon"
        }
    );

connection.connect(function (err) {
    if (err) {
        throw err;
    }

    managerOptions();
});

function printData(data) {
    data.forEach(function (element) {
        console.log("ID: " + element.item_id);
        console.log("Product: " + element.product_name);
        console.log("Department: " + element.department_name);
        console.log("Price: " + element.price);
        console.log("# Available: " + element.stock_quantity);
        console.log("-------------------------------------------------");
    });
}

function runAgain() {
    inquirer.prompt
        (
        [
            {
                type: "confirm",
                name: "newOption",
                message: "Would you like to do another option?",
                default: true
            }
        ]
        ).then(function (response) {
            if (response.newOption == true) {
                managerOptions();
            }
            else {
                connection.end();
            }
        });
}

function managerOptions() {
    inquirer.prompt
        (
        [
            {
                type: "list",
                name: "option",
                message: "What would you like to do?",
                choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"]
            }
        ]
        ).then(function (response) {
            switch (response.option) {
                case "View Products for Sale":
                    viewProducts();
                    break;
                case "View Low Inventory":
                    viewLowInventory();
                    break;
                case "Add to Inventory":
                    addToInventory();
                    break;
                case "Add New Product":
                    addNewProduct();
                    break;
            }
        });
}

function viewProducts() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) {
            throw err;
        }

        printData(res);

        runAgain();
    });
}

function viewLowInventory() {
    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function (err, res) {
        if (err) {
            throw err;
        }

        printData(res);

        runAgain();
    });
}


function addToInventory() {

    connection.query("SELECT * FROM products", function (err, response) {

        if (err) {
            throw err;
        }

        var productArray = [];

        response.forEach(function(element)
        {
            productArray.push(element.product_name);
        });

        inquirer.prompt
            (
            [
                {
                    type: "list",
                    name: "product",
                    message: "Which product would you like to add inventory to?",
                    choices: productArray
                },
                {
                    type: "input",
                    name: "quantity",
                    message: "How many would you like to add?"
                }
            ]
            ).then(function (response) {
                var currentQuantity;
                var newQuantity;
                var addQuantity = response.quantity;
                var currentProduct;

                connection.query("SELECT * FROM products WHERE ?",
                    {
                        product_name: response.product
                    }, function (err, response) {
                        currentQuantity = response[0].stock_quantity;
                        newQuantity = parseInt(currentQuantity) + parseInt(addQuantity);
                        currentProduct = response[0].product_name;

                        connection.query("UPDATE products SET ? WHERE ?",
                            [
                                {
                                    stock_quantity: newQuantity
                                },
                                {
                                    product_name: currentProduct
                                }
                            ]
                        );

                        console.log("Inventory added!  New " + currentProduct + " quantity: " + newQuantity);
                        runAgain();
                    }
                );
            });
    });
}

function addNewProduct() {
    inquirer.prompt
        (
        [
            {
                type: "input",
                name: "product",
                message: "What product would you like to add?"
            },
            {
                type: "input",
                name: "quantity",
                message: "How many do you want to add?"
            },
            {
                type: "input",
                name: "price",
                message: "What is the cost/unit?"
            },
            {
                type: "input",
                name: "department",
                message: "What department should the product be listed in?"
            }
        ]
        ).then(function (response) {
            connection.query("INSERT INTO products SET ?",
                {
                    product_name: response.product,
                    department_name: response.department,
                    price: response.price,
                    stock_quantity: response.quantity
                }, function (err, response) {
                    console.log("Product added!");
                    runAgain();
                }
            )
        });
}